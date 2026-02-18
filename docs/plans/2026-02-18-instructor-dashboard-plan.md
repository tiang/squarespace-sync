# Instructor Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an instructor dashboard showing today's sessions and a roll call screen for marking attendance.

**Architecture:** Three new API endpoints in Express (route files mounted on `/api/v1`), two new React pages wired up with React Router v6 and React Query, styled to match the existing HTML mockups (white/slate/black palette, Satoshi + General Sans fonts, Tailwind CSS).

**Tech Stack:** Node.js/Express + Prisma (API), React 18 + Vite + React Router v6 + React Query + Tailwind CSS + Iconify (frontend). Tests: Jest + supertest with jest.mock for Prisma.

---

## Task 1: API — Route scaffold

**Files:**
- Create: `platform/api/src/routes/instructor.js`
- Create: `platform/api/src/routes/sessions.js`
- Modify: `platform/api/src/app.js`

**Step 1: Create `platform/api/src/routes/instructor.js`**

```js
const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Stub: hardcoded to Jake Scott from seed data
const STUB_INSTRUCTOR_EMAIL = 'jake.scott@rocketacademy.edu.au';

router.get('/instructor/sessions', async (req, res, next) => {
  try {
    res.json([]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

**Step 2: Create `platform/api/src/routes/sessions.js`**

```js
const express = require('express');
const router = express.Router();
const prisma = require('../db');

router.get('/sessions/:id', async (req, res, next) => {
  try {
    res.json({});
  } catch (err) {
    next(err);
  }
});

router.put('/sessions/:id/attendance', async (req, res, next) => {
  try {
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

**Step 3: Register routes in `platform/api/src/app.js`**

Add after `app.use(express.json());`:

```js
const instructorRoutes = require('./routes/instructor');
const sessionRoutes = require('./routes/sessions');

app.use('/api/v1', instructorRoutes);
app.use('/api/v1', sessionRoutes);
```

Full `app.js` after change:
```js
const express = require('express');
const cors = require('cors');
const prisma = require('./db');
const instructorRoutes = require('./routes/instructor');
const sessionRoutes = require('./routes/sessions');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));

app.use(express.json());

app.use('/api/v1', instructorRoutes);
app.use('/api/v1', sessionRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      error: err.message,
    });
  }
});

module.exports = app;
```

**Step 4: Verify existing tests still pass**

```bash
cd platform/api && npm test
```

Expected: all existing health tests pass.

**Step 5: Commit**

```bash
git add platform/api/src/routes/ platform/api/src/app.js
git commit -m "feat(api): scaffold instructor and session route files"
```

---

## Task 2: API — TDD for GET /api/v1/instructor/sessions

**Files:**
- Create: `platform/api/src/__tests__/instructor.test.js`
- Modify: `platform/api/src/routes/instructor.js`

**Step 1: Write the failing test**

Create `platform/api/src/__tests__/instructor.test.js`:

```js
const request = require('supertest');

// Mock Prisma before requiring app (same pattern as health.test.js)
jest.mock('../db', () => ({
  staff: {
    findUnique: jest.fn(),
  },
  session: {
    findMany: jest.fn(),
  },
}));

const app = require('../app');
const prisma = require('../db');

const FAKE_INSTRUCTOR_ID = 'instructor-uuid-123';

const FAKE_SESSION = {
  id: 'session-uuid-456',
  scheduledAt: new Date('2026-02-18T05:00:00.000Z'),
  durationMinutes: 75,
  status: 'SCHEDULED',
  cohort: {
    name: 'Junior Engineers — Term 1 2026',
    room: 'Room A',
    program: { name: 'Junior Engineers' },
    campus: { name: 'Werribee' },
    _count: { enrolments: 6 },
  },
};

describe('GET /api/v1/instructor/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.findUnique.mockResolvedValue({ id: FAKE_INSTRUCTOR_ID });
    prisma.session.findMany.mockResolvedValue([FAKE_SESSION]);
  });

  it('returns 200 with an array of sessions', async () => {
    const res = await request(app).get('/api/v1/instructor/sessions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('looks up stub instructor by email', async () => {
    await request(app).get('/api/v1/instructor/sessions');
    expect(prisma.staff.findUnique).toHaveBeenCalledWith({
      where: { email: 'jake.scott@rocketacademy.edu.au' },
      select: { id: true },
    });
  });

  it('returns sessions with expected shape', async () => {
    const res = await request(app).get('/api/v1/instructor/sessions');
    const session = res.body[0];
    expect(session).toMatchObject({
      id: FAKE_SESSION.id,
      durationMinutes: 75,
      status: 'SCHEDULED',
      enrolledCount: 6,
      cohort: {
        name: 'Junior Engineers — Term 1 2026',
        room: 'Room A',
        program: { name: 'Junior Engineers' },
        campus: { name: 'Werribee' },
      },
    });
  });

  it('returns 503 when stub instructor not found in DB', async () => {
    prisma.staff.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/instructor/sessions');
    expect(res.status).toBe(503);
  });
});
```

**Step 2: Run test — expect failures**

```bash
cd platform/api && npm test -- --testPathPattern=instructor
```

Expected: FAIL — `staff.findUnique is not a function` (stub returns `[]`, not matching shape).

**Step 3: Implement the endpoint**

Replace content of `platform/api/src/routes/instructor.js`:

```js
const express = require('express');
const router = express.Router();
const prisma = require('../db');

const STUB_INSTRUCTOR_EMAIL = 'jake.scott@rocketacademy.edu.au';

router.get('/instructor/sessions', async (req, res, next) => {
  try {
    const instructor = await prisma.staff.findUnique({
      where: { email: STUB_INSTRUCTOR_EMAIL },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(503).json({ error: 'Stub instructor not seeded. Run: cd platform/api && npx prisma db seed' });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const sessions = await prisma.session.findMany({
      where: {
        leadInstructorId: instructor.id,
        scheduledAt: { gte: startOfDay, lt: endOfDay },
      },
      include: {
        cohort: {
          include: {
            program: true,
            campus: true,
            _count: {
              select: {
                enrolments: { where: { status: 'ACTIVE' } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(sessions.map(s => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      durationMinutes: s.durationMinutes,
      status: s.status,
      cohort: {
        name: s.cohort.name,
        room: s.cohort.room,
        program: { name: s.cohort.program.name },
        campus: { name: s.cohort.campus.name },
      },
      enrolledCount: s.cohort._count.enrolments,
    })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

**Step 4: Run tests — expect pass**

```bash
cd platform/api && npm test -- --testPathPattern=instructor
```

Expected: all 4 tests PASS.

**Step 5: Run all tests to verify no regressions**

```bash
cd platform/api && npm test
```

Expected: all tests pass.

**Step 6: Commit**

```bash
git add platform/api/src/__tests__/instructor.test.js platform/api/src/routes/instructor.js
git commit -m "feat(api): implement GET /api/v1/instructor/sessions with stub auth"
```

---

## Task 3: API — TDD for GET /api/v1/sessions/:id

**Files:**
- Create: `platform/api/src/__tests__/sessions.test.js`
- Modify: `platform/api/src/routes/sessions.js`

**Step 1: Write the failing test**

Create `platform/api/src/__tests__/sessions.test.js`:

```js
const request = require('supertest');

jest.mock('../db', () => ({
  session: {
    findUnique: jest.fn(),
  },
  attendance: {
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const app = require('../app');
const prisma = require('../db');

const FAKE_SESSION = {
  id: 'session-uuid-456',
  scheduledAt: new Date('2026-02-18T05:00:00.000Z'),
  durationMinutes: 75,
  status: 'SCHEDULED',
  cohort: {
    name: 'Junior Engineers — Term 1 2026',
    room: 'Room A',
    campus: { name: 'Werribee' },
    enrolments: [
      {
        student: { id: 'student-uuid-1', firstName: 'Liam', lastName: 'Nguyen' },
      },
      {
        student: { id: 'student-uuid-2', firstName: 'Charlotte', lastName: 'Tran' },
      },
    ],
  },
  attendances: [
    { id: 'att-uuid-1', studentId: 'student-uuid-1', status: 'PRESENT', notes: null },
  ],
};

describe('GET /api/v1/sessions/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.session.findUnique.mockResolvedValue(FAKE_SESSION);
  });

  it('returns 200 with session shape', async () => {
    const res = await request(app).get('/api/v1/sessions/session-uuid-456');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'session-uuid-456',
      durationMinutes: 75,
      status: 'SCHEDULED',
      cohort: { name: 'Junior Engineers — Term 1 2026', room: 'Room A' },
      campus: { name: 'Werribee' },
    });
  });

  it('returns students array with attendance merged', async () => {
    const res = await request(app).get('/api/v1/sessions/session-uuid-456');
    const { students } = res.body;
    expect(Array.isArray(students)).toBe(true);
    expect(students).toHaveLength(2);

    const liam = students.find(s => s.firstName === 'Liam');
    expect(liam.attendance).toMatchObject({ status: 'PRESENT' });

    const charlotte = students.find(s => s.firstName === 'Charlotte');
    expect(charlotte.attendance).toBeNull();
  });

  it('returns 404 when session not found', async () => {
    prisma.session.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/sessions/nonexistent');
    expect(res.status).toBe(404);
  });
});
```

**Step 2: Run test — expect failures**

```bash
cd platform/api && npm test -- --testPathPattern=sessions
```

Expected: FAIL — endpoint returns `{}`, not matching shape.

**Step 3: Implement the endpoint**

Replace content of `platform/api/src/routes/sessions.js`:

```js
const express = require('express');
const router = express.Router();
const prisma = require('../db');

const VALID_STATUSES = new Set(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);

router.get('/sessions/:id', async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        cohort: {
          include: {
            campus: true,
            enrolments: {
              where: { status: 'ACTIVE' },
              include: { student: true },
            },
          },
        },
        attendances: true,
      },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const attendanceMap = new Map(session.attendances.map(a => [a.studentId, a]));

    res.json({
      id: session.id,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      status: session.status,
      cohort: { name: session.cohort.name, room: session.cohort.room },
      campus: { name: session.cohort.campus.name },
      students: session.cohort.enrolments.map(e => {
        const att = attendanceMap.get(e.student.id);
        return {
          id: e.student.id,
          firstName: e.student.firstName,
          lastName: e.student.lastName,
          attendance: att ? { id: att.id, status: att.status, notes: att.notes } : null,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/sessions/:id/attendance', async (req, res, next) => {
  try {
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

**Step 4: Run tests — expect pass**

```bash
cd platform/api && npm test -- --testPathPattern=sessions
```

Expected: all 3 tests PASS.

**Step 5: Commit**

```bash
git add platform/api/src/__tests__/sessions.test.js platform/api/src/routes/sessions.js
git commit -m "feat(api): implement GET /api/v1/sessions/:id with roster and attendance"
```

---

## Task 4: API — TDD for PUT /api/v1/sessions/:id/attendance

**Files:**
- Modify: `platform/api/src/__tests__/sessions.test.js`
- Modify: `platform/api/src/routes/sessions.js`

**Step 1: Add tests to `sessions.test.js`**

Append inside the file (after the GET describe block, before the closing of the file):

```js
describe('PUT /api/v1/sessions/:id/attendance', () => {
  const VALID_RECORDS = [
    { studentId: 'student-uuid-1', status: 'PRESENT', notes: null },
    { studentId: 'student-uuid-2', status: 'ABSENT', notes: 'Called in sick' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // $transaction receives an array of promises — resolve them all
    prisma.$transaction.mockImplementation(ops => Promise.all(ops));
    prisma.attendance.upsert.mockResolvedValue({});
  });

  it('returns 204 on success', async () => {
    const res = await request(app)
      .put('/api/v1/sessions/session-uuid-456/attendance')
      .send({ records: VALID_RECORDS });
    expect(res.status).toBe(204);
  });

  it('calls upsert for each record', async () => {
    await request(app)
      .put('/api/v1/sessions/session-uuid-456/attendance')
      .send({ records: VALID_RECORDS });
    expect(prisma.attendance.upsert).toHaveBeenCalledTimes(2);
  });

  it('returns 400 when records is missing', async () => {
    const res = await request(app)
      .put('/api/v1/sessions/session-uuid-456/attendance')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when status is invalid', async () => {
    const res = await request(app)
      .put('/api/v1/sessions/session-uuid-456/attendance')
      .send({ records: [{ studentId: 'student-uuid-1', status: 'MAYBE' }] });
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run test — expect failures**

```bash
cd platform/api && npm test -- --testPathPattern=sessions
```

Expected: PUT tests FAIL (endpoint returns 204 but doesn't call upsert).

**Step 3: Implement PUT in `sessions.js`**

Replace the stub PUT handler with:

```js
router.put('/sessions/:id/attendance', async (req, res, next) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'records must be an array' });
    }

    for (const r of records) {
      if (!r.studentId || !VALID_STATUSES.has(r.status)) {
        return res.status(400).json({ error: `Invalid record: ${JSON.stringify(r)}` });
      }
    }

    await prisma.$transaction(
      records.map(r =>
        prisma.attendance.upsert({
          where: { sessionId_studentId: { sessionId: req.params.id, studentId: r.studentId } },
          create: {
            sessionId: req.params.id,
            studentId: r.studentId,
            status: r.status,
            notes: r.notes ?? null,
          },
          update: {
            status: r.status,
            notes: r.notes ?? null,
          },
        })
      )
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
```

**Step 4: Run all tests — expect all pass**

```bash
cd platform/api && npm test
```

Expected: all tests pass (health + instructor + sessions).

**Step 5: Commit**

```bash
git add platform/api/src/__tests__/sessions.test.js platform/api/src/routes/sessions.js
git commit -m "feat(api): implement PUT /api/v1/sessions/:id/attendance with upsert"
```

---

## Task 5: Frontend — Install dependencies and configure Tailwind

**Files:**
- Modify: `platform/admin/package.json` (via npm install)
- Create: `platform/admin/tailwind.config.js`
- Create: `platform/admin/postcss.config.js`
- Modify: `platform/admin/src/index.css` (if it exists, else create at `platform/admin/index.css`)

**Step 1: Install dependencies**

```bash
cd platform/admin
npm install react-router-dom @tanstack/react-query @iconify/react
npm install -D tailwindcss postcss autoprefixer
```

**Step 2: Initialise Tailwind**

```bash
cd platform/admin && npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`.

**Step 3: Update `platform/admin/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

**Step 4: Find the CSS entry point**

Check if `platform/admin/src/index.css` exists:
```bash
ls platform/admin/src/
```

If it exists, replace its contents. If not, create `platform/admin/src/index.css`.

**Step 5: Write `platform/admin/src/index.css`**

```css
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&f[]=general-sans@600,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

h1, h2, h3 {
  font-family: 'General Sans', sans-serif;
}
```

**Step 6: Verify Tailwind is wired into vite**

Check `platform/admin/vite.config.js`:
```bash
cat platform/admin/vite.config.js
```

It should already import the React plugin. No changes needed — PostCSS picks up Tailwind automatically via `postcss.config.js`.

**Step 7: Commit**

```bash
git add platform/admin/package.json platform/admin/package-lock.json platform/admin/tailwind.config.js platform/admin/postcss.config.js platform/admin/src/index.css
git commit -m "feat(admin): install react-router, react-query, tailwind, iconify"
```

---

## Task 6: Frontend — Routing, QueryClient, and shared utilities

**Files:**
- Create: `platform/admin/src/lib/api.js`
- Create: `platform/admin/src/components/Layout.jsx`
- Rewrite: `platform/admin/src/App.jsx`
- Rewrite: `platform/admin/src/main.jsx`

**Step 1: Create `platform/admin/src/lib/api.js`**

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
}
```

**Step 2: Create `platform/admin/src/components/Layout.jsx`**

```jsx
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]" style={{ fontFamily: "'Satoshi', sans-serif" }}>
      <Outlet />
    </div>
  );
}
```

**Step 3: Rewrite `platform/admin/src/App.jsx`**

```jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InstructorDashboard from './pages/InstructorDashboard';
import RollCallPage from './pages/RollCallPage';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/instructor/dashboard" replace /> },
  {
    element: <Layout />,
    children: [
      { path: '/instructor/dashboard', element: <InstructorDashboard /> },
      { path: '/instructor/session/:id/attend', element: <RollCallPage /> },
    ],
  },
]);

export default router;
```

**Step 4: Rewrite `platform/admin/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import router from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Step 5: Create stub page files so the app compiles**

Create `platform/admin/src/pages/InstructorDashboard.jsx`:
```jsx
export default function InstructorDashboard() {
  return <main className="p-10"><h1>Dashboard (stub)</h1></main>;
}
```

Create `platform/admin/src/pages/RollCallPage.jsx`:
```jsx
export default function RollCallPage() {
  return <main className="p-10"><h1>Roll Call (stub)</h1></main>;
}
```

**Step 6: Verify the app starts and routes work**

```bash
cd platform/admin && npm run dev
```

Open http://localhost:5173 — should redirect to `/instructor/dashboard` and show "Dashboard (stub)".
Navigate to `/instructor/session/abc/attend` — should show "Roll Call (stub)".

**Step 7: Commit**

```bash
git add platform/admin/src/
git commit -m "feat(admin): wire up routing, QueryClient, api lib, and Layout"
```

---

## Task 7: Frontend — InstructorDashboard page + SessionCard component

**Files:**
- Rewrite: `platform/admin/src/pages/InstructorDashboard.jsx`
- Create: `platform/admin/src/components/SessionCard.jsx`

**Step 1: Create `platform/admin/src/components/SessionCard.jsx`**

```jsx
import { useNavigate } from 'react-router-dom';

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_STYLES = {
  SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function SessionCard({ session }) {
  const navigate = useNavigate();
  const { id, scheduledAt, durationMinutes, status, cohort, enrolledCount } = session;

  return (
    <div className="border border-slate-100 p-8 rounded-2xl bg-white shadow-sm flex flex-col transition-all duration-200 hover:border-black hover:-translate-y-0.5 cursor-pointer">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 inline-block">
            {cohort.program.name}
          </span>
          <h3 className="text-2xl font-bold">{cohort.name}</h3>
          <p className="text-slate-400 text-sm mt-1">
            {cohort.campus.name} • {cohort.room} • {formatTime(scheduledAt)} ({durationMinutes} min)
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="text-lg font-bold">{enrolledCount}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase">Students</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-100">
        <button
          onClick={() => navigate(`/instructor/session/${id}/attend`)}
          className="flex-1 py-3 bg-black text-white text-center rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          Take Attendance
        </button>
        <span className={`px-3 py-1.5 border rounded-full text-xs font-bold ${STATUS_STYLES[status] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Rewrite `platform/admin/src/pages/InstructorDashboard.jsx`**

```jsx
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import SessionCard from '../components/SessionCard';

function formatDate(date) {
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function InstructorDashboard() {
  const { data: sessions = [], isLoading, isError } = useQuery({
    queryKey: ['instructor-sessions'],
    queryFn: () => get('/api/v1/instructor/sessions'),
  });

  return (
    <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold tracking-tight">Today's Sessions</h1>
          <p className="text-slate-500">{formatDate(new Date())}</p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="border border-slate-100 p-8 rounded-2xl bg-slate-50/30 animate-pulse h-48" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-rose-500 text-sm">Failed to load sessions. Is the API running?</p>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <div className="text-center py-24">
          <p className="text-slate-400 text-lg">No sessions scheduled for today.</p>
        </div>
      )}

      {!isLoading && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </main>
  );
}
```

**Step 3: Verify in browser**

Make sure the API is running (`cd platform/api && npm run dev`) and the DB is seeded (`npx prisma db seed`).

Open http://localhost:5173 — should show today's session card for "Junior Engineers — Term 1 2026" with a "Take Attendance" button.

**Step 4: Commit**

```bash
git add platform/admin/src/pages/InstructorDashboard.jsx platform/admin/src/components/SessionCard.jsx
git commit -m "feat(admin): implement InstructorDashboard page and SessionCard component"
```

---

## Task 8: Frontend — RollCallPage + StudentRow component

**Files:**
- Create: `platform/admin/src/components/StudentRow.jsx`
- Rewrite: `platform/admin/src/pages/RollCallPage.jsx`

**Step 1: Create `platform/admin/src/components/StudentRow.jsx`**

```jsx
const STATUSES = [
  {
    value: 'PRESENT',
    label: 'Present',
    dot: 'bg-emerald-500',
    checked: 'peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700',
  },
  {
    value: 'ABSENT',
    label: 'Absent',
    dot: 'bg-rose-500',
    checked: 'peer-checked:bg-rose-50 peer-checked:border-rose-500 peer-checked:text-rose-700',
  },
  {
    value: 'LATE',
    label: 'Late',
    dot: 'bg-amber-500',
    checked: 'peer-checked:bg-amber-50 peer-checked:border-amber-500 peer-checked:text-amber-700',
  },
];

export default function StudentRow({ student, value, onChange }) {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}${student.lastName}`;

  return (
    <tr className="transition-colors hover:bg-slate-50/50">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="font-bold text-slate-900">
            {student.firstName} {student.lastName}
          </div>
        </div>
      </td>

      <td className="px-8 py-6">
        <div className="flex items-center gap-2">
          {STATUSES.map(({ value: statusVal, label, dot, checked }) => (
            <label key={statusVal} className="flex-1">
              <input
                type="radio"
                name={student.id}
                className="hidden peer"
                checked={value.status === statusVal}
                onChange={() => onChange({ status: statusVal })}
              />
              <span className={`flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all hover:bg-slate-50 ${checked}`}>
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {label}
              </span>
            </label>
          ))}
        </div>
      </td>

      <td className="px-8 py-6">
        <input
          type="text"
          placeholder="Add private note..."
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-black transition-all"
        />
      </td>
    </tr>
  );
}
```

**Step 2: Rewrite `platform/admin/src/pages/RollCallPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { get, put } from '../lib/api';
import StudentRow from '../components/StudentRow';

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return (
    d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' • ' +
    d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function RollCallPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => get(`/api/v1/sessions/${id}`),
  });

  // Local state: { [studentId]: { status: string | null, notes: string } }
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    if (!session) return;
    const initial = {};
    for (const student of session.students) {
      initial[student.id] = {
        status: student.attendance?.status ?? null,
        notes: student.attendance?.notes ?? '',
      };
    }
    setAttendance(initial);
  }, [session]);

  const mutation = useMutation({
    mutationFn: (records) => put(`/api/v1/sessions/${id}/attendance`, { records }),
    onSuccess: () => navigate('/instructor/dashboard'),
  });

  function handleMarkAll() {
    setAttendance(prev => {
      const next = {};
      for (const sid of Object.keys(prev)) {
        next[sid] = { ...prev[sid], status: 'PRESENT' };
      }
      return next;
    });
  }

  function handleChange(studentId, patch) {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], ...patch },
    }));
  }

  function handleSave() {
    const records = Object.entries(attendance)
      .filter(([, v]) => v.status !== null)
      .map(([studentId, v]) => ({
        studentId,
        status: v.status,
        notes: v.notes || null,
      }));
    mutation.mutate(records);
  }

  // Live summary counts
  const counts = Object.values(attendance).reduce((acc, v) => {
    if (v.status) acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <main className="max-w-[1440px] mx-auto px-10 pt-24">
        <p className="text-slate-400">Loading session...</p>
      </main>
    );
  }

  return (
    <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-32">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-black transition-colors mb-4 gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-semibold tracking-tight">Class Attendance</h1>
          <p className="text-slate-500">
            {session.cohort.name} • {session.cohort.room} • {formatDateTime(session.scheduledAt)}
          </p>
        </div>
        <button
          onClick={handleMarkAll}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-all"
        >
          Mark All Present
        </button>
      </div>

      {/* Attendance table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-8 py-4 w-1/3">Student Name</th>
                <th className="px-8 py-4">Attendance Status</th>
                <th className="px-8 py-4">Internal Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {session.students.map(student => (
                <StudentRow
                  key={student.id}
                  student={student}
                  value={attendance[student.id] ?? { status: null, notes: '' }}
                  onChange={(patch) => handleChange(student.id, patch)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Total: {session.students.length} • Present: {counts.PRESENT ?? 0} • Absent: {counts.ABSENT ?? 0} • Late: {counts.LATE ?? 0}
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="px-8 py-4 border border-slate-200 rounded-full font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel Changes
          </button>
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="px-10 py-4 bg-black text-white rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Attendance Records'}
          </button>
        </div>
      </div>

      {mutation.isError && (
        <p className="mt-4 text-rose-500 text-sm text-right">
          Save failed. Please try again.
        </p>
      )}
    </main>
  );
}
```

**Step 3: Verify end-to-end in browser**

With API running and DB seeded:

1. Open http://localhost:5173 → see today's session card
2. Click "Take Attendance" → navigates to `/instructor/session/:id/attend`
3. All 6 students appear with existing attendance pre-filled (PRESENT from seed)
4. Click "Mark All Present" → all radio buttons jump to Present
5. Change one student to Absent, add a note
6. Click "Save Attendance Records" → returns to dashboard

**Step 4: Commit**

```bash
git add platform/admin/src/pages/RollCallPage.jsx platform/admin/src/components/StudentRow.jsx
git commit -m "feat(admin): implement RollCallPage and StudentRow with attendance submit"
```

---

## Done

After Task 8 completes, the full instructor flow is working:
- `GET /api/v1/instructor/sessions` → returns today's sessions for Jake Scott
- `GET /api/v1/sessions/:id` → returns session with roster and merged attendance
- `PUT /api/v1/sessions/:id/attendance` → upserts attendance records
- `/instructor/dashboard` → shows today's sessions as cards
- `/instructor/session/:id/attend` → roll call table, mark attendance, save

**Known limitations (intentional tech debt):**
- Auth is stubbed — Jake Scott is hardcoded. Real auth (JWT + login) is a future task.
- Frontend has no unit tests — Vitest setup is a future task.
- "Today" uses server-local time — if API runs in UTC, sessions scheduled in AEDT may not appear. Use `TZ=Australia/Melbourne` in `.env` if needed.
