# Staff Directory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Staff Directory — admin UI (slide-over panel CRUD) + API (list, create, update, soft-delete) for managing staff profiles.

**Architecture:** Express API routes with Prisma, unit-tested via Jest + supertest with mocked Prisma. React admin UI with @tanstack/react-query v5, Tailwind CSS, slide-over panel pattern. No auth — all endpoints public for now (auth is a future sprint).

**Tech Stack:** Node/Express/Prisma (API), React 18/Vite/Tailwind/@tanstack/react-query v5 (admin UI), Jest/supertest (tests)

---

## Reference: Design Doc

Full design rationale: `platform/Docs/plans/2026-02-19-staff-directory-design.md`

---

## Task 1: Schema Migration

**Files:**
- Modify: `platform/api/prisma/schema.prisma`

**Step 1: Add `phone` and `isActive` to the Staff model**

Open `platform/api/prisma/schema.prisma`. Find the `Staff` model (currently ends before `campusStaff` relation). Add two fields after the `role` line:

```prisma
model Staff {
  id             String       @id @default(uuid())
  organisationId String
  organisation   Organisation @relation(fields: [organisationId], references: [id])
  firstName      String
  lastName       String
  email          String       @unique
  role           StaffRole
  phone          String?                    // ← ADD THIS
  isActive       Boolean      @default(true) // ← ADD THIS
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  campusStaff CampusStaff[]
  ledSessions Session[]     @relation("LeadInstructor")

  @@map("staff")
}
```

**Step 2: Run the migration**

```bash
cd platform/api
npx prisma migrate dev --name add_staff_phone_isactive
```

Expected output:
```
✔ Generated Prisma Client (...)
Your database is now in sync with your schema.
```

**Step 3: Verify seed still works**

```bash
npx prisma db seed
```

Expected: seed completes without error. (The new fields have defaults so no seed changes needed.)

**Step 4: Commit**

```bash
git add platform/api/prisma/schema.prisma platform/api/prisma/migrations/
git commit -m "feat(schema): add phone and isActive to Staff model"
```

---

## Task 2: API — GET /api/v1/staff

**Files:**
- Create: `platform/api/src/routes/staff.js`
- Create: `platform/api/src/__tests__/staff.test.js`
- Modify: `platform/api/src/app.js`

**Step 1: Write failing tests**

Create `platform/api/src/__tests__/staff.test.js`:

```js
const request = require('supertest');

jest.mock('../db', () => ({
  staff: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const app = require('../app');
const prisma = require('../db');

const FAKE_STAFF = {
  id: 'staff-uuid-1',
  firstName: 'Mia',
  lastName: 'Chen',
  email: 'mia@rocketacademy.edu.au',
  phone: '+61 400 000 001',
  role: 'LEAD_INSTRUCTOR',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GET /api/v1/staff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.findMany.mockResolvedValue([FAKE_STAFF]);
  });

  it('returns 200 with staff array', async () => {
    const res = await request(app).get('/api/v1/staff');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.staff)).toBe(true);
    expect(res.body.staff).toHaveLength(1);
  });

  it('filters by isActive=true by default', async () => {
    await request(app).get('/api/v1/staff');
    expect(prisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it('omits isActive filter when includeInactive=true', async () => {
    await request(app).get('/api/v1/staff?includeInactive=true');
    const callArg = prisma.staff.findMany.mock.calls[0][0];
    expect(callArg.where).not.toHaveProperty('isActive');
  });

  it('adds role filter when role param provided', async () => {
    await request(app).get('/api/v1/staff?role=LEAD_INSTRUCTOR');
    expect(prisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: 'LEAD_INSTRUCTOR' }),
      })
    );
  });

  it('adds OR search filter when search param provided', async () => {
    await request(app).get('/api/v1/staff?search=mia');
    const callArg = prisma.staff.findMany.mock.calls[0][0];
    expect(callArg.where.OR).toBeDefined();
    expect(callArg.where.OR).toHaveLength(3);
  });
});
```

**Step 2: Run to confirm tests fail**

```bash
cd platform/api && npm test -- --testPathPattern=staff
```

Expected: FAIL — `Cannot find module '../routes/staff'` or similar.

**Step 3: Create the route file with GET handler**

Create `platform/api/src/routes/staff.js`:

```js
const express = require('express');
const router = express.Router();
const prisma = require('../db');

const VALID_ROLES = ['ADMIN', 'LEAD_INSTRUCTOR', 'TEACHING_ASSISTANT'];

// GET /api/v1/staff
router.get('/staff', async (req, res, next) => {
  try {
    const { role, search, includeInactive } = req.query;

    const where = {};

    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const staff = await prisma.staff.findMany({
      where,
      orderBy: { lastName: 'asc' },
    });

    res.json({ staff });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

**Step 4: Register the route in app.js**

In `platform/api/src/app.js`, add two lines:

```js
// After the existing require lines at the top:
const staffRoutes = require('./routes/staff');

// After the existing app.use lines:
app.use('/api/v1', staffRoutes);
```

**Step 5: Run tests to confirm GET tests pass**

```bash
cd platform/api && npm test -- --testPathPattern=staff
```

Expected: GET suite passes (5 tests).

**Step 6: Commit**

```bash
git add platform/api/src/routes/staff.js platform/api/src/__tests__/staff.test.js platform/api/src/app.js
git commit -m "feat(api): add GET /api/v1/staff with role and search filters"
```

---

## Task 3: API — POST /api/v1/staff

**Files:**
- Modify: `platform/api/src/__tests__/staff.test.js`
- Modify: `platform/api/src/routes/staff.js`

**Step 1: Add POST tests to `staff.test.js`**

Append this describe block at the end of the file:

```js
describe('POST /api/v1/staff', () => {
  const validBody = {
    firstName: 'Mia',
    lastName: 'Chen',
    email: 'mia@rocketacademy.edu.au',
    role: 'LEAD_INSTRUCTOR',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.create.mockResolvedValue({ ...FAKE_STAFF });
  });

  it('returns 201 with the created staff', async () => {
    const res = await request(app).post('/api/v1/staff').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('mia@rocketacademy.edu.au');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/v1/staff').send({ firstName: 'Mia' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when role is not a valid enum value', async () => {
    const res = await request(app).post('/api/v1/staff').send({ ...validBody, role: 'MANAGER' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    prisma.staff.create.mockRejectedValue({ code: 'P2002' });
    const res = await request(app).post('/api/v1/staff').send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });
});
```

**Step 2: Run to confirm new tests fail**

```bash
cd platform/api && npm test -- --testPathPattern=staff
```

Expected: 4 new POST tests FAIL (route returns 404).

**Step 3: Add POST handler to `staff.js`**

Append to `platform/api/src/routes/staff.js` before `module.exports = router;`:

```js
// POST /api/v1/staff
router.post('/staff', async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, role } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ error: 'firstName, lastName, email, and role are required' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const staff = await prisma.staff.create({
      data: { firstName, lastName, email, phone: phone || null, role },
    });

    res.status(201).json(staff);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A staff member with this email already exists' });
    }
    next(err);
  }
});
```

**Step 4: Run tests to confirm all pass**

```bash
cd platform/api && npm test -- --testPathPattern=staff
```

Expected: all 9 tests pass.

**Step 5: Commit**

```bash
git add platform/api/src/routes/staff.js platform/api/src/__tests__/staff.test.js
git commit -m "feat(api): add POST /api/v1/staff with validation and duplicate email handling"
```

---

## Task 4: API — PATCH /api/v1/staff/:id

**Files:**
- Modify: `platform/api/src/__tests__/staff.test.js`
- Modify: `platform/api/src/routes/staff.js`

**Step 1: Add PATCH tests to `staff.test.js`**

Append:

```js
describe('PATCH /api/v1/staff/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.findUnique.mockResolvedValue(FAKE_STAFF);
    prisma.staff.update.mockResolvedValue({ ...FAKE_STAFF, firstName: 'Updated' });
  });

  it('returns 200 with updated staff', async () => {
    const res = await request(app).patch('/api/v1/staff/staff-uuid-1').send({ firstName: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Updated');
  });

  it('returns 404 when staff not found', async () => {
    prisma.staff.findUnique.mockResolvedValue(null);
    const res = await request(app).patch('/api/v1/staff/bad-id').send({ firstName: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 404 when staff is inactive', async () => {
    prisma.staff.findUnique.mockResolvedValue({ ...FAKE_STAFF, isActive: false });
    const res = await request(app).patch('/api/v1/staff/staff-uuid-1').send({ firstName: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when role is invalid', async () => {
    const res = await request(app).patch('/api/v1/staff/staff-uuid-1').send({ role: 'MANAGER' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    prisma.staff.update.mockRejectedValue({ code: 'P2002' });
    const res = await request(app).patch('/api/v1/staff/staff-uuid-1').send({ email: 'taken@example.com' });
    expect(res.status).toBe(409);
  });
});
```

**Step 2: Run to confirm new tests fail**

```bash
cd platform/api && npm test -- --testPathPattern=staff
```

Expected: 5 new PATCH tests FAIL.

**Step 3: Add PATCH handler to `staff.js`**

Append before `module.exports`:

```js
// PATCH /api/v1/staff/:id
router.patch('/staff/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role } = req.body;

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const data = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (role !== undefined) data.role = role;

    const staff = await prisma.staff.update({ where: { id }, data });
    res.json(staff);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A staff member with this email already exists' });
    }
    next(err);
  }
});
```

**Step 4: Run all tests**

```bash
cd platform/api && npm test -- --testPathPattern=staff
```

Expected: all 14 tests pass.

**Step 5: Commit**

```bash
git add platform/api/src/routes/staff.js platform/api/src/__tests__/staff.test.js
git commit -m "feat(api): add PATCH /api/v1/staff/:id"
```

---

## Task 5: API — DELETE /api/v1/staff/:id (soft-delete)

**Files:**
- Modify: `platform/api/src/__tests__/staff.test.js`
- Modify: `platform/api/src/routes/staff.js`

**Step 1: Add DELETE tests to `staff.test.js`**

Append:

```js
describe('DELETE /api/v1/staff/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.findUnique.mockResolvedValue(FAKE_STAFF);
    prisma.staff.update.mockResolvedValue({ ...FAKE_STAFF, isActive: false });
  });

  it('returns 200 with deactivation message', async () => {
    const res = await request(app).delete('/api/v1/staff/staff-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('calls update with isActive: false', async () => {
    await request(app).delete('/api/v1/staff/staff-uuid-1');
    expect(prisma.staff.update).toHaveBeenCalledWith({
      where: { id: 'staff-uuid-1' },
      data: { isActive: false },
    });
  });

  it('returns 404 when staff not found', async () => {
    prisma.staff.findUnique.mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/staff/bad-id');
    expect(res.status).toBe(404);
  });

  it('returns 404 when staff is already inactive', async () => {
    prisma.staff.findUnique.mockResolvedValue({ ...FAKE_STAFF, isActive: false });
    const res = await request(app).delete('/api/v1/staff/staff-uuid-1');
    expect(res.status).toBe(404);
  });
});
```

**Step 2: Run to confirm new tests fail**

```bash
cd platform/api && npm test -- --testPathPattern=staff
```

Expected: 4 new DELETE tests FAIL.

**Step 3: Add DELETE handler to `staff.js`**

Append before `module.exports`:

```js
// DELETE /api/v1/staff/:id  (soft-delete)
router.delete('/staff/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    await prisma.staff.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Staff member deactivated' });
  } catch (err) {
    next(err);
  }
});
```

**Step 4: Run all tests — full suite**

```bash
cd platform/api && npm test
```

Expected: all tests pass across all test files (staff + instructor + sessions + parent + health).

**Step 5: Commit**

```bash
git add platform/api/src/routes/staff.js platform/api/src/__tests__/staff.test.js
git commit -m "feat(api): add DELETE /api/v1/staff/:id (soft-delete)"
```

---

## Task 6: Admin UI — Extend lib/api.js + create lib/staff.js

**Files:**
- Modify: `platform/admin/src/lib/api.js`
- Create: `platform/admin/src/lib/staff.js`

**Step 1: Add `post`, `patch`, `del` to lib/api.js**

The current `api.js` only has `get` and `put`. Append to the file:

```js
export async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `API error ${res.status}: ${path}`;
    try { const e = await res.json(); if (e.error) message = e.error; } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function patch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `API error ${res.status}: ${path}`;
    try { const e = await res.json(); if (e.error) message = e.error; } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function del(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    let message = `API error ${res.status}: ${path}`;
    try { const e = await res.json(); if (e.error) message = e.error; } catch {}
    throw new Error(message);
  }
  return res.json();
}
```

**Step 2: Create lib/staff.js**

Create `platform/admin/src/lib/staff.js`:

```js
import { get, post, patch, del } from './api';

export function listStaff({ role, search, includeInactive } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (search) params.set('search', search);
  if (includeInactive) params.set('includeInactive', 'true');
  const qs = params.toString();
  return get(`/api/v1/staff${qs ? `?${qs}` : ''}`).then(r => r.staff);
}

export function createStaff(data) {
  return post('/api/v1/staff', data);
}

export function updateStaff(id, data) {
  return patch(`/api/v1/staff/${id}`, data);
}

export function deactivateStaff(id) {
  return del(`/api/v1/staff/${id}`);
}
```

**Step 3: Commit**

```bash
git add platform/admin/src/lib/api.js platform/admin/src/lib/staff.js
git commit -m "feat(admin): add post/patch/del to api.js and staff API client"
```

---

## Task 7: Admin UI — StaffRoleBadge component

**Files:**
- Create: `platform/admin/src/components/StaffRoleBadge.jsx`

**Step 1: Create the component**

```jsx
const ROLE_LABELS = {
  ADMIN: 'Admin',
  LEAD_INSTRUCTOR: 'Lead Instructor',
  TEACHING_ASSISTANT: 'Teaching Assistant',
};

const ROLE_STYLES = {
  ADMIN: 'bg-violet-100 text-violet-700',
  LEAD_INSTRUCTOR: 'bg-blue-100 text-blue-700',
  TEACHING_ASSISTANT: 'bg-emerald-100 text-emerald-700',
};

export default function StaffRoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[role] ?? 'bg-slate-100 text-slate-600'}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}
```

**Step 2: Commit**

```bash
git add platform/admin/src/components/StaffRoleBadge.jsx
git commit -m "feat(admin): add StaffRoleBadge component"
```

---

## Task 8: Admin UI — StaffPanel slide-over component

**Files:**
- Create: `platform/admin/src/components/StaffPanel.jsx`

**Step 1: Create the component**

```jsx
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaff, updateStaff } from '../lib/staff';

const ROLES = ['ADMIN', 'LEAD_INSTRUCTOR', 'TEACHING_ASSISTANT'];
const ROLE_LABELS = {
  ADMIN: 'Admin',
  LEAD_INSTRUCTOR: 'Lead Instructor',
  TEACHING_ASSISTANT: 'Teaching Assistant',
};

const EMPTY_FORM = { firstName: '', lastName: '', email: '', phone: '', role: '' };

export default function StaffPanel({ staff, onClose }) {
  const isEdit = Boolean(staff);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  // Reset form whenever the panel opens with new data
  useEffect(() => {
    setForm(staff
      ? { firstName: staff.firstName, lastName: staff.lastName, email: staff.email, phone: staff.phone ?? '', role: staff.role }
      : EMPTY_FORM
    );
    setErrors({});
    setApiError(null);
  }, [staff]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateStaff(staff.id, data) : createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      onClose();
    },
    onError: (err) => setApiError(err.message),
  });

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.role) errs.role = 'Required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setApiError(null);
    const data = { ...form };
    if (!data.phone) delete data.phone;
    mutation.mutate(data);
  }

  function setField(name, value) {
    setForm(f => ({ ...f, [name]: value }));
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? `Edit: ${staff.firstName} ${staff.lastName}` : 'Add Staff'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {apiError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
              {apiError}
            </div>
          )}

          {[
            { name: 'firstName', label: 'First Name', type: 'text' },
            { name: 'lastName', label: 'Last Name', type: 'text' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'phone', label: 'Phone (optional)', type: 'tel' },
          ].map(({ name, label, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[name]}
                onChange={e => setField(name, e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 ${errors[name] ? 'border-rose-400' : 'border-slate-300'}`}
              />
              {errors[name] && <p className="mt-1 text-xs text-rose-500">{errors[name]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setField('role', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-violet-500 ${errors.role ? 'border-rose-400' : 'border-slate-300'}`}
            >
              <option value="">Select role...</option>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            {errors.role && <p className="mt-1 text-xs text-rose-500">{errors.role}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-5 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Staff'}
          </button>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add platform/admin/src/components/StaffPanel.jsx
git commit -m "feat(admin): add StaffPanel slide-over component"
```

---

## Task 9: Admin UI — StaffDirectory page

**Files:**
- Create: `platform/admin/src/pages/StaffDirectory.jsx`

**Step 1: Create the page**

```jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStaff, deactivateStaff } from '../lib/staff';
import StaffPanel from '../components/StaffPanel';
import StaffRoleBadge from '../components/StaffRoleBadge';

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
];

function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export default function StaffDirectory() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelStaff, setPanelStaff] = useState(null); // null = create mode, object = edit mode
  const [deactivatingId, setDeactivatingId] = useState(null);

  const { data: staff = [], isLoading, isError } = useQuery({
    queryKey: ['staff', { roleFilter, search, showInactive }],
    queryFn: () => listStaff({
      role: roleFilter || undefined,
      search: search || undefined,
      includeInactive: showInactive,
    }),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDeactivatingId(null);
    },
  });

  function openCreate() {
    setPanelStaff(null);
    setPanelOpen(true);
  }

  function openEdit(member) {
    setPanelStaff(member);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setPanelStaff(null);
  }

  return (
    <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold tracking-tight">Staff Directory</h1>
          <p className="text-slate-500 text-sm">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
        >
          + Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 w-64"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="LEAD_INSTRUCTOR">Lead Instructor</option>
          <option value="TEACHING_ASSISTANT">Teaching Assistant</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-rose-500 text-sm">Failed to load staff. Is the API running?</p>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No staff found.
                  </td>
                </tr>
              )}
              {staff.map((member, i) => (
                <tr
                  key={member.id}
                  onClick={() => member.isActive && openEdit(member)}
                  className={`hover:bg-slate-50/60 transition-colors ${member.isActive ? 'cursor-pointer' : 'opacity-50 cursor-default'}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {initials(member.firstName, member.lastName)}
                      </span>
                      <span className="font-medium text-slate-800">{member.firstName} {member.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{member.email}</td>
                  <td className="px-6 py-4"><StaffRoleBadge role={member.role} /></td>
                  <td className="px-6 py-4 text-slate-500">{member.phone ?? '—'}</td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    {member.isActive ? (
                      deactivatingId === member.id ? (
                        <span className="text-xs text-slate-600">
                          Deactivate?{' '}
                          <button
                            onClick={() => deactivateMutation.mutate(member.id)}
                            disabled={deactivateMutation.isPending}
                            className="text-rose-600 font-medium hover:underline"
                          >
                            Confirm
                          </button>
                          {' · '}
                          <button onClick={() => setDeactivatingId(null)} className="hover:underline">
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeactivatingId(member.id)}
                          className="text-slate-400 hover:text-rose-500 text-xs transition-colors"
                        >
                          Deactivate
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-slate-400">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over panel */}
      {panelOpen && <StaffPanel staff={panelStaff} onClose={closePanel} />}
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add platform/admin/src/pages/StaffDirectory.jsx
git commit -m "feat(admin): add StaffDirectory page with table and deactivate flow"
```

---

## Task 10: Admin UI — Wire up route and nav

**Files:**
- Modify: `platform/admin/src/App.jsx`
- Modify: `platform/admin/src/components/Layout.jsx`

**Step 1: Add the route to App.jsx**

Replace the contents of `platform/admin/src/App.jsx`:

```jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InstructorDashboard from './pages/InstructorDashboard';
import RollCallPage from './pages/RollCallPage';
import StaffDirectory from './pages/StaffDirectory';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/instructor/dashboard" replace /> },
  {
    element: <Layout />,
    children: [
      { path: '/instructor/dashboard', element: <InstructorDashboard /> },
      { path: '/instructor/session/:id/attend', element: <RollCallPage /> },
      { path: '/admin/staff', element: <StaffDirectory /> },
    ],
  },
]);

export default router;
```

**Step 2: Add nav to Layout.jsx**

Replace the contents of `platform/admin/src/components/Layout.jsx`:

```jsx
import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      <nav className="fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-6 z-30">
        <span className="font-semibold text-sm text-violet-600">Rocket Admin</span>
        <NavLink
          to="/instructor/dashboard"
          className={({ isActive }) =>
            `text-sm ${isActive ? 'text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700'}`
          }
        >
          Sessions
        </NavLink>
        <NavLink
          to="/admin/staff"
          className={({ isActive }) =>
            `text-sm ${isActive ? 'text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700'}`
          }
        >
          Staff
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
```

**Step 3: Start the admin dev server and verify manually**

```bash
cd platform/admin && npm run dev
```

Navigate to `http://localhost:5173/admin/staff` and confirm:
- Staff Directory page renders
- "Sessions" and "Staff" links appear in the top nav
- Active nav link is bold
- "Add Staff" button opens the slide-over panel
- Panel form validates required fields
- Panel closes on Cancel

**Step 4: Run full API test suite one final time**

```bash
cd platform/api && npm test
```

Expected: all tests pass.

**Step 5: Final commit**

```bash
git add platform/admin/src/App.jsx platform/admin/src/components/Layout.jsx
git commit -m "feat(admin): wire StaffDirectory route and add top nav to Layout"
```

---

## Done ✓

Deliverables:
- Prisma migration: `phone?` and `isActive` on Staff
- API: `GET`, `POST`, `PATCH`, `DELETE /api/v1/staff` with full test coverage
- Admin UI: Staff Directory page with slide-over panel, role badge, deactivate flow
- Navigation: top nav bar with Sessions + Staff links
