# Staff Directory — Design Document

**Date:** 2026-02-19
**Feature:** Staff & Role Management (Feature 8, MVP subset)
**Sprint goal:** Campus managers can create, view, edit, and deactivate staff profiles from an admin UI.

---

## Scope

### In scope
- Staff Directory list page with search and role filter
- Create / edit staff via a slide-over panel
- Soft-delete (deactivate) staff
- API endpoints: list, create, update, soft-delete
- Schema migration: add `phone` and `isActive` fields to `Staff`
- Integration tests for all API endpoints
- Update user-roles.md to reflect 3 actual roles (ADMIN, LEAD_INSTRUCTOR, TEACHING_ASSISTANT)

### Out of scope
- Authentication / login for staff (future sprint)
- RBAC middleware on existing endpoints (future sprint)
- Campus assignment UI (instructors are assigned via session rostering, not a directory assignment)
- Instructor availability scheduling (V2)

---

## Design Decisions

### Roles
Keep the existing 3-role `StaffRole` enum: `ADMIN`, `LEAD_INSTRUCTOR`, `TEACHING_ASSISTANT`. The 5-role model in user-roles.md will be updated to match these 3 roles. Expansion to Campus Manager / Front Desk deferred until auth is built.

### Instructor assignment model
- **Cohort level:** `CohortStaff` join table assigns default lead instructor + TAs to a cohort (set in Cohort Management sprint).
- **Session level:** `Session.leadInstructorId` allows per-session override (e.g. substitute instructor), editable inline from the Cohort Detail page.
- The Staff Directory has no role in assignment — it is purely profile management.

### Deletion strategy
Soft-delete via `isActive = false`. Staff records are not hard-deleted to preserve referential integrity with existing `Session` and `Attendance` records. Inactive staff are hidden from the list by default; a toggle reveals them greyed out.

---

## Schema Changes

**Migration name:** `add_staff_phone_isactive`

```prisma
model Staff {
  // existing fields unchanged
  id             String    @id @default(uuid())
  organisationId String
  organisation   Organisation @relation(fields: [organisationId], references: [id])
  firstName      String
  lastName       String
  email          String    @unique
  role           StaffRole
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // NEW
  phone          String?
  isActive       Boolean   @default(true)

  campusStaff    CampusStaff[]
  ledSessions    Session[]  @relation("LeadInstructor")

  @@map("staff")
}
```

---

## API Layer

**New file:** `platform/api/src/routes/staff.js`
**Registered in:** `platform/api/src/app.js` as `/api/v1/staff`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/staff` | List staff |
| `POST` | `/api/v1/staff` | Create staff member |
| `PATCH` | `/api/v1/staff/:id` | Update profile |
| `DELETE` | `/api/v1/staff/:id` | Soft-delete |

### GET /api/v1/staff

Query params:
- `role` — filter by `StaffRole` enum value
- `search` — partial match on `firstName`, `lastName`, or `email`
- `includeInactive` — `true` to include `isActive = false` records (default: false)

Response:
```json
{
  "staff": [
    {
      "id": "uuid",
      "firstName": "Mia",
      "lastName": "Chen",
      "email": "mia@rocketacademy.edu",
      "phone": "+61 400 000 000",
      "role": "LEAD_INSTRUCTOR",
      "isActive": true
    }
  ]
}
```

### POST /api/v1/staff

Request body:
```json
{
  "firstName": "Mia",
  "lastName": "Chen",
  "email": "mia@rocketacademy.edu",
  "phone": "+61 400 000 000",
  "role": "LEAD_INSTRUCTOR"
}
```

Validation:
- `firstName`, `lastName`, `email`, `role` — required; 400 if missing
- `role` — must be valid `StaffRole`; 400 otherwise
- `email` — must be unique; 409 Conflict if duplicate

Response: `201` with created staff object.

### PATCH /api/v1/staff/:id

Request body: any subset of `firstName`, `lastName`, `email`, `phone`, `role`.

- 404 if staff not found or inactive
- 409 if `email` conflicts with another record

Response: `200` with updated staff object.

### DELETE /api/v1/staff/:id

Sets `isActive = false`. Does not hard-delete.

- 404 if staff not found or already inactive

Response: `200 { "message": "Staff member deactivated" }`

---

## Admin UI

**App:** `platform/admin` (React + Vite + Tailwind)

### New files

| File | Purpose |
|------|---------|
| `src/pages/StaffDirectory.jsx` | Main page: table + filters + "Add Staff" button |
| `src/components/StaffPanel.jsx` | Slide-over panel for create and edit |
| `src/components/StaffRoleBadge.jsx` | Coloured badge component for role display |
| `src/lib/staff.js` | API client functions (list, create, update, delete) |

### Updated files

| File | Change |
|------|--------|
| `src/App.jsx` | Add route `/admin/staff → StaffDirectory` |
| `src/components/Layout.jsx` | Add "Staff" nav link |

### StaffDirectory page

```
┌─ Header ─────────────────────────────────────────────────┐
│  Staff Directory                    [+ Add Staff]        │
├─ Filters ────────────────────────────────────────────────┤
│  [Search name/email]  [Role ▾]  [☐ Show inactive]        │
├─ Table ──────────────────────────────────────────────────┤
│  Avatar  Name           Role            Actions          │
│  ○       Mia Chen       Lead Instructor  [Edit] [Deact.] │
│  ○       Alex Patel     Admin            [Edit] [Deact.] │
└──────────────────────────────────────────────────────────┘
```

- Avatar: initials-based coloured circle (consistent with parent portal pattern)
- Role: `StaffRoleBadge` component
- Inactive rows shown greyed out when "Show inactive" is toggled on
- Clicking Edit icon or row opens `StaffPanel`

### StaffPanel (slide-over)

```
┌─────────────────────────────────────┐
│ Add Staff  /  Edit: Mia Chen    [✕] │
├─────────────────────────────────────┤
│ First Name  [____________]          │
│ Last Name   [____________]          │
│ Email       [____________]          │
│ Phone       [____________]          │
│ Role        [Select role  ▾]        │
├─────────────────────────────────────┤
│              [Cancel] [Save Staff]  │
└─────────────────────────────────────┘
```

- Shared component for create (blank) and edit (pre-populated)
- Save button disabled while request in flight
- On save: panel closes, list refreshes in place
- Error banner inside panel for API errors (e.g. 409 duplicate email)

### Delete (deactivate) flow

Clicking Deactivate shows inline confirmation:
> "Deactivate Mia Chen? They will no longer appear in session assignments."
> [Cancel] [Confirm Deactivate]

On confirm: soft-delete → row removed from list (or greyed out if "Show inactive" is on).

---

## Error Handling

| Scenario | API response | UI behaviour |
|----------|-------------|--------------|
| Missing required field | 400 | Inline field error on submit |
| Invalid role value | 400 | Inline field error |
| Duplicate email | 409 | Error banner: "A staff member with this email already exists" |
| Staff not found | 404 | Toast: "Staff member not found" |
| Server error | 500 | Error banner: "Something went wrong. Try again." |

---

## Testing

**New file:** `platform/api/src/__tests__/staff.integration.test.js`

Test cases:
- `GET /api/v1/staff` returns active staff only by default
- `GET /api/v1/staff?includeInactive=true` includes inactive
- `GET /api/v1/staff?role=LEAD_INSTRUCTOR` filters by role
- `GET /api/v1/staff?search=mia` matches on name/email
- `POST /api/v1/staff` creates staff and returns 201
- `POST /api/v1/staff` returns 400 on missing required fields
- `POST /api/v1/staff` returns 409 on duplicate email
- `PATCH /api/v1/staff/:id` updates fields and returns 200
- `PATCH /api/v1/staff/:id` returns 404 for unknown id
- `DELETE /api/v1/staff/:id` sets isActive=false and returns 200
- `DELETE /api/v1/staff/:id` returns 404 for unknown id

No frontend unit tests (consistent with existing admin app pattern).

---

## Out-of-Scope Notes (for future sprints)

- **Cohort instructor assignment:** Set via `CohortStaff` join table in Cohort Management sprint.
- **Per-session instructor override:** Editable via `Session.leadInstructorId` on the Cohort Detail page (substitute instructor flow).
- **Auth + RBAC:** Staff login and permission enforcement are a separate sprint.
- **Instructor availability:** V2 feature.
