# Front-End Architecture — Rocket Academy Platform

## Decision Summary

**Pattern:** Level 2 Micro Frontend — shared component library (`@ra/ui`) + independent portal apps, with a future shell app planned.

**Rationale:** Parent and instructor portals are different user experiences with different layouts and data needs. Separate apps give independent deployability and release cadences. A shared `@ra/ui` package prevents design drift without the complexity of Module Federation today.

---

## Repository Structure

npm workspaces root at `platform/`:

```
platform/
  package.json              ← workspace root
  ui/                       ← @ra/ui shared component library
  admin/                    ← instructor/staff portal (existing)
  parent-portal/            ← parent portal (new)
  api/                      ← Express + Prisma backend (shared)
```

`platform/package.json` workspace config:

```json
{
  "name": "rocket-academy-platform",
  "private": true,
  "workspaces": ["ui", "admin", "parent-portal", "api"]
}
```

---

## The `@ra/ui` Shared Package

### Purpose

Single source of truth for UI primitives and design tokens. Both `admin` and `parent-portal` import from `@ra/ui`. App-specific layout (sidebars, page headers, nav items) stays inside each app.

### Package identity

```json
{
  "name": "@ra/ui",
  "version": "0.1.0",
  "main": "src/index.js"
}
```

### Component inventory

| Component | Notes |
|---|---|
| `Button` | Variants: primary, secondary, ghost, destructive |
| `Card` | `Card`, `CardHeader`, `CardContent`, `CardFooter` |
| `Badge` | Status-aware: enrolment status, attendance status |
| `Avatar` | Initials fallback when no photo |
| `Table` | `Table`, `Thead`, `Tbody`, `Tr`, `Th`, `Td` |
| `Tabs` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| `Input` | Filled text-field style |
| `Spinner` | Loading state |
| `EmptyState` | Zero-data placeholder with icon + message |
| `StatusBadge` | Maps `EnrolmentStatus` / `AttendanceStatus` enums to colors |

### Shared Tailwind preset

`ui/tailwind.preset.js` — both apps extend this:

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: { sans: ['Satoshi', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: '#000000', muted: '#1a1a1a' },
        surface: { DEFAULT: '#ffffff', muted: '#f8fafc' },
        slate: { ... },   // standard Tailwind slate palette
      },
      borderRadius: {
        card: '1rem',     // 16px — standard card radius
        pill: '9999px',   // buttons and badges
      },
    },
  },
}
```

### Design language

Follows HTML mockup #06 aesthetic:
- **Font:** Satoshi (700, 500, 400) + General Sans for headings
- **Background:** White / `slate-50`
- **Cards:** `bg-slate-50 border border-slate-100 rounded-2xl` with subtle hover lift
- **Buttons:** Rounded-full pill shape, black primary, slate ghost
- **Badges:** Rounded-full, emerald for active, slate for neutral
- **Tables:** `rounded-2xl border border-slate-100` wrapper, `divide-y divide-slate-50` rows

---

## The `admin/` App (Existing — Minimal Changes)

### Changes required
1. Add `"@ra/ui": "*"` to `package.json`
2. Extend Tailwind config with `@ra/ui` preset
3. Refactor `Layout.jsx` to use `@ra/ui` primitives as they are built (gradual migration — not blocking)

### No routing changes needed

Instructor routes remain:
```
/                          → redirect to /instructor/dashboard
/instructor/dashboard      → InstructorDashboard
/instructor/session/:id/attend → RollCallPage
```

---

## The `parent-portal/` App (New)

### Stack

| Concern | Tool |
|---|---|
| Build | Vite + React 18 |
| Routing | React Router DOM v6 |
| Server state | TanStack React Query |
| Styling | Tailwind CSS (extends `@ra/ui` preset) |
| Components | shadcn/ui primitives + `@ra/ui` shared components |
| Icons | `@iconify/react` |

### Directory structure

```
parent-portal/
  index.html
  vite.config.js
  tailwind.config.js
  package.json
  src/
    App.jsx               ← router definition
    main.jsx              ← ReactDOM.createRoot
    index.css             ← Tailwind directives + Satoshi import
    lib/
      api.js              ← get(), post(), patch() fetch helpers
      queryKeys.js        ← React Query key constants
    components/
      ParentLayout.jsx    ← sidebar + mobile top-bar shell
      ChildCard.jsx       ← child tile on dashboard
      SkillTree.jsx       ← hierarchical skill progress display
      InvoiceRow.jsx      ← single invoice table row with Pay button
    pages/
      ParentDashboard.jsx
      ChildDetail.jsx
      BillingPage.jsx
      MessagesPage.jsx
      ProfilePage.jsx
```

### Routes

```
/                          → redirect to /parent
/parent                    → ParentDashboard
/parent/children/:id       → ChildDetail
/parent/billing            → BillingPage
/parent/messages           → MessagesPage
/parent/profile            → ProfilePage
```

### `ParentLayout` structure

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (desktop 240px fixed)  │  Main content      │
│  ─────────────────────────────  │  ─────────────── │
│  🚀 Rocket Academy logo         │  <Outlet />        │
│                                 │                    │
│  Nav items:                     │                    │
│  ○ Dashboard      /parent       │                    │
│  ○ Billing        /parent/billing                    │
│  ○ Messages       /parent/messages                   │
│  ○ Profile        /parent/profile                    │
│                                 │                    │
│  ─────────────────────────────  │                    │
│  Family name + avatar           │                    │
└──────────────────────────────────────────────────────┘

Mobile: top bar with hamburger → slide-out drawer
```

### Page designs

#### `ParentDashboard` (`/parent`)
- Welcome header: "Welcome back, {family.name}"
- Grid of `ChildCard` components (one per enrolled student)
- Each card: avatar initials, student name, current cohort name, attendance %, next session date/time, "View Progress" link
- Sidebar widget: upcoming sessions for next 2 weeks (timeline list)
- Alert strip if any invoice is overdue

#### `ChildDetail` (`/parent/children/:id`)
- Back button → `/parent`
- Student header: name, cohort, campus, enrolment status badge
- Three tabs: **Progress** | **Attendance** | **Projects**
- **Progress tab:** Skill groups (Variables, Loops, Functions…) each with skill items marked Not Started / In Progress / Mastered using colored badges
- **Attendance tab:** Table — Date | Session | Status | Notes. Attendance % shown at top.
- **Projects tab:** List of submitted project URLs with submission date (stub in MVP)

#### `BillingPage` (`/parent/billing`)
- Outstanding balance chip if balance > 0
- **Outstanding invoices** table: Invoice # | Description | Amount | Due Date | Status | Pay
- **Payment history** table: Date | Description | Amount | Method | Reference

#### `MessagesPage` (`/parent/messages`)
- MVP: Empty state with "Message your instructor" CTA — threading UI deferred until messaging API is built
- Stub message list showing one thread per cohort the family is enrolled in

#### `ProfilePage` (`/parent/profile`)
- **Family details** form: name, email, phone, address fields
- **Students** list: each student with name, DOB, gender — edit button opens inline form
- Save button calls `PATCH /api/v1/families/:id`

---

## API Routes (in `platform/api`)

New routes added to `platform/api/src/routes/parent.js`, registered in `app.js`.

All routes use a stub family email (`nguyen.family@gmail.com` from seed data) until auth middleware is added.

| Method | Path | Returns |
|---|---|---|
| `GET` | `/api/v1/families/:id` | Family with students + active enrolments + cohort + campus |
| `GET` | `/api/v1/students/:id/attendance` | Attendance records with session date, status, notes |
| `GET` | `/api/v1/families/:id/invoices` | All invoices with status, line items, due date |
| `GET` | `/api/v1/families/:id/messages` | Message threads (stub: returns empty array for MVP) |
| `PATCH` | `/api/v1/families/:id` | Update name, phone, address fields |

### Stub pattern (consistent with instructor routes)

```js
const STUB_FAMILY_EMAIL = 'nguyen.family@gmail.com';

router.get('/families/stub', async (req, res, next) => {
  const family = await prisma.family.findUnique({
    where: { primaryEmail: STUB_FAMILY_EMAIL },
    include: {
      students: {
        include: {
          enrolments: {
            include: { cohort: { include: { campus: true, program: true } } },
          },
        },
      },
    },
  });
  // ...
});
```

---

## Future Shell Plan

Once both portals are stable, a thin shell app sits in front:

### Option A — Nginx reverse proxy (Recommended first step)

```nginx
location /admin/   { proxy_pass http://admin-app:5173; }
location /parent/  { proxy_pass http://parent-portal:5174; }
location /api/     { proxy_pass http://api:3001; }
```

Single entry point (`app.rocketacademy.com.au`) routes by path prefix. No code changes to either portal.

### Option B — Module Federation shell (Future upgrade)

If independent deployability per feature becomes important:
- `shell/` app becomes a Webpack 5 (or Vite + `vite-plugin-federation`) host
- `admin` and `parent-portal` register as remotes
- Shell handles auth, global nav, and app-switching
- Each portal deploys independently; shell loads latest remote at runtime

Level 2 does not lock in either option — the separate app structure is compatible with both.

---

## Development Ports

| App | Dev port |
|---|---|
| `api` | 3001 |
| `admin` | 5173 |
| `parent-portal` | 5174 |

`docker-compose.yml` / `Makefile` updated with `parent-portal` service.

---

## What Goes Where — Decision Rule

> **If it's used in exactly one app, it lives in that app.**
> **If it's used in two or more apps, it lives in `@ra/ui`.**

Build `@ra/ui` components on demand as `parent-portal` is built — don't pre-build a library speculatively.
