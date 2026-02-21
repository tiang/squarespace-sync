# Session Calendar — Design

**Date:** 2026-02-19
**Feature:** Parent portal session calendar (agenda list view)

---

## Goal

Give parents a dedicated page showing all upcoming class sessions across all their enrolled children, so they can plan ahead without digging through individual child detail pages.

---

## Decisions

| Question | Decision |
|---|---|
| Display format | Agenda list (sessions grouped by week, no calendar grid) |
| Scope | Upcoming only — from today onwards, no upper bound |
| Cancelled sessions | Show with a CANCELLED badge and muted styling |
| New dependencies | None |

---

## API

### `GET /api/v1/parent/stub/sessions`

Single Prisma query: `family → students → enrolments (ACTIVE/TRIAL) → cohort → sessions`.

**Filters:** `scheduledAt >= startOfToday`, `status` includes SCHEDULED and CANCELLED.
**Order:** `scheduledAt` ascending.

**Response — flat array:**
```json
[
  {
    "id": "...",
    "scheduledAt": "2026-02-24T08:00:00.000Z",
    "durationMinutes": 60,
    "status": "SCHEDULED",
    "cohortName": "Cohort 1 — Scratch Basics",
    "campusName": "Brisbane",
    "studentFirstName": "Liam",
    "studentId": "..."
  }
]
```

**Error handling:** Returns 503 if stub family not seeded (same pattern as other parent routes).

**Tests:**
- 200 with array when family exists
- Array only contains sessions `scheduledAt >= today`
- Returns 503 when stub family missing

---

## Frontend

### New files
- `platform/parent-portal/src/pages/CalendarPage.jsx`

### Modified files
- `platform/parent-portal/src/components/ParentLayout.jsx` — add Calendar nav item
- `platform/parent-portal/src/App.jsx` — add `/parent/calendar` route
- `platform/parent-portal/src/lib/queryKeys.js` — add `sessions` key
- `platform/parent-portal/src/pages/ParentDashboard.jsx` — enable "View Full Calendar" button

### CalendarPage behaviour

- React Query fetches `GET /api/v1/parent/stub/sessions`
- Sessions grouped into week buckets in JavaScript (no library):
  - "This week" — Mon–Sun of current calendar week
  - "Next week" — following Mon–Sun
  - "Week of 24 Feb" — thereafter
- Each session row: `Mon 24 Feb · 4:00 pm · 1 hr` | cohort name + campus + student name | badge
- Cancelled rows: muted slate text, `CANCELLED` badge from `@ra/ui`
- Skeleton loaders during fetch (3 placeholder rows)
- Empty state: calendar icon + "No upcoming sessions scheduled."

### Nav update

Add between Dashboard and Billing:
```js
{ to: '/parent/calendar', label: 'Calendar', icon: 'lucide:calendar' }
```

### Dashboard wiring

Enable the existing "View Full Calendar" button in the Upcoming Classes sidebar widget:
```jsx
<Link to="/parent/calendar" className="w-full mt-8 py-3 ...">
  View Full Calendar
</Link>
```

---

## Out of scope

- Past sessions (visible via attendance tab on ChildDetail)
- Add-to-calendar export (iCal/Google Calendar) — V2
- Session detail modal/page — V2
