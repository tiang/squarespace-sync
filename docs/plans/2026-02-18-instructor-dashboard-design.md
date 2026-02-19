# Instructor Dashboard — Design Document

**Date:** 2026-02-18
**Status:** Approved

## Summary

Build the instructor-facing flow: a dashboard listing today's sessions, and a roll call screen for marking attendance. This is the first real feature on top of the platform scaffold.

## Scope

- API: 3 new endpoints
- Frontend: 2 new pages + supporting components + routing/data infrastructure
- Auth: stubbed (hardcoded instructor: Jake Scott)

---

## API Design

### `GET /api/v1/instructor/sessions`

Returns sessions scheduled for the current calendar day where `leadInstructorId` matches the stub instructor (Jake Scott, looked up by email on startup).

**Stub constant:** `STUB_INSTRUCTOR_EMAIL = 'jake.scott@rocketacademy.edu.au'`

**Prisma query:**
```js
prisma.session.findMany({
  where: {
    leadInstructorId: stubInstructorId,
    scheduledAt: { gte: startOfToday, lt: startOfTomorrow },
  },
  include: {
    cohort: {
      include: {
        program: true,
        campus: true,
        _count: { select: { enrolments: { where: { status: 'ACTIVE' } } } },
      },
    },
  },
})
```

**Response shape:**
```json
[
  {
    "id": "...",
    "scheduledAt": "2026-02-18T05:00:00.000Z",
    "durationMinutes": 75,
    "status": "COMPLETED",
    "cohort": {
      "name": "Junior Engineers — Term 1 2026",
      "room": "Room A",
      "program": { "name": "Junior Engineers" },
      "campus": { "name": "Werribee" }
    },
    "enrolledCount": 6
  }
]
```

---

### `GET /api/v1/sessions/:id`

Returns session details + roster (students enrolled in the cohort with `status: ACTIVE`) + each student's existing attendance record for this session (null if not yet marked).

**Prisma query:**
```js
prisma.session.findUnique({
  where: { id },
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
})
```

Merge in application layer: for each enrolled student, attach their attendance record if one exists.

**Response shape:**
```json
{
  "id": "...",
  "scheduledAt": "2026-02-18T05:00:00.000Z",
  "durationMinutes": 75,
  "status": "COMPLETED",
  "cohort": { "name": "Junior Engineers — Term 1 2026", "room": "Room A" },
  "campus": { "name": "Werribee" },
  "students": [
    {
      "id": "...",
      "firstName": "Liam",
      "lastName": "Nguyen",
      "attendance": { "id": "...", "status": "PRESENT", "notes": null }
    },
    {
      "id": "...",
      "firstName": "Charlotte",
      "lastName": "Tran",
      "attendance": null
    }
  ]
}
```

---

### `PUT /api/v1/sessions/:id/attendance`

Upserts attendance records for all students in one call using Prisma's upsert on `@@unique([sessionId, studentId])`.

**Request body:**
```json
{
  "records": [
    { "studentId": "...", "status": "PRESENT", "notes": null },
    { "studentId": "...", "status": "ABSENT", "notes": "Called in sick" }
  ]
}
```

**Response:** `204 No Content`

**Validation:** `status` must be one of `PRESENT | ABSENT | LATE | EXCUSED`.

---

## Frontend Design

### Infrastructure to install

```bash
npm install react-router-dom @tanstack/react-query @iconify/react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Design language (from UI Design HTML files)

- **Fonts:** Satoshi (body) + General Sans (headings) via Fontshare CDN
- **Background:** `#ffffff` white
- **Palette:** slate-based neutrals, black accents
- **Cards:** `rounded-2xl border border-slate-100 shadow-sm`, hover: `border-black translateY(-2px)`
- **Primary button:** `bg-black text-white rounded-xl hover:bg-slate-800`
- **Secondary button:** `border border-slate-200 rounded-xl hover:bg-slate-50`
- **Icons:** Iconify lucide set via `@iconify/react`
- **Status colors:** Present=emerald, Absent=rose, Late=amber

### File structure

```
admin/src/
  App.jsx                     ← React Router v6 routes
  main.jsx                    ← QueryClient + RouterProvider setup
  index.css                   ← Tailwind directives + font import
  lib/
    api.js                    ← fetch wrapper, base URL from VITE_API_URL
  pages/
    InstructorDashboard.jsx
    RollCallPage.jsx
  components/
    Layout.jsx                ← max-w-[1440px] mx-auto container
    SessionCard.jsx           ← one card per session on dashboard
    StudentRow.jsx            ← one table row per student on roll call
```

### Routes

```
/instructor/dashboard           → InstructorDashboard
/instructor/session/:id/attend  → RollCallPage
/                               → redirect to /instructor/dashboard
```

---

### InstructorDashboard (`/instructor/dashboard`)

**Data:** `useQuery(['instructor-sessions'], () => api.get('/api/v1/instructor/sessions'))`

**Layout (matching 08-admin-dashboard.html):**
- Page heading: "Today's Sessions" + date subtitle (e.g., "Wednesday, 18 February 2026")
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-8`
- One `SessionCard` per session
- Empty state if array is empty: centred message "No sessions scheduled for today"
- Loading state: skeleton cards

**SessionCard props:** `{ id, scheduledAt, durationMinutes, status, cohort, enrolledCount }`

**SessionCard layout:**
- Top: program name badge (slate pill) + cohort name (h3) + campus/room/time subtitle
- Right: enrolled count / `cohort.maxCapacity` + "Capacity" label
- Bottom: "Take Attendance" button (black, links to roll call) + status badge

---

### RollCallPage (`/instructor/session/:id/attend`)

**Data:** `useQuery(['session', id], () => api.get(`/api/v1/sessions/${id}`))`

**Local state:** `Map<studentId, { status: AttendanceStatus | null, notes: string }>` — initialised from API response on load.

**Layout (matching 09-class-attendance.html):**
- Back link: "← Back to Dashboard"
- Heading: "Class Attendance" + subtitle (cohort name + room + time)
- Right: "Mark All Present" button (sets all entries to PRESENT in local state)
- Table:
  - Headers: Student Name | Attendance Status | Internal Notes
  - `StudentRow` for each student

**StudentRow props:** `{ student, value: { status, notes }, onChange }`

**StudentRow layout:**
- Avatar: DiceBear avataaars (`https://api.dicebear.com/7.x/avataaars/svg?seed={firstName}`) + name
- Status: Present / Absent / Late radio inputs styled as pill buttons (emerald/rose/amber)
- Notes: text input (`Add private note...`)

**Footer:**
- Live summary: "Total: N • Present: N • Absent: N • Late: N"
- "Cancel Changes" → navigate back without saving
- "Save Attendance Records" → `useMutation` → `PUT /api/v1/sessions/:id/attendance` → navigate back on success

---

## Key Constraints

- `Family` has no `campusId` in schema — campus is accessed via `Cohort → Campus`, not via student's family
- Enrolled count uses `enrolments` with `status: 'ACTIVE'` filter only
- "Today" is computed server-side in local time (not UTC midnight)
- Stub instructor: Jake Scott (`jake.scott@rocketacademy.edu.au`) — looked up once at route registration time
