# Firebase Auth — Parent Portal Design

**Date:** 2026-02-23
**Status:** Approved

---

## Goal

Add Firebase Authentication to the Parent Portal so parents can securely log in using Google Sign-In, email magic link, or phone OTP — without passwords. Connect the authenticated identity to their Family record in the database.

---

## Scope

- **In scope:** Parent Portal only (Admin auth is a separate effort)
- **Not in scope:** Admin app authentication, `/stub/` route migration (follow-up feature)

---

## Approach

Approach B — Auth layer first, data migration second.

Ship Firebase Auth + login UI + API middleware + "account not found" help form as one feature. Existing `/stub/` routes remain available in local dev (no auth required). Real family-scoped data routes are a follow-up.

---

## Architecture

### Frontend (Parent Portal)

- `AuthProvider` React context wraps the whole app, holds the Firebase `user` object and ID token
- `LoginPage` (`/login`) with three sign-in options:
  - Google one-tap (OAuth)
  - Email magic link (Firebase `sendSignInLinkToEmail`)
  - Phone OTP (Firebase `signInWithPhoneNumber` + reCAPTCHA verifier)
- All portal routes wrapped in `<ProtectedRoute>` — unauthenticated users redirect to `/login`
- Every API request attaches `Authorization: Bearer <idToken>` header via the API client
- "Account not found" screen shown when API returns `403 FAMILY_NOT_FOUND`, includes a help form

### API

- Firebase Admin SDK added for server-side token verification
- `requireAuth` middleware:
  1. Extracts Bearer token from `Authorization` header
  2. Verifies token via `firebaseAdmin.auth().verifyIdToken(token)`
  3. Looks up `Family` by guardian email (`guardians.email = decodedToken.email`)
  4. Attaches `req.familyId` and `req.userEmail` for downstream route handlers
  5. Returns `401` if token missing/invalid, `403 { code: "FAMILY_NOT_FOUND" }` if email has no matching Family
- New endpoint: `POST /api/v1/parent/pending-registration` — stores help form submission (no auth required)
- Existing `/stub/` routes remain untouched for local development

### Firebase Setup

- Reuse existing Firebase emulator (already in `docker-compose.infra.yml`)
- Enable providers: Email link, Google, Phone
- Firebase Admin SDK in API: initialized with service account credentials (or Application Default Credentials in production)
- Firebase client SDK in Parent Portal frontend

---

## Data Model

New table: `PendingRegistration`

```prisma
model PendingRegistration {
  id               String   @id @default(cuid())
  email            String
  phone            String?
  childName        String?
  partnerName      String?
  locationEnrolled String?
  createdAt        DateTime @default(now())
}
```

---

## Sign-In Flows

### Google Sign-In
1. Parent clicks "Continue with Google"
2. Firebase popup/redirect OAuth flow
3. On success → Firebase ID token → API `requireAuth` middleware → portal loads

### Email Magic Link
1. Parent enters email address
2. Frontend calls `sendSignInLinkToEmail` → Firebase sends link
3. Parent taps link (works on mobile) → redirected back to portal
4. `signInWithEmailLink` completes sign-in → ID token → portal loads

### Phone OTP
1. Parent enters phone number
2. reCAPTCHA verification (invisible reCAPTCHA on web)
3. Firebase sends SMS with 6-digit code
4. Parent enters code → `confirmationResult.confirm(code)` → ID token → portal loads

### Account Not Found
1. Auth succeeds but API returns `403 FAMILY_NOT_FOUND`
2. Portal shows "Account not found" screen
3. Help form collects: phone number, child's name, partner's name, location enrolled
4. Submission POSTs to `/api/v1/parent/pending-registration`
5. Confirmation message: "We'll be in touch within 1 business day"

---

## Environment Variables

### API
```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...        # service account
FIREBASE_PRIVATE_KEY=...         # service account
```
For local dev with emulator:
```
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### Parent Portal
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```
For local dev with emulator:
```
VITE_FIREBASE_USE_EMULATOR=true
```

---

## Testing

### API
- `requireAuth` middleware unit tests: missing token → 401, invalid token → 401, valid token + known email → `req.familyId` set, valid token + unknown email → 403 `FAMILY_NOT_FOUND`
- `POST /api/v1/parent/pending-registration` — stores record, returns 201

### Frontend
- `LoginPage` renders all three sign-in options
- `ProtectedRoute` redirects unauthenticated users to `/login`
- "Account not found" screen renders when API returns `FAMILY_NOT_FOUND`
- Help form submits correctly

---

## Out of Scope

- Migrating `/stub/` routes to real family-scoped data (follow-up feature)
- Admin app authentication
- Admin UI for reviewing `PendingRegistration` records
- Email notifications to admin when a pending registration is submitted
