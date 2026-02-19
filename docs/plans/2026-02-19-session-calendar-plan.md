# Session Calendar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/parent/calendar` page showing all upcoming sessions across all enrolled children, grouped by week, with a new Calendar nav item and a working "View Full Calendar" button on the dashboard.

**Architecture:** New `GET /api/v1/parent/stub/sessions` endpoint queries sessions via cohort→enrolment→family. Frontend groups sessions into week buckets in pure JS and renders them as a flat agenda list in `CalendarPage.jsx`. No new dependencies.

**Tech Stack:** Express + Prisma (API), React 18 + TanStack React Query + Tailwind CSS (frontend). Tests via Jest + supertest against the live database, matching `parent.integration.test.js` pattern.

**Worktree:** All work happens in `.worktrees/parent-portal/`. Run commands from there unless stated otherwise.

---

### Task 1: Add `GET /api/v1/parent/stub/sessions` with integration tests (TDD)

**Files:**
- Modify: `platform/api/src/__tests__/parent.integration.test.js`
- Modify: `platform/api/src/routes/parent.js`

---

**Step 1: Add the failing tests to the integration test file**

Append this `describe` block to `platform/api/src/__tests__/parent.integration.test.js` just before the final closing `});`:

```js
  describe('GET /api/v1/parent/stub/sessions', () => {
    it('returns 200 with an array', async () => {
      const res = await request(app).get('/api/v1/parent/stub/sessions');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('each session has required fields', async () => {
      const res = await request(app).get('/api/v1/parent/stub/sessions');
      expect(res.status).toBe(200);
      if (res.body.length > 0) {
        const s = res.body[0];
        expect(s.id).toBeDefined();
        expect(s.scheduledAt).toBeDefined();
        expect(typeof s.durationMinutes).toBe('number');
        expect(['SCHEDULED', 'CANCELLED', 'COMPLETED']).toContain(s.status);
        expect(s.cohortName).toBeDefined();
        expect(s.campusName).toBeDefined();
        expect(Array.isArray(s.students)).toBe(true);
      }
    });

    it('returns only sessions scheduledAt >= today', async () => {
      const res = await request(app).get('/api/v1/parent/stub/sessions');
      expect(res.status).toBe(200);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (const s of res.body) {
        expect(new Date(s.scheduledAt).getTime()).toBeGreaterThanOrEqual(today.getTime());
      }
    });

    it('sessions are ordered by scheduledAt ascending', async () => {
      const res = await request(app).get('/api/v1/parent/stub/sessions');
      expect(res.status).toBe(200);
      for (let i = 1; i < res.body.length; i++) {
        expect(new Date(res.body[i].scheduledAt).getTime())
          .toBeGreaterThanOrEqual(new Date(res.body[i - 1].scheduledAt).getTime());
      }
    });
  });
```

**Step 2: Run the tests to confirm they fail**

```bash
cd .worktrees/parent-portal/platform/api
DATABASE_URL=postgres://postgres:localdev@localhost:5432/platform npx jest "parent.integration" --verbose 2>&1 | tail -20
```

Expected: the 4 new tests fail with 404 (route not found yet). Existing 9 tests still pass.

**Step 3: Add the route to `platform/api/src/routes/parent.js`**

Add this block after the `GET /parent/stub/messages` route and before the `PATCH /parent/stub` route:

```js
// ── GET /api/v1/parent/stub/sessions ─────────────────────────────────────────
// Returns all upcoming sessions (scheduledAt >= today) for all cohorts the
// stub family's students are actively enrolled in. Ordered by scheduledAt asc.
// Includes SCHEDULED and CANCELLED sessions (not COMPLETED — those are past).
router.get('/parent/stub/sessions', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sessions = await prisma.session.findMany({
      where: {
        scheduledAt: { gte: startOfToday },
        status: { not: 'COMPLETED' },
        cohort: {
          enrolments: {
            some: {
              student: { familyId: family.id },
              status: { in: ['ACTIVE', 'TRIAL'] },
            },
          },
        },
      },
      include: {
        cohort: {
          select: {
            name: true,
            campus: { select: { name: true } },
            enrolments: {
              where: {
                student: { familyId: family.id },
                status: { in: ['ACTIVE', 'TRIAL'] },
              },
              select: {
                student: { select: { id: true, firstName: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(
      sessions.map(s => ({
        id:              s.id,
        scheduledAt:     s.scheduledAt,
        durationMinutes: s.durationMinutes,
        status:          s.status,
        cohortName:      s.cohort.name,
        campusName:      s.cohort.campus.name,
        students:        s.cohort.enrolments.map(e => ({
          id:        e.student.id,
          firstName: e.student.firstName,
        })),
      }))
    );
  } catch (err) {
    next(err);
  }
});
```

**Step 4: Run the tests to confirm they pass**

```bash
DATABASE_URL=postgres://postgres:localdev@localhost:5432/platform npx jest "parent.integration" --verbose 2>&1 | tail -20
```

Expected: all 13 tests pass (9 existing + 4 new). The "each session has required fields" and "ordered ascending" tests may vacuously pass if no future sessions are seeded — that's correct.

**Step 5: Commit**

```bash
cd .worktrees/parent-portal
git add platform/api/src/routes/parent.js platform/api/src/__tests__/parent.integration.test.js
git commit -m "feat(api): add GET /parent/stub/sessions endpoint with integration tests"
```

---

### Task 2: Create `CalendarPage.jsx` and wire up query key + route

**Files:**
- Modify: `platform/parent-portal/src/lib/queryKeys.js`
- Create: `platform/parent-portal/src/pages/CalendarPage.jsx`
- Modify: `platform/parent-portal/src/App.jsx`

---

**Step 1: Add `sessions` query key to `platform/parent-portal/src/lib/queryKeys.js`**

```js
export const QUERY_KEYS = {
  family:     () => ['parent', 'family'],
  attendance: (studentId) => ['parent', 'attendance', studentId],
  invoices:   () => ['parent', 'invoices'],
  messages:   () => ['parent', 'messages'],
  sessions:   () => ['parent', 'sessions'],
};
```

**Step 2: Create `platform/parent-portal/src/pages/CalendarPage.jsx`**

```jsx
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { Badge } from '@ra/ui';
import { get } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';

// ── Date helpers ──────────────────────────────────────────────────────────────

function startOfWeek(date) {
  // Returns the Monday of the week containing `date`
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, …
  const daysFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return d;
}

function weekLabel(session, thisMonday, nextMonday) {
  const d = new Date(session.scheduledAt);
  const sessionMonday = startOfWeek(d);
  if (sessionMonday.getTime() === thisMonday.getTime()) return 'This week';
  if (sessionMonday.getTime() === nextMonday.getTime()) return 'Next week';
  return 'Week of ' + sessionMonday.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function groupByWeek(sessions) {
  const thisMonday = startOfWeek(new Date());
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);

  const groups = new Map(); // preserves insertion order

  for (const session of sessions) {
    const label = weekLabel(session, thisMonday, nextMonday);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(session);
  }

  return groups;
}

function formatSessionTime(isoString, durationMinutes) {
  const d = new Date(isoString);
  const day = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const dur = hours > 0
    ? `${hours} hr${mins > 0 ? ` ${mins} min` : ''}`
    : `${mins} min`;
  return `${day} · ${time} · ${dur}`;
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({ session }) {
  const isCancelled = session.status === 'CANCELLED';
  const studentNames = session.students.map(s => s.firstName).join(', ');

  return (
    <div
      className={`flex items-center gap-6 px-6 py-4 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/50 ${
        isCancelled ? 'opacity-50' : ''
      }`}
    >
      {/* Date/time */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isCancelled ? 'text-slate-400' : 'text-slate-400'}`}>
          {formatSessionTime(session.scheduledAt, session.durationMinutes)}
        </p>
        <p className={`font-semibold text-sm truncate ${isCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
          {session.cohortName}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {session.campusName}{studentNames ? ` · ${studentNames}` : ''}
        </p>
      </div>

      {/* Badge */}
      <Badge status={session.status} />
    </div>
  );
}

// ── Week group ────────────────────────────────────────────────────────────────

function WeekGroup({ label, sessions }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{label}</h2>
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {sessions.map(session => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { data: sessions = [], isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.sessions(),
    queryFn: () => get('/api/v1/parent/stub/sessions'),
  });

  const groups = groupByWeek(sessions);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Calendar</h1>
        <p className="text-slate-500">All upcoming sessions across your enrolled children.</p>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-8">
          {[1, 2].map(i => (
            <div key={i}>
              <div className="animate-pulse h-3 w-20 bg-slate-200 rounded mb-3" />
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
                {[1, 2, 3].map(j => (
                  <div key={j} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="animate-pulse h-2 w-32 bg-slate-100 rounded" />
                      <div className="animate-pulse h-3 w-48 bg-slate-200 rounded" />
                      <div className="animate-pulse h-2 w-24 bg-slate-100 rounded" />
                    </div>
                    <div className="animate-pulse h-5 w-16 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-rose-500 text-sm">Failed to load sessions. Is the API running?</p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && groups.size === 0 && (
        <div className="text-center py-24 text-slate-400">
          <Icon icon="lucide:calendar-x" className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium mb-1">No upcoming sessions</p>
          <p className="text-sm">Sessions will appear here once they're scheduled.</p>
        </div>
      )}

      {/* Session groups */}
      {!isLoading && groups.size > 0 && (
        <div className="space-y-8">
          {[...groups.entries()].map(([label, groupSessions]) => (
            <WeekGroup key={label} label={label} sessions={groupSessions} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Add the route to `platform/parent-portal/src/App.jsx`**

Add the import after the `ProfilePage` import:

```js
import CalendarPage from './pages/CalendarPage.jsx';
```

Add the route inside the `children` array, after the `ChildDetail` route:

```js
{ path: '/parent/calendar', element: <CalendarPage /> },
```

The full `children` array should look like:
```js
children: [
  { path: '/parent',               element: <ParentDashboard /> },
  { path: '/parent/children/:id',  element: <ChildDetail /> },
  { path: '/parent/calendar',      element: <CalendarPage /> },
  { path: '/parent/billing',       element: <BillingPage /> },
  { path: '/parent/messages',      element: <MessagesPage /> },
  { path: '/parent/profile',       element: <ProfilePage /> },
],
```

**Step 4: Verify the page loads**

Start the dev servers if not already running:
```bash
# Terminal 1
cd .worktrees/parent-portal/platform/api && npm run dev

# Terminal 2
cd .worktrees/parent-portal/platform/parent-portal && npm run dev
```

Navigate to `http://localhost:5174/parent/calendar`. Expected: page renders with "Calendar" heading and either the empty state icon or session groups (depending on seed data). No console errors.

**Step 5: Commit**

```bash
cd .worktrees/parent-portal
git add platform/parent-portal/src/lib/queryKeys.js \
        platform/parent-portal/src/pages/CalendarPage.jsx \
        platform/parent-portal/src/App.jsx
git commit -m "feat(parent-portal): CalendarPage with week-grouped agenda list"
```

---

### Task 3: Add Calendar to nav and wire the dashboard button

**Files:**
- Modify: `platform/parent-portal/src/components/ParentLayout.jsx`
- Modify: `platform/parent-portal/src/pages/ParentDashboard.jsx`

---

**Step 1: Add Calendar nav item to `platform/parent-portal/src/components/ParentLayout.jsx`**

Replace the `NAV_ITEMS` array:

```js
const NAV_ITEMS = [
  { to: '/parent',          label: 'Dashboard', icon: 'lucide:layout-dashboard', end: true },
  { to: '/parent/calendar', label: 'Calendar',  icon: 'lucide:calendar'          },
  { to: '/parent/billing',  label: 'Billing',   icon: 'lucide:receipt'           },
  { to: '/parent/messages', label: 'Messages',  icon: 'lucide:message-circle'    },
  { to: '/parent/profile',  label: 'Profile',   icon: 'lucide:user'              },
];
```

**Step 2: Enable the "View Full Calendar" button on `platform/parent-portal/src/pages/ParentDashboard.jsx`**

Add the `Link` import alongside the existing React Router import at the top:

```js
import { Link } from 'react-router-dom';
```

Find this disabled button (around line 184):

```jsx
<button type="button" title="Calendar view coming soon" disabled className="w-full mt-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold opacity-50 cursor-not-allowed">
  View Full Calendar
</button>
```

Replace it with:

```jsx
<Link
  to="/parent/calendar"
  className="block w-full mt-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center hover:bg-slate-50 transition-colors"
>
  View Full Calendar
</Link>
```

**Step 3: Verify nav and button**

Navigate to `http://localhost:5174/parent`. Expected:
- Sidebar shows Dashboard → Calendar → Billing → Messages → Profile
- "View Full Calendar" button in the Upcoming Classes widget is now a real link (not greyed out)
- Clicking either navigates to `/parent/calendar`
- Active nav item highlights in black

**Step 4: Commit**

```bash
cd .worktrees/parent-portal
git add platform/parent-portal/src/components/ParentLayout.jsx \
        platform/parent-portal/src/pages/ParentDashboard.jsx
git commit -m "feat(parent-portal): add Calendar nav item and wire View Full Calendar button"
```

---

## Verification checklist

After all 3 tasks:

1. `DATABASE_URL=postgres://postgres:localdev@localhost:5432/platform npx jest "parent.integration" --verbose` in `platform/api` → 13 tests pass
2. `http://localhost:5174/parent` → sidebar shows Calendar between Dashboard and Billing
3. `http://localhost:5174/parent` → "View Full Calendar" button is clickable
4. `http://localhost:5174/parent/calendar` → page renders without errors
5. Sessions show grouped by week (or empty state if none seeded)
6. Cancelled sessions appear with CANCELLED badge and muted styling
7. Mobile: hamburger drawer also shows Calendar nav item
