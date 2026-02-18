# Parent Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a parent-facing portal inside `platform/` as a standalone Vite + React app (`parent-portal/`), sharing a minimal `@ra/ui` design library with the existing `admin/` app via Vite path alias, backed by new `GET/PATCH /api/v1/parent/*` routes in `platform/api`.

**Architecture:** Level 2 Micro Frontend — `platform/ui/` holds shared Tailwind preset and a Badge component; both `admin/` and `parent-portal/` consume it via a `@ra/ui` Vite alias (resolving to `../../ui/src`). The parent-portal has five pages (Dashboard, ChildDetail, Billing, Messages, Profile) served on port 5174. API routes use a stub family pattern identical to the existing instructor stub.

**Tech Stack:** React 18 + Vite + React Router DOM v6 + TanStack React Query + Tailwind CSS (white/slate aesthetic matching HTML mockup #06) + `@iconify/react`. Tests via Jest + Prisma against the live database (matching `family.integration.test.js` pattern).

**Design reference:** `platform/Docs/UI Designs/06-rocket-academy-parent-dashboard.html` — white bg, `slate-50` cards, `rounded-2xl` borders, Satoshi + General Sans fonts, black primary buttons, pill badges.

**Stub family:** `nguyen.family@gmail.com` (Nguyen Family, Liam Nguyen, cohort 1 — seeded by `npx prisma db seed`).

---

## Prerequisites

Before starting, verify the database is seeded:
```bash
cd platform/api
DATABASE_URL=<your-db-url> npx prisma db seed
```

Expected: seed completes with no errors and families/students/enrolments exist.

---

### Task 1: Create the `@ra/ui` shared package scaffold

**Files:**
- Create: `platform/ui/package.json`
- Create: `platform/ui/tailwind.preset.js`
- Create: `platform/ui/src/lib/utils.js`
- Create: `platform/ui/src/components/Badge.jsx`
- Create: `platform/ui/src/index.js`

**Step 1: Create `platform/ui/package.json`**

```json
{
  "name": "@ra/ui",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.js",
  "exports": {
    ".": "./src/index.js",
    "./tailwind.preset": "./tailwind.preset.js"
  }
}
```

**Step 2: Create `platform/ui/tailwind.preset.js`**

This is the single source of truth for design tokens across all portals.

```js
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'sans-serif'],
        heading: ['General Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#000000',
          hover: '#1a1a1a',
        },
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
};
```

**Step 3: Create `platform/ui/src/lib/utils.js`**

Install `clsx` and `tailwind-merge` — but since @ra/ui has no build step and no node_modules of its own, we inline a simple implementation:

```js
// Simple cn helper — concatenates class strings, no merging needed for now.
// Upgrade to clsx + tailwind-merge if class conflicts arise.
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
```

**Step 4: Create `platform/ui/src/components/Badge.jsx`**

Maps enrolment and attendance status strings to Tailwind color classes. Both admin and parent-portal use these statuses.

```jsx
const STYLES = {
  // Enrolment statuses
  ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  TRIAL:     'bg-sky-50    text-sky-700    border-sky-200',
  WAITLIST:  'bg-amber-50  text-amber-700  border-amber-200',
  DROPPED:   'bg-rose-50   text-rose-700   border-rose-200',
  COMPLETED: 'bg-slate-50  text-slate-600  border-slate-200',
  // Attendance statuses
  PRESENT:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT:    'bg-rose-50   text-rose-700   border-rose-200',
  LATE:      'bg-amber-50  text-amber-700  border-amber-200',
  EXCUSED:   'bg-slate-50  text-slate-600  border-slate-200',
  // Session statuses
  SCHEDULED: 'bg-sky-50    text-sky-700    border-sky-200',
  CANCELLED: 'bg-rose-50   text-rose-700   border-rose-200',
};

export function Badge({ status, className = '' }) {
  const style = STYLES[status] ?? 'bg-slate-50 text-slate-500 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${style} ${className}`}>
      {status}
    </span>
  );
}
```

**Step 5: Create `platform/ui/src/index.js`**

```js
export { Badge } from './components/Badge.jsx';
export { cn } from './lib/utils.js';
```

**Step 6: Commit**

```bash
git add platform/ui/
git commit -m "feat(ui): scaffold @ra/ui shared package with Badge component and Tailwind preset"
```

---

### Task 2: Update `admin/` to consume `@ra/ui` via Vite alias

**Files:**
- Modify: `platform/admin/vite.config.js`
- Modify: `platform/admin/tailwind.config.js`

**Step 1: Update `platform/admin/vite.config.js`**

Add a `resolve.alias` so `import { Badge } from '@ra/ui'` resolves to the local source.

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ra/ui': path.resolve(__dirname, '../ui/src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
```

**Step 2: Update `platform/admin/tailwind.config.js`**

```js
import preset from '../ui/tailwind.preset.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../ui/src/**/*.{js,jsx}',  // include ui components in purge scan
  ],
  theme: { extend: {} },
  plugins: [],
};
```

**Step 3: Verify admin still starts**

```bash
cd platform/admin
npm run dev
```

Expected: dev server starts on port 5173, no errors in terminal.

**Step 4: Commit**

```bash
git add platform/admin/vite.config.js platform/admin/tailwind.config.js
git commit -m "feat(admin): wire @ra/ui Vite alias and Tailwind preset"
```

---

### Task 3: Scaffold the `parent-portal` Vite app

**Files:**
- Create: `platform/parent-portal/package.json`
- Create: `platform/parent-portal/vite.config.js`
- Create: `platform/parent-portal/tailwind.config.js`
- Create: `platform/parent-portal/postcss.config.js`
- Create: `platform/parent-portal/index.html`
- Create: `platform/parent-portal/src/main.jsx`
- Create: `platform/parent-portal/src/index.css`
- Create: `platform/parent-portal/src/lib/api.js`
- Create: `platform/parent-portal/src/lib/queryKeys.js`
- Create: `platform/parent-portal/src/App.jsx`

**Step 1: Create `platform/parent-portal/package.json`**

```json
{
  "name": "parent-portal",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@iconify/react": "^4.1.1",
    "@tanstack/react-query": "^5.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.4.2"
  }
}
```

**Step 2: Create `platform/parent-portal/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ra/ui': path.resolve(__dirname, '../ui/src'),
    },
  },
  server: {
    host: true,
    port: 5174,
  },
});
```

**Step 3: Create `platform/parent-portal/tailwind.config.js`**

```js
import preset from '../ui/tailwind.preset.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../ui/src/**/*.{js,jsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
```

**Step 4: Create `platform/parent-portal/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 5: Create `platform/parent-portal/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rocket Academy | Parent Portal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 6: Create `platform/parent-portal/src/index.css`**

```css
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&f[]=general-sans@600,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

h1, h2, h3 {
  font-family: 'General Sans', sans-serif;
}
```

**Step 7: Create `platform/parent-portal/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import router from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Step 8: Create `platform/parent-portal/src/lib/api.js`**

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function patch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
```

**Step 9: Create `platform/parent-portal/src/lib/queryKeys.js`**

Centralised query key constants prevent typos when invalidating cache.

```js
export const QUERY_KEYS = {
  family:     () => ['parent', 'family'],
  attendance: (studentId) => ['parent', 'attendance', studentId],
  invoices:   () => ['parent', 'invoices'],
  messages:   () => ['parent', 'messages'],
};
```

**Step 10: Create `platform/parent-portal/src/App.jsx` (skeleton)**

```jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Pages imported in later tasks
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/parent" replace /> },
]);

export default router;
```

**Step 11: Install dependencies and verify**

```bash
cd platform/parent-portal
npm install
npm run dev
```

Expected: Vite starts on port 5174, browser shows blank white page (no errors in console).

**Step 12: Commit**

```bash
git add platform/parent-portal/
git commit -m "feat(parent-portal): scaffold Vite + React app on port 5174 with @ra/ui alias"
```

---

### Task 4: Add parent API routes in `platform/api`

**Files:**
- Create: `platform/api/src/routes/parent.js`
- Modify: `platform/api/src/app.js`

**Step 1: Create `platform/api/src/routes/parent.js`**

Uses a stub pattern identical to `instructor.js`. All routes are under `/parent/*`.

```js
const express = require('express');
const router = express.Router();
const prisma = require('../db');

const STUB_FAMILY_EMAIL = 'nguyen.family@gmail.com';

// ── Helper: resolve stub family or 503 ────────────────────────────────────────
async function getStubFamily(res) {
  const family = await prisma.family.findUnique({
    where: { primaryEmail: STUB_FAMILY_EMAIL },
  });
  if (!family) {
    res.status(503).json({
      error: 'Stub family not seeded. Run: cd platform/api && npx prisma db seed',
    });
    return null;
  }
  return family;
}

// ── GET /api/v1/parent/stub ───────────────────────────────────────────────────
// Returns the stub family with all students and their active enrolments.
router.get('/parent/stub', async (req, res, next) => {
  try {
    const family = await prisma.family.findUnique({
      where: { primaryEmail: STUB_FAMILY_EMAIL },
      include: {
        students: {
          include: {
            enrolments: {
              where: { status: { in: ['ACTIVE', 'TRIAL'] } },
              include: {
                cohort: {
                  include: {
                    program: { select: { name: true } },
                    campus:  { select: { name: true } },
                    sessions: {
                      where: {
                        scheduledAt: { gte: new Date() },
                        status: 'SCHEDULED',
                      },
                      orderBy: { scheduledAt: 'asc' },
                      take: 1,
                      select: { scheduledAt: true, durationMinutes: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!family) {
      return res.status(503).json({
        error: 'Stub family not seeded. Run: cd platform/api && npx prisma db seed',
      });
    }

    res.json({
      id:             family.id,
      name:           family.name,
      primaryEmail:   family.primaryEmail,
      primaryPhone:   family.primaryPhone,
      addressStreet:  family.addressStreet,
      addressCity:    family.addressCity,
      addressState:   family.addressState,
      addressPostcode: family.addressPostcode,
      students: family.students.map(s => ({
        id:        s.id,
        firstName: s.firstName,
        lastName:  s.lastName,
        birthDate: s.birthDate,
        gender:    s.gender,
        enrolments: s.enrolments.map(e => ({
          id:        e.id,
          status:    e.status,
          startDate: e.startDate,
          cohort: {
            id:      e.cohort.id,
            name:    e.cohort.name,
            program: e.cohort.program,
            campus:  e.cohort.campus,
            nextSession: e.cohort.sessions[0] ?? null,
          },
        })),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/parent/stub/students/:studentId/attendance ───────────────────
// Returns all attendance records for a student, newest first.
router.get('/parent/stub/students/:studentId/attendance', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;

    // Security: ensure the student belongs to the stub family
    const student = await prisma.student.findFirst({
      where: { id: req.params.studentId, familyId: family.id },
      select: { id: true },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const records = await prisma.attendance.findMany({
      where: { studentId: req.params.studentId },
      include: {
        session: {
          select: {
            scheduledAt: true,
            durationMinutes: true,
            cohort: { select: { name: true } },
          },
        },
      },
      orderBy: { session: { scheduledAt: 'desc' } },
    });

    res.json(records.map(r => ({
      id:        r.id,
      status:    r.status,
      notes:     r.notes,
      session: {
        scheduledAt:     r.session.scheduledAt,
        durationMinutes: r.session.durationMinutes,
        cohortName:      r.session.cohort.name,
      },
    })));
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/parent/stub/invoices ─────────────────────────────────────────
// Returns all invoices for the stub family (empty array until billing is built).
router.get('/parent/stub/invoices', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;
    // Billing model not yet in schema — return empty array as stub
    res.json([]);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/parent/stub/messages ─────────────────────────────────────────
// Returns all message threads (empty until messaging is built).
router.get('/parent/stub/messages', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;
    res.json([]);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/v1/parent/stub ─────────────────────────────────────────────────
// Updates contact details for the stub family. Only whitelisted fields.
router.patch('/parent/stub', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;

    const { name, primaryPhone, addressStreet, addressCity, addressState, addressPostcode } = req.body;

    const updated = await prisma.family.update({
      where: { id: family.id },
      data: {
        ...(name            !== undefined && { name }),
        ...(primaryPhone    !== undefined && { primaryPhone }),
        ...(addressStreet   !== undefined && { addressStreet }),
        ...(addressCity     !== undefined && { addressCity }),
        ...(addressState    !== undefined && { addressState }),
        ...(addressPostcode !== undefined && { addressPostcode }),
      },
      select: {
        id: true, name: true, primaryEmail: true, primaryPhone: true,
        addressStreet: true, addressCity: true, addressState: true, addressPostcode: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

**Step 2: Update `platform/api/src/app.js`**

Register the new routes and expand CORS to accept both admin (5173) and parent-portal (5174).

```js
const express = require('express');
const cors = require('cors');
const prisma = require('./db');
const instructorRoutes = require('./routes/instructor');
const sessionRoutes = require('./routes/sessions');
const parentRoutes = require('./routes/parent');

const app = express();

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, curl)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
}));

app.use(express.json());

app.use('/api/v1', instructorRoutes);
app.use('/api/v1', sessionRoutes);
app.use('/api/v1', parentRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

module.exports = app;
```

**Step 3: Update `docker-compose.yml` CORS_ORIGIN**

Find the `CORS_ORIGIN` line in the `api` service environment and change it to accept both origins:

```yaml
CORS_ORIGIN: http://localhost:5173,http://localhost:5174
```

**Step 4: Commit**

```bash
git add platform/api/src/routes/parent.js platform/api/src/app.js platform/docker-compose.yml
git commit -m "feat(api): add parent portal stub routes (family, attendance, invoices, messages, profile patch)"
```

---

### Task 5: Integration tests for parent API routes

**Files:**
- Create: `platform/api/src/__tests__/parent.integration.test.js`

**Note:** These tests run against the real database. `DATABASE_URL` must be set. The stub family must be seeded. Follow the same pattern as `family.integration.test.js`.

**Step 1: Write the test file**

```js
/**
 * Integration tests for parent portal API routes.
 *
 * Tests verify:
 * 1. GET /parent/stub returns family with students and enrolments.
 * 2. GET /parent/stub/students/:id/attendance returns records (empty if no seed data).
 * 3. GET /parent/stub/invoices returns empty array (billing not yet modelled).
 * 4. PATCH /parent/stub updates contact fields without touching email.
 * 5. PATCH /parent/stub ignores unknown fields (does not throw).
 *
 * Requires DATABASE_URL to be set and seed data to be present.
 */

const request = require('supertest');
const app = require('../app');

const STUB_EMAIL = 'nguyen.family@gmail.com';

describe('Parent portal stub routes', () => {
  describe('GET /api/v1/parent/stub', () => {
    it('returns 200 with family name and students array', async () => {
      const res = await request(app).get('/api/v1/parent/stub');
      expect(res.status).toBe(200);
      expect(res.body.primaryEmail).toBe(STUB_EMAIL);
      expect(Array.isArray(res.body.students)).toBe(true);
    });

    it('includes cohort and campus on each enrolment', async () => {
      const res = await request(app).get('/api/v1/parent/stub');
      expect(res.status).toBe(200);
      const enrolments = res.body.students.flatMap(s => s.enrolments);
      // Nguyen family has one active student with one enrolment
      expect(enrolments.length).toBeGreaterThanOrEqual(1);
      expect(enrolments[0].cohort.program.name).toBeDefined();
      expect(enrolments[0].cohort.campus.name).toBeDefined();
    });
  });

  describe('GET /api/v1/parent/stub/students/:studentId/attendance', () => {
    let studentId;

    beforeAll(async () => {
      const res = await request(app).get('/api/v1/parent/stub');
      studentId = res.body.students[0].id;
    });

    it('returns 200 with an array (may be empty if no attendance recorded)', async () => {
      const res = await request(app).get(`/api/v1/parent/stub/students/${studentId}/attendance`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 404 for a student not belonging to the stub family', async () => {
      const res = await request(app).get('/api/v1/parent/stub/students/non-existent-id/attendance');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/parent/stub/invoices', () => {
    it('returns 200 with an empty array (billing not yet modelled)', async () => {
      const res = await request(app).get('/api/v1/parent/stub/invoices');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('PATCH /api/v1/parent/stub', () => {
    const originalPhone = '0412345678';

    afterEach(async () => {
      // Restore original phone after each test
      await request(app).patch('/api/v1/parent/stub').send({ primaryPhone: originalPhone });
    });

    it('updates primaryPhone and returns the updated family', async () => {
      const res = await request(app)
        .patch('/api/v1/parent/stub')
        .send({ primaryPhone: '0499999999' });

      expect(res.status).toBe(200);
      expect(res.body.primaryPhone).toBe('0499999999');
    });

    it('does not update primaryEmail (field is not whitelisted)', async () => {
      const res = await request(app)
        .patch('/api/v1/parent/stub')
        .send({ primaryEmail: 'hacker@evil.com' });

      expect(res.status).toBe(200);
      expect(res.body.primaryEmail).toBe(STUB_EMAIL);
    });

    it('ignores unknown fields without throwing', async () => {
      const res = await request(app)
        .patch('/api/v1/parent/stub')
        .send({ unknownField: 'value' });

      expect(res.status).toBe(200);
    });
  });
});
```

**Step 2: Run the tests**

```bash
cd platform/api
DATABASE_URL=postgres://postgres:localdev@localhost:5432/platform npx jest src/__tests__/parent.integration.test.js --verbose
```

Expected: all tests pass. The attendance test returns 200 with `[]` (no attendance records seeded yet — that's correct).

**Step 3: Commit**

```bash
git add platform/api/src/__tests__/parent.integration.test.js
git commit -m "test(api): integration tests for parent portal stub routes"
```

---

### Task 6: `ParentLayout` component and full router

**Files:**
- Create: `platform/parent-portal/src/components/ParentLayout.jsx`
- Modify: `platform/parent-portal/src/App.jsx`

**Step 1: Create `platform/parent-portal/src/components/ParentLayout.jsx`**

Sidebar (desktop) + mobile top-bar drawer. Matches the HTML mockup #06 aesthetic.

```jsx
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Icon } from '@iconify/react';

const NAV_ITEMS = [
  { to: '/parent',          label: 'Dashboard', icon: 'lucide:layout-dashboard', end: true },
  { to: '/parent/billing',  label: 'Billing',   icon: 'lucide:receipt'          },
  { to: '/parent/messages', label: 'Messages',  icon: 'lucide:message-circle'   },
  { to: '/parent/profile',  label: 'Profile',   icon: 'lucide:user'             },
];

function NavItem({ to, label, icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-black text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <Icon icon={icon} className="w-4 h-4 shrink-0" />
      {label}
    </NavLink>
  );
}

export default function ParentLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <span className="text-lg font-bold" style={{ fontFamily: "'General Sans', sans-serif" }}>
          🚀 Rocket Academy
        </span>
        <button onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Icon icon="lucide:menu" className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold" style={{ fontFamily: "'General Sans', sans-serif" }}>
                🚀 Rocket Academy
              </span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <Icon icon="lucide:x" className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map(item => (
                <NavItem key={item.to} {...item} onClick={() => setDrawerOpen(false)} />
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 min-h-screen border-r border-slate-100 px-4 py-8 shrink-0">
          <div className="mb-10 px-4">
            <span className="text-xl font-bold" style={{ fontFamily: "'General Sans', sans-serif" }}>
              🚀 Rocket Academy
            </span>
          </div>
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map(item => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
          <div className="px-4 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">Parent Portal</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 md:px-10 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**Step 2: Update `platform/parent-portal/src/App.jsx` with full router**

```jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ParentLayout from './components/ParentLayout.jsx';
import ParentDashboard from './pages/ParentDashboard.jsx';
import ChildDetail from './pages/ChildDetail.jsx';
import BillingPage from './pages/BillingPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/parent" replace /> },
  {
    element: <ParentLayout />,
    children: [
      { path: '/parent',               element: <ParentDashboard /> },
      { path: '/parent/children/:id',  element: <ChildDetail /> },
      { path: '/parent/billing',       element: <BillingPage /> },
      { path: '/parent/messages',      element: <MessagesPage /> },
      { path: '/parent/profile',       element: <ProfilePage /> },
    ],
  },
]);

export default router;
```

**Step 3: Create stub page files so the router doesn't crash**

Create each of the 5 page files with a minimal placeholder. They'll be filled in subsequent tasks.

`platform/parent-portal/src/pages/ParentDashboard.jsx`:
```jsx
export default function ParentDashboard() {
  return <div className="text-2xl font-semibold">Dashboard</div>;
}
```

Create the same placeholder for: `ChildDetail.jsx`, `BillingPage.jsx`, `MessagesPage.jsx`, `ProfilePage.jsx`.

**Step 4: Verify layout renders**

```bash
cd platform/parent-portal
npm run dev
```

Navigate to `http://localhost:5174`. Expected: sidebar appears on desktop, nav links show, clicking them changes the URL and shows the placeholder text.

**Step 5: Commit**

```bash
git add platform/parent-portal/src/
git commit -m "feat(parent-portal): ParentLayout sidebar with nav + full router wired"
```

---

### Task 7: `ParentDashboard` page

**Files:**
- Modify: `platform/parent-portal/src/pages/ParentDashboard.jsx`
- Create: `platform/parent-portal/src/components/ChildCard.jsx`

**Step 1: Create `platform/parent-portal/src/components/ChildCard.jsx`**

Matches the card design in HTML mockup #06: slate-50 bg, rounded-2xl, avatar initials, cohort info, progress bar, next session, and "View Detailed Progress" link.

```jsx
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Badge } from '@ra/ui';

function formatDateTime(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' at '
    + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
];

export default function ChildCard({ student, index }) {
  const enrolment = student.enrolments[0];
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-6 transition-all duration-200 hover:border-slate-200 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${avatarColor}`}>
            {getInitials(student.firstName, student.lastName)}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{student.firstName} {student.lastName}</h3>
            {enrolment && (
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {enrolment.cohort.campus.name}
              </p>
            )}
          </div>
        </div>
        {enrolment && <Badge status={enrolment.status} />}
      </div>

      {/* Enrolment info or empty state */}
      {enrolment ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Current Course</span>
            <span className="font-medium text-right">{enrolment.cohort.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Program</span>
            <span className="font-medium">{enrolment.cohort.program.name}</span>
          </div>
          {enrolment.cohort.nextSession && (
            <div className="flex items-center gap-2 text-sm text-slate-500 pt-1">
              <Icon icon="lucide:calendar" className="w-4 h-4 shrink-0" />
              <span>Next: {formatDateTime(enrolment.cohort.nextSession.scheduledAt)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">No active enrolments</p>
      )}

      {/* CTA */}
      <Link
        to={`/parent/children/${student.id}`}
        className="block w-full text-center py-3 border border-slate-200 rounded-xl text-sm font-bold hover:bg-white transition-colors"
      >
        View Detailed Progress
      </Link>
    </div>
  );
}
```

**Step 2: Update `platform/parent-portal/src/pages/ParentDashboard.jsx`**

```jsx
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';
import ChildCard from '../components/ChildCard.jsx';

export default function ParentDashboard() {
  const { data: family, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.family(),
    queryFn: () => get('/api/v1/parent/stub'),
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Parent Dashboard</h1>
        {family && (
          <p className="text-slate-500">Welcome back, {family.name.replace(' Family', '')}.</p>
        )}
      </div>

      {/* Children section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Enrolled Students</h2>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="border border-slate-100 p-6 rounded-2xl bg-slate-50 animate-pulse h-56" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-rose-500 text-sm">Failed to load family data. Is the API running?</p>
        )}

        {family && family.students.length === 0 && (
          <p className="text-slate-400 text-sm">No students found. Add a student to get started.</p>
        )}

        {family && family.students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {family.students.map((student, i) => (
              <ChildCard key={student.id} student={student} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

**Step 3: Verify**

```bash
cd platform/parent-portal && npm run dev
```

Navigate to `http://localhost:5174/parent`. Expected: Nguyen family dashboard shows "Liam Nguyen" card with cohort name, campus, and active badge. Card links to `/parent/children/:id`.

**Step 4: Commit**

```bash
git add platform/parent-portal/src/
git commit -m "feat(parent-portal): ParentDashboard with ChildCard component"
```

---

### Task 8: `ChildDetail` page

**Files:**
- Modify: `platform/parent-portal/src/pages/ChildDetail.jsx`

**Step 1: Write `platform/parent-portal/src/pages/ChildDetail.jsx`**

Three tabs: Progress (placeholder), Attendance (table from API), Projects (placeholder).

```jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { get } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';
import { Badge } from '@ra/ui';

const TABS = ['Progress', 'Attendance', 'Projects'];

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function AttendanceTab({ studentId }) {
  const { data: records = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.attendance(studentId),
    queryFn: () => get(`/api/v1/parent/stub/students/${studentId}/attendance`),
  });

  if (isLoading) return <div className="animate-pulse h-32 bg-slate-50 rounded-2xl" />;

  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Icon icon="lucide:calendar-x" className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No attendance records yet.</p>
      </div>
    );
  }

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const rate = Math.round((presentCount / records.length) * 100);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl font-bold">{rate}%</span>
        <span className="text-slate-500 text-sm">attendance rate ({presentCount}/{records.length} sessions)</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Session</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-500">{formatDate(r.session.scheduledAt)}</td>
                <td className="px-6 py-4 font-medium">{r.session.cohortName}</td>
                <td className="px-6 py-4"><Badge status={r.status} /></td>
                <td className="px-6 py-4 text-slate-400 italic">{r.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ChildDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Attendance');

  const { data: family, isLoading } = useQuery({
    queryKey: QUERY_KEYS.family(),
    queryFn: () => get('/api/v1/parent/stub'),
  });

  const student = family?.students.find(s => s.id === id);
  const enrolment = student?.enrolments[0];

  return (
    <div>
      {/* Back link */}
      <Link to="/parent" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <Icon icon="lucide:arrow-left" className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {isLoading && <div className="animate-pulse h-20 bg-slate-50 rounded-2xl mb-8" />}

      {student && (
        <>
          {/* Student header */}
          <div className="flex items-start gap-6 mb-10">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shrink-0">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                {student.firstName} {student.lastName}
              </h1>
              {enrolment && (
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-slate-500 text-sm">{enrolment.cohort.name} · {enrolment.cohort.campus.name}</p>
                  <Badge status={enrolment.status} />
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-slate-50 rounded-xl p-1 w-fit">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'Attendance' && <AttendanceTab studentId={student.id} />}

          {activeTab === 'Progress' && (
            <div className="text-center py-16 text-slate-400">
              <Icon icon="lucide:bar-chart-2" className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Skill progress tracking coming soon.</p>
            </div>
          )}

          {activeTab === 'Projects' && (
            <div className="text-center py-16 text-slate-400">
              <Icon icon="lucide:folder-open" className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Project submissions coming soon.</p>
            </div>
          )}
        </>
      )}

      {!isLoading && !student && (
        <p className="text-rose-500 text-sm">Student not found.</p>
      )}
    </div>
  );
}
```

**Step 2: Verify**

Click "View Detailed Progress" on the dashboard card. Expected: student header with name and cohort, three tabs, Attendance tab shows empty state (no records seeded yet).

**Step 3: Commit**

```bash
git add platform/parent-portal/src/pages/ChildDetail.jsx
git commit -m "feat(parent-portal): ChildDetail page with attendance table and tab shell"
```

---

### Task 9: `BillingPage`

**Files:**
- Modify: `platform/parent-portal/src/pages/BillingPage.jsx`

**Step 1: Write `platform/parent-portal/src/pages/BillingPage.jsx`**

```jsx
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { get } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';
import { Badge } from '@ra/ui';

export default function BillingPage() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.invoices(),
    queryFn: () => get('/api/v1/parent/stub/invoices'),
  });

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Billing</h1>
        <p className="text-slate-500">View your invoices and payment history.</p>
      </div>

      {isLoading && <div className="animate-pulse h-32 bg-slate-50 rounded-2xl" />}

      {!isLoading && invoices.length === 0 && (
        <div className="text-center py-24 text-slate-400">
          <Icon icon="lucide:receipt" className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium mb-1">No invoices yet</p>
          <p className="text-sm">Invoices will appear here once billing is set up.</p>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium font-mono">{inv.number}</td>
                  <td className="px-6 py-4">{inv.description}</td>
                  <td className="px-6 py-4 font-bold">${inv.amountDue.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-400">{inv.dueDate}</td>
                  <td className="px-6 py-4"><Badge status={inv.status} /></td>
                  <td className="px-6 py-4">
                    {inv.status !== 'PAID' && (
                      <button className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-colors">
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify**

Navigate to `http://localhost:5174/parent/billing`. Expected: empty state with receipt icon and "No invoices yet" message (billing model not yet implemented).

**Step 3: Commit**

```bash
git add platform/parent-portal/src/pages/BillingPage.jsx
git commit -m "feat(parent-portal): BillingPage with invoice table and empty state"
```

---

### Task 10: `MessagesPage` and `ProfilePage`

**Files:**
- Modify: `platform/parent-portal/src/pages/MessagesPage.jsx`
- Modify: `platform/parent-portal/src/pages/ProfilePage.jsx`

**Step 1: Write `platform/parent-portal/src/pages/MessagesPage.jsx`**

MVP stub — empty state with CTA. Threading UI deferred until messaging API is built.

```jsx
import { Icon } from '@iconify/react';

export default function MessagesPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Messages</h1>
        <p className="text-slate-500">Communicate with your instructors and campus team.</p>
      </div>

      <div className="text-center py-24 text-slate-400">
        <Icon icon="lucide:message-circle" className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p className="font-medium mb-1">No messages yet</p>
        <p className="text-sm mb-6">Your conversations with instructors will appear here.</p>
        <button className="px-6 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors">
          Message Your Instructor
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Write `platform/parent-portal/src/pages/ProfilePage.jsx`**

Editable family details form. Uses `PATCH /api/v1/parent/stub`. Displays students as a read-only list.

```jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { get, patch } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';

function Field({ label, name, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
      />
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: family, isLoading } = useQuery({
    queryKey: QUERY_KEYS.family(),
    queryFn: () => get('/api/v1/parent/stub'),
  });

  const [form, setForm] = useState({
    name: '', primaryPhone: '',
    addressStreet: '', addressCity: '', addressState: '', addressPostcode: '',
  });
  const [saved, setSaved] = useState(false);

  // Populate form when family data loads
  useEffect(() => {
    if (family) {
      setForm({
        name:           family.name           ?? '',
        primaryPhone:   family.primaryPhone   ?? '',
        addressStreet:  family.addressStreet  ?? '',
        addressCity:    family.addressCity    ?? '',
        addressState:   family.addressState   ?? '',
        addressPostcode: family.addressPostcode ?? '',
      });
    }
  }, [family]);

  const mutation = useMutation({
    mutationFn: (data) => patch('/api/v1/parent/stub', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.family() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate(form);
  }

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-50 rounded-2xl" />;

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Profile</h1>
        <p className="text-slate-500">Manage your family contact details.</p>
      </div>

      <div className="max-w-2xl space-y-10">
        {/* Family details form */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Family Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Family name"   name="name"           value={form.name}           onChange={handleChange} />
            <Field label="Phone"         name="primaryPhone"   value={form.primaryPhone}   onChange={handleChange} type="tel" />
            <Field label="Email"         name="primaryEmail"   value={family?.primaryEmail ?? ''} onChange={() => {}} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Street"     name="addressStreet"   value={form.addressStreet}   onChange={handleChange} />
              <Field label="City"       name="addressCity"     value={form.addressCity}     onChange={handleChange} />
              <Field label="State"      name="addressState"    value={form.addressState}    onChange={handleChange} />
              <Field label="Postcode"   name="addressPostcode" value={form.addressPostcode} onChange={handleChange} />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-6 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {mutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                  <Icon icon="lucide:check-circle" className="w-4 h-4" />
                  Saved
                </span>
              )}
              {mutation.isError && (
                <span className="text-rose-500 text-sm">Failed to save. Try again.</span>
              )}
            </div>
          </form>
        </section>

        {/* Students (read-only) */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Students</h2>
          <div className="space-y-3">
            {family?.students.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-slate-400">
                    {s.gender} · Born {new Date(s.birthDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
```

**Step 3: Verify both pages**

Navigate to `/parent/messages` and `/parent/profile`. Expected:
- Messages: empty state with "Message Your Instructor" button
- Profile: form pre-filled with Nguyen Family details, save button works (check network tab for PATCH request)

**Step 4: Commit**

```bash
git add platform/parent-portal/src/pages/MessagesPage.jsx platform/parent-portal/src/pages/ProfilePage.jsx
git commit -m "feat(parent-portal): MessagesPage stub and ProfilePage with editable family form"
```

---

### Task 11: Add `parent-portal` to Docker Compose and `npm` workspaces root

**Files:**
- Modify: `platform/docker-compose.yml`
- Modify: `platform/Makefile`
- Create: `platform/parent-portal/Dockerfile`
- Create: `platform/package.json`

**Step 1: Create `platform/parent-portal/Dockerfile`**

Matches the pattern of `admin/Dockerfile` exactly.

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS build
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
```

**Step 2: Add `parent-portal` service to `platform/docker-compose.yml`**

Add after the `admin:` service block, before `volumes:`:

```yaml
  parent-portal:
    build:
      context: ./parent-portal
      target: dev
    ports:
      - "5174:5174"
    volumes:
      - ./parent-portal:/app
      - parent_portal_node_modules:/app/node_modules
      - ./ui:/ui   # mount shared @ra/ui source for Vite alias resolution
    environment:
      VITE_API_URL: http://localhost:3001
    depends_on:
      api:
        condition: service_healthy
```

And add to the `volumes:` section at the bottom:

```yaml
  parent_portal_node_modules:
```

Also update the `admin` service to mount `./ui:/ui` for consistency:

```yaml
  admin:
    ...
    volumes:
      - ./admin:/app
      - admin_node_modules:/app/node_modules
      - ./ui:/ui
```

**Step 3: Create `platform/package.json` (npm workspaces root)**

This enables `npm install` at the platform root for local development.

```json
{
  "name": "rocket-academy-platform",
  "private": true,
  "workspaces": ["ui", "admin", "parent-portal"]
}
```

Note: `api` is excluded from workspaces as it's CommonJS and manages its own dependencies independently.

**Step 4: Update Makefile to include parent-portal**

Add a `parent-portal` target after `admin`:

```makefile
# Start parent portal dev server locally (without Docker)
parent-portal:
	cd parent-portal && npm run dev
```

**Step 5: Verify Docker Compose**

```bash
cd platform
docker compose up parent-portal
```

Expected: parent-portal container starts, Vite serves on port 5174, API requests succeed.

**Step 6: Commit**

```bash
git add platform/parent-portal/Dockerfile platform/docker-compose.yml platform/Makefile platform/package.json
git commit -m "feat(platform): add parent-portal Docker service and npm workspaces root"
```

---

## Verification checklist

After all tasks are complete, verify end-to-end:

1. **API health:** `curl http://localhost:3001/api/health` → `{ "status": "ok" }`
2. **Parent stub:** `curl http://localhost:3001/api/v1/parent/stub` → Nguyen Family with Liam Nguyen enrolled in cohort
3. **Integration tests:** `cd platform/api && npx jest --testPathPattern=parent` → all tests pass
4. **Dashboard:** `http://localhost:5174/parent` → ChildCard for Liam Nguyen with cohort info
5. **Child detail:** click "View Detailed Progress" → attendance tab shows empty state (no records seeded)
6. **Billing:** `http://localhost:5174/parent/billing` → empty state
7. **Messages:** `http://localhost:5174/parent/messages` → empty state with CTA
8. **Profile:** `http://localhost:5174/parent/profile` → form pre-filled, save button patches `/api/v1/parent/stub`
9. **Sidebar nav:** all links work, active item highlighted in black
10. **Mobile:** at <1024px viewport, hamburger opens drawer with same nav items
