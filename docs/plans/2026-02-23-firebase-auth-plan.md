# Firebase Auth — Parent Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Firebase Authentication (Google, email magic link, phone OTP) to the Parent Portal so parents can securely log in and the API can verify their identity and resolve their Family record.

**Architecture:** Firebase Admin SDK in the API verifies JWTs and looks up the Family by `primaryEmail`. The Parent Portal wraps all routes in a `ProtectedRoute`, attaches Bearer tokens to every API call, and shows an "Account not found" help form when the API returns `403 FAMILY_NOT_FOUND`. Existing `/stub/` routes are untouched for local dev.

**Tech Stack:** firebase-admin (API), firebase (frontend), React Context, Prisma migration, Jest + supertest (API tests)

---

## Task 1: Add PendingRegistration to Prisma schema

**Files:**
- Modify: `platform/api/prisma/schema.prisma`
- Create: `platform/api/prisma/migrations/` (auto-generated)

**Step 1: Add the model to the schema**

At the end of `platform/api/prisma/schema.prisma`, append:

```prisma
model PendingRegistration {
  id               String   @id @default(cuid())
  email            String
  phone            String?
  childName        String?
  partnerName      String?
  locationEnrolled String?
  createdAt        DateTime @default(now())

  @@map("pending_registrations")
}
```

**Step 2: Create and apply the migration**

```bash
cd platform/api
npx prisma migrate dev --name add-pending-registration
```

Expected: Migration file created in `prisma/migrations/`, Prisma Client regenerated.

**Step 3: Verify Prisma Client updated**

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log(typeof p.pendingRegistration.create);"
```

Expected: prints `function`

**Step 4: Commit**

```bash
git add platform/api/prisma/schema.prisma platform/api/prisma/migrations/
git commit -m "feat(api): add PendingRegistration model and migration"
```

---

## Task 2: Install firebase-admin + create requireAuth middleware

**Files:**
- Modify: `platform/api/package.json` (via npm install)
- Create: `platform/api/src/middleware/requireAuth.js`
- Create: `platform/api/src/lib/firebaseAdmin.js`
- Create: `platform/api/src/__tests__/requireAuth.test.js`

**Step 1: Install firebase-admin**

```bash
cd platform/api
npm install firebase-admin
```

**Step 2: Write the failing tests first**

Create `platform/api/src/__tests__/requireAuth.test.js`:

```js
/**
 * Unit tests for requireAuth middleware.
 * Mocks firebase-admin so no real Firebase project is needed.
 */

jest.mock('../lib/firebaseAdmin');

const { verifyIdToken } = require('../lib/firebaseAdmin');
const requireAuth = require('../middleware/requireAuth');

// Minimal Prisma mock — only needs family.findUnique
jest.mock('../db', () => ({
  family: {
    findUnique: jest.fn(),
  },
}));
const prisma = require('../db');

function mockReqRes() {
  const req = { headers: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => jest.clearAllMocks());

describe('requireAuth middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const { req, res, next } = mockReqRes();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = 'Bearer bad-token';
    verifyIdToken.mockRejectedValue(new Error('invalid token'));
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 FAMILY_NOT_FOUND when email has no matching family', async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = 'Bearer valid-token';
    verifyIdToken.mockResolvedValue({ email: 'unknown@example.com' });
    prisma.family.findUnique.mockResolvedValue(null);
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ code: 'FAMILY_NOT_FOUND' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches familyId and userEmail to req and calls next when valid', async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = 'Bearer valid-token';
    verifyIdToken.mockResolvedValue({ email: 'parent@example.com' });
    prisma.family.findUnique.mockResolvedValue({ id: 'fam-123' });
    await requireAuth(req, res, next);
    expect(req.familyId).toBe('fam-123');
    expect(req.userEmail).toBe('parent@example.com');
    expect(next).toHaveBeenCalled();
  });
});
```

**Step 3: Run tests to confirm they fail**

```bash
cd platform/api
npm test -- --testPathPattern=requireAuth
```

Expected: FAIL — `Cannot find module '../lib/firebaseAdmin'` or similar.

**Step 4: Create firebaseAdmin.js**

Create `platform/api/src/lib/firebaseAdmin.js`:

```js
const admin = require('firebase-admin');

// In local dev with the emulator, FIREBASE_AUTH_EMULATOR_HOST is set.
// In production, FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY are set.
if (!admin.apps.length) {
  const credential = process.env.FIREBASE_CLIENT_EMAIL
    ? admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    : admin.credential.applicationDefault();

  admin.initializeApp({ credential });
}

async function verifyIdToken(token) {
  return admin.auth().verifyIdToken(token);
}

module.exports = { verifyIdToken };
```

**Step 5: Create requireAuth.js middleware**

Create `platform/api/src/middleware/requireAuth.js`:

```js
const { verifyIdToken } = require('../lib/firebaseAdmin');
const prisma = require('../db');

/**
 * Express middleware: verifies Firebase ID token, resolves Family by email.
 * Attaches req.familyId and req.userEmail on success.
 * Returns 401 for missing/invalid token, 403 { code: 'FAMILY_NOT_FOUND' } if
 * the authenticated email doesn't match any Family.primaryEmail.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);

  let decoded;
  try {
    decoded = await verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const family = await prisma.family.findUnique({
    where: { primaryEmail: decoded.email },
    select: { id: true },
  });

  if (!family) {
    return res.status(403).json({ code: 'FAMILY_NOT_FOUND' });
  }

  req.familyId = family.id;
  req.userEmail = decoded.email;
  next();
}

module.exports = requireAuth;
```

**Step 6: Run tests and confirm they pass**

```bash
cd platform/api
npm test -- --testPathPattern=requireAuth
```

Expected: PASS — 4 tests passing.

**Step 7: Commit**

```bash
git add platform/api/src/lib/firebaseAdmin.js platform/api/src/middleware/requireAuth.js platform/api/src/__tests__/requireAuth.test.js platform/api/package.json platform/api/package-lock.json
git commit -m "feat(api): add Firebase Admin SDK and requireAuth middleware"
```

---

## Task 3: Add POST /api/v1/parent/pending-registration route

**Files:**
- Create: `platform/api/src/routes/pendingRegistration.js`
- Modify: `platform/api/src/app.js`
- Modify: `platform/api/src/__tests__/parent.integration.test.js`

**Step 1: Write the failing test**

Add a new `describe` block at the bottom of `platform/api/src/__tests__/parent.integration.test.js`:

```js
describe('POST /api/v1/parent/pending-registration', () => {
  it('returns 201 and stores the submission', async () => {
    const payload = {
      email:           'new.parent@example.com',
      phone:           '0400 000 000',
      childName:       'Emma',
      partnerName:     'James',
      locationEnrolled: 'Brisbane',
    };
    const res = await request(app)
      .post('/api/v1/parent/pending-registration')
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe(payload.email);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/parent/pending-registration')
      .send({ phone: '0400 000 000' });
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run to confirm failure**

```bash
cd platform/api
npm test -- --testPathPattern=parent.integration
```

Expected: FAIL — `POST /api/v1/parent/pending-registration` returns 404.

**Step 3: Create the route**

Create `platform/api/src/routes/pendingRegistration.js`:

```js
const express = require('express');
const router = express.Router();
const prisma = require('../db');

// ── POST /api/v1/parent/pending-registration ──────────────────────────────────
// No auth required — this is the fallback for parents whose email isn't in the DB.
// Stores their details so an admin can manually link them to a Family record.
router.post('/parent/pending-registration', async (req, res, next) => {
  try {
    const { email, phone, childName, partnerName, locationEnrolled } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const record = await prisma.pendingRegistration.create({
      data: { email, phone, childName, partnerName, locationEnrolled },
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

**Step 4: Register the route in app.js**

In `platform/api/src/app.js`, add after the existing require statements:

```js
const pendingRegistrationRoutes = require('./routes/pendingRegistration');
```

And after `app.use('/api/v1', staffRoutes);`:

```js
app.use('/api/v1', pendingRegistrationRoutes);
```

**Step 5: Run tests and confirm they pass**

```bash
cd platform/api
npm test -- --testPathPattern=parent.integration
```

Expected: PASS.

**Step 6: Commit**

```bash
git add platform/api/src/routes/pendingRegistration.js platform/api/src/app.js platform/api/src/__tests__/parent.integration.test.js
git commit -m "feat(api): add pending-registration route"
```

---

## Task 4: Install Firebase client SDK + create firebase.js config

**Files:**
- Modify: `platform/parent-portal/package.json` (via npm install)
- Create: `platform/parent-portal/src/lib/firebase.js`

**Step 1: Install Firebase**

```bash
cd platform/parent-portal
npm install firebase
```

**Step 2: Create firebase.js**

Create `platform/parent-portal/src/lib/firebase.js`:

```js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to the local emulator in development
if (import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

export { auth };
```

**Step 3: Add env vars to .env.example**

In the root `platform/` directory (or wherever the portal dev env is), check for an `.env` or `.env.example` file in `platform/parent-portal/`. Add:

```
# Firebase (client)
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_FIREBASE_USE_EMULATOR=true
```

Check where the existing `.env` files live:
```bash
ls platform/parent-portal/.env* 2>/dev/null || ls platform/.env* 2>/dev/null
```

Add the variables to the appropriate file (if `.env` exists, update it; if only `.env.example` exists, update that).

**Step 4: Verify build still works**

```bash
cd platform/parent-portal
npm run build
```

Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add platform/parent-portal/src/lib/firebase.js platform/parent-portal/package.json platform/parent-portal/package-lock.json
git commit -m "feat(portal): install Firebase SDK and configure auth client"
```

---

## Task 5: Create AuthProvider + update api.js for Bearer tokens

**Files:**
- Create: `platform/parent-portal/src/contexts/AuthContext.jsx`
- Modify: `platform/parent-portal/src/lib/api.js`
- Modify: `platform/parent-portal/src/main.jsx`

**Step 1: Create AuthContext.jsx**

Create `platform/parent-portal/src/contexts/AuthContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { setCurrentUser } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null = loading, false = signed out, object = signed in
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);  // keep api.js in sync
      setUser(firebaseUser ?? false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

**Step 2: Update api.js to attach Bearer token**

Replace the contents of `platform/parent-portal/src/lib/api.js` with:

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Set by AuthProvider after Firebase auth state changes.
// Firebase's getIdToken() auto-refreshes expired tokens.
let _currentUser = null;

export function setCurrentUser(user) {
  _currentUser = user;
}

async function authHeaders() {
  if (!_currentUser) return {};
  const token = await _currentUser.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function patch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
```

**Step 3: Wrap main.jsx with AuthProvider**

In `platform/parent-portal/src/main.jsx`, add the import and wrap:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.jsx';
import router from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

**Step 4: Verify build**

```bash
cd platform/parent-portal
npm run build
```

Expected: Build succeeds.

**Step 5: Commit**

```bash
git add platform/parent-portal/src/contexts/AuthContext.jsx platform/parent-portal/src/lib/api.js platform/parent-portal/src/main.jsx
git commit -m "feat(portal): add AuthProvider and attach Bearer token to API calls"
```

---

## Task 6: Create LoginPage + ProtectedRoute + update router

**Files:**
- Create: `platform/parent-portal/src/pages/LoginPage.jsx`
- Create: `platform/parent-portal/src/components/ProtectedRoute.jsx`
- Modify: `platform/parent-portal/src/App.jsx`

**Step 1: Create ProtectedRoute.jsx**

Create `platform/parent-portal/src/components/ProtectedRoute.jsx`:

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Renders child routes when authenticated.
 * Shows a loading spinner while Firebase resolves auth state.
 * Redirects to /login when signed out.
 */
export default function ProtectedRoute() {
  const { user } = useAuth();

  // null = still loading (Firebase hasn't resolved yet)
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-400 text-sm">Loading…</span>
      </div>
    );
  }

  if (user === false) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

**Step 2: Create LoginPage.jsx**

Create `platform/parent-portal/src/pages/LoginPage.jsx`:

```jsx
import { useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { Icon } from '@iconify/react';

const EMAIL_LINK_STORAGE_KEY = 'emailForSignIn';

// Handle email magic link completion on page load
if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
  if (!email) email = prompt('Please confirm your email address:');
  if (email) {
    signInWithEmailLink(auth, email, window.location.href)
      .then(() => localStorage.removeItem(EMAIL_LINK_STORAGE_KEY))
      .catch(console.error);
  }
}

export default function LoginPage() {
  const [tab, setTab]         = useState('google');   // 'google' | 'email' | 'phone'
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [confirm, setConfirm] = useState(null);       // ConfirmationResult from phone
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // ── Google ──────────────────────────────────────────────────────────────────
  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // AuthProvider / onAuthStateChanged handles the rest
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Email magic link ─────────────────────────────────────────────────────────
  async function handleEmailLink(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.href,
        handleCodeInApp: true,
      });
      localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Phone OTP ────────────────────────────────────────────────────────────────
  async function handlePhoneSend(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirm(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirm.confirm(otp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="text-3xl font-bold font-heading">🚀 Rocket Academy</span>
          <p className="mt-2 text-slate-500 text-sm">Sign in to your parent portal</p>
        </div>

        {/* Tab selector */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 gap-1">
          {[
            { key: 'google', label: 'Google'  },
            { key: 'email',  label: 'Email'   },
            { key: 'phone',  label: 'Phone'   },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(''); setSent(false); setConfirm(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm text-rose-500 bg-rose-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Google */}
        {tab === 'google' && (
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3.5 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Icon icon="logos:google-icon" className="w-5 h-5" />
            Continue with Google
          </button>
        )}

        {/* Email magic link */}
        {tab === 'email' && !sent && (
          <form onSubmit={handleEmailLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}
        {tab === 'email' && sent && (
          <div className="text-center py-6">
            <Icon icon="lucide:mail-check" className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="font-medium text-slate-700">Check your inbox</p>
            <p className="text-sm text-slate-400 mt-1">We sent a sign-in link to <strong>{email}</strong></p>
          </div>
        )}

        {/* Phone OTP */}
        {tab === 'phone' && !confirm && (
          <form onSubmit={handlePhoneSend} className="space-y-3">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+61 400 000 000"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}
        {tab === 'phone' && confirm && (
          <form onSubmit={handlePhoneVerify} className="space-y-3">
            <p className="text-sm text-slate-500 text-center">Enter the 6-digit code sent to {phone}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="000000"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify code'}
            </button>
          </form>
        )}

        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
```

**Step 3: Update App.jsx router**

Replace the contents of `platform/parent-portal/src/App.jsx`:

```jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ParentLayout from './components/ParentLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ParentDashboard from './pages/ParentDashboard.jsx';
import ChildDetail from './pages/ChildDetail.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/',      element: <Navigate to="/parent" replace /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ParentLayout />,
        children: [
          { path: '/parent',               element: <ParentDashboard /> },
          { path: '/parent/children/:id',  element: <ChildDetail /> },
          { path: '/parent/calendar',      element: <CalendarPage /> },
          { path: '/parent/billing',       element: <BillingPage /> },
          { path: '/parent/messages',      element: <MessagesPage /> },
          { path: '/parent/profile',       element: <ProfilePage /> },
        ],
      },
    ],
  },
]);

export default router;
```

**Step 4: Verify build**

```bash
cd platform/parent-portal
npm run build
```

Expected: Build succeeds.

**Step 5: Commit**

```bash
git add platform/parent-portal/src/pages/LoginPage.jsx platform/parent-portal/src/components/ProtectedRoute.jsx platform/parent-portal/src/App.jsx
git commit -m "feat(portal): add LoginPage with Google/email/phone sign-in and ProtectedRoute"
```

---

## Task 7: Create AccountNotFoundPage with help form

**Files:**
- Create: `platform/parent-portal/src/pages/AccountNotFoundPage.jsx`
- Modify: `platform/parent-portal/src/App.jsx`

**Step 1: Create AccountNotFoundPage.jsx**

Create `platform/parent-portal/src/pages/AccountNotFoundPage.jsx`:

```jsx
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { Icon } from '@iconify/react';
import { auth } from '../lib/firebase.js';
import { post } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AccountNotFoundPage() {
  const { user } = useAuth();
  const [form, setForm]       = useState({ phone: '', childName: '', partnerName: '', locationEnrolled: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await post('/api/v1/parent/pending-registration', {
        email: user.email,
        ...form,
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <Icon icon="lucide:check-circle" className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">Request received</h1>
          <p className="text-slate-500 text-sm">We'll be in touch within 1 business day.</p>
          <button
            onClick={() => signOut(auth)}
            className="mt-8 text-sm text-slate-400 hover:text-slate-600 underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="mb-8 text-center">
          <Icon icon="lucide:user-x" className="w-10 h-10 mx-auto mb-4 text-slate-300" />
          <h1 className="text-2xl font-bold mb-2">Account not found</h1>
          <p className="text-slate-500 text-sm">
            We couldn't find a Rocket Academy account for <strong>{user?.email}</strong>.
            Fill in your details below and we'll get you set up.
          </p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-rose-500 bg-rose-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="phone"
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="childName"
            type="text"
            placeholder="Child's name"
            value={form.childName}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="partnerName"
            type="text"
            placeholder="Partner's name (if applicable)"
            value={form.partnerName}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="locationEnrolled"
            type="text"
            placeholder="Campus / location enrolled"
            value={form.locationEnrolled}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Submit'}
          </button>
        </form>

        <button
          onClick={() => signOut(auth)}
          className="mt-6 w-full text-sm text-slate-400 hover:text-slate-600 underline"
        >
          Sign out and try a different account
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Add the route in App.jsx**

In `platform/parent-portal/src/App.jsx`, add the import:

```jsx
import AccountNotFoundPage from './pages/AccountNotFoundPage.jsx';
```

Add the route inside the `ProtectedRoute` children (before the `ParentLayout` entry):

```jsx
{ path: '/account-not-found', element: <AccountNotFoundPage /> },
```

**Step 3: Handle FAMILY_NOT_FOUND in ProtectedRoute**

The `requireAuth` middleware returns `403 { code: 'FAMILY_NOT_FOUND' }` on authenticated requests. However, the portal's API calls are made by React Query after mount — by the time a 403 is returned, the user is already on a portal page.

The cleanest place to catch this is in the `get` function in `api.js`. Update it to throw a typed error:

In `platform/parent-portal/src/lib/api.js`, update `get`:

```js
export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: await authHeaders(),
  });
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const err = new Error('Forbidden');
    err.code = body.code;
    throw err;
  }
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
```

Then in `ProtectedRoute.jsx`, add a global error boundary or handle it in the `AuthProvider`. The simplest approach: add a `familyNotFound` state to `AuthContext` that gets set when any query throws `FAMILY_NOT_FOUND`, then redirect in `ProtectedRoute`.

Update `AuthContext.jsx` to expose `familyNotFound` state:

```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { setCurrentUser } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [familyNotFound, setFamilyNotFound] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setUser(firebaseUser ?? false);
      if (!firebaseUser) setFamilyNotFound(false); // reset on sign-out
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, familyNotFound, setFamilyNotFound }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

Update `ProtectedRoute.jsx` to redirect when `familyNotFound` is true:

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, familyNotFound } = useAuth();

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-400 text-sm">Loading…</span>
      </div>
    );
  }

  if (user === false)    return <Navigate to="/login" replace />;
  if (familyNotFound)    return <Navigate to="/account-not-found" replace />;

  return <Outlet />;
}
```

Update `api.js` to call `setFamilyNotFound` on 403. Since `api.js` is a plain module (not a React component), pass a callback in. Add to `api.js`:

```js
let _onFamilyNotFound = null;

export function setFamilyNotFoundCallback(fn) {
  _onFamilyNotFound = fn;
}
```

In `get`:
```js
if (res.status === 403) {
  const body = await res.json().catch(() => ({}));
  if (body.code === 'FAMILY_NOT_FOUND' && _onFamilyNotFound) {
    _onFamilyNotFound();
  }
  const err = new Error('Forbidden');
  err.code = body.code;
  throw err;
}
```

And in `AuthContext.jsx`, after setting `setCurrentUser`:
```js
import { setCurrentUser, setFamilyNotFoundCallback } from '../lib/api.js';
// inside the useEffect, after onAuthStateChanged resolves:
setFamilyNotFoundCallback(() => setFamilyNotFound(true));
```

**Step 4: Verify build**

```bash
cd platform/parent-portal
npm run build
```

Expected: Build succeeds.

**Step 5: Commit**

```bash
git add platform/parent-portal/src/pages/AccountNotFoundPage.jsx platform/parent-portal/src/App.jsx platform/parent-portal/src/components/ProtectedRoute.jsx platform/parent-portal/src/contexts/AuthContext.jsx platform/parent-portal/src/lib/api.js
git commit -m "feat(portal): add AccountNotFoundPage and FAMILY_NOT_FOUND redirect"
```

---

## Task 8: Add sign-out to ParentLayout sidebar

**Files:**
- Modify: `platform/parent-portal/src/components/ParentLayout.jsx`

**Step 1: Add sign-out button**

In `platform/parent-portal/src/components/ParentLayout.jsx`, add the import:

```jsx
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
```

Replace the existing footer `<div>` in the desktop sidebar (the one containing `<p className="text-xs text-slate-400">Parent Portal</p>`) with:

```jsx
<div className="px-4 pt-6 border-t border-slate-100 space-y-2">
  <p className="text-xs text-slate-400">Parent Portal</p>
  <button
    onClick={() => signOut(auth)}
    className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
  >
    <Icon icon="lucide:log-out" className="w-3.5 h-3.5" />
    Sign out
  </button>
</div>
```

Also add a sign-out button in the mobile drawer, below the nav links:

```jsx
<div className="mt-6 pt-6 border-t border-slate-100">
  <button
    onClick={() => { signOut(auth); setDrawerOpen(false); }}
    className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
  >
    <Icon icon="lucide:log-out" className="w-4 h-4" />
    Sign out
  </button>
</div>
```

**Step 2: Verify build**

```bash
cd platform/parent-portal
npm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add platform/parent-portal/src/components/ParentLayout.jsx
git commit -m "feat(portal): add sign-out button to sidebar"
```

---

## Task 9: Update env files and docker-compose for Firebase emulator

**Files:**
- Modify: `platform/api/.env` (or `.env.example`)
- Check: `docker-compose.infra.yml` for Firebase emulator config

**Step 1: Check current docker-compose Firebase config**

```bash
cat docker-compose.infra.yml | grep -A 20 firebase
```

Check whether the Firebase Auth emulator port (9099) is already exposed.

**Step 2: Ensure Firebase Auth emulator is exposed**

In `docker-compose.infra.yml`, the Firebase emulator service should expose port 9099. If it's not listed, add `"9099:9099"` to the ports. Verify the `firebase.json` in the project root (if it exists) has auth emulator configured:

```bash
cat firebase.json 2>/dev/null || echo "No firebase.json found"
```

If `firebase.json` doesn't exist, create it at `platform/firebase.json`:

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "ui":   { "enabled": true, "port": 4000 }
  }
}
```

**Step 3: Add API env vars for emulator**

In `platform/api/.env` (or `.env.example`), add:

```
# Firebase Admin (local emulator — no real credentials needed)
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_PROJECT_ID=demo-project
```

For production (in Vercel env vars — NOT in `.env`):
```
FIREBASE_PROJECT_ID=<real project id>
FIREBASE_CLIENT_EMAIL=<service account email>
FIREBASE_PRIVATE_KEY=<service account private key>
```

**Step 4: Add portal env vars**

In `platform/parent-portal/.env` (or `.env.example`):

```
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_FIREBASE_USE_EMULATOR=true
VITE_API_URL=http://localhost:3001
```

**Step 5: Verify full stack starts**

```bash
# From repo root
make infra/up   # or docker-compose -f docker-compose.infra.yml up -d
cd platform/api && npm run dev &
cd platform/parent-portal && npm run dev &
```

Expected: API on :3001, portal on :5173, Firebase emulator UI on :4000.

Navigate to `http://localhost:5173` — should redirect to `/login`.

**Step 6: Commit**

```bash
git add firebase.json docker-compose.infra.yml platform/api/.env.example platform/parent-portal/.env.example 2>/dev/null
git commit -m "chore: configure Firebase Auth emulator for local development"
```

---

## Done

At this point:
- Parents are redirected to `/login` when unauthenticated
- They can sign in via Google, email magic link, or phone OTP
- The API verifies their JWT and resolves their Family record
- Unknown emails are redirected to `/account-not-found` with a help form
- Sign-out is available in the sidebar
- All `/stub/` routes remain intact for local development
