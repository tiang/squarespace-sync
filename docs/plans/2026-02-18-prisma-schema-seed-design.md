# Prisma Schema & Seed Design

**Date:** 2026-02-18
**Status:** Approved

## Overview

Define the Prisma schema for the platform API, run the initial migration, and create a seed script populated with realistic synthetic Australian data. Schema fields are grounded in what iClassPro currently tracks (Approach B), not the full aspirational data-model.md spec.

## Scope

10 entities: Organisation, Campus, Staff, Program, Cohort, Session, Family, Student, Enrolment, Attendance — plus CampusStaff join table.

Entities deferred to later: SkillTree, SkillNode, SkillProgress, ProjectSubmission, Invoice, Payment, Message, Notification.

## Schema Design

### Enums

```prisma
enum StaffRole {
  ADMIN
  LEAD_INSTRUCTOR
  TEACHING_ASSISTANT
}

enum CohortStatus {
  UPCOMING
  ACTIVE
  COMPLETED
  CANCELLED
}

enum SessionStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
}

enum EnrolmentStatus {
  ACTIVE
  TRIAL
  WAITLIST
  DROPPED
  COMPLETED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}
```

### Entities

**Organisation**
- id (uuid), name, createdAt, updatedAt

**Campus**
- id (uuid), organisationId (FK), name
- addressStreet?, addressCity?, addressState?, addressPostcode?
- createdAt, updatedAt

**Staff**
- id (uuid), organisationId (FK), firstName, lastName, email (unique), role (StaffRole)
- createdAt, updatedAt

**CampusStaff** (join table)
- campusId + staffId (composite PK)

**Program**
- id (uuid), organisationId (FK), name, description?
- createdAt, updatedAt

**Cohort**
- id (uuid), programId (FK), campusId (FK), name, status (CohortStatus)
- room?, maxCapacity (Int)
- createdAt, updatedAt

**Session**
- id (uuid), cohortId (FK), leadInstructorId (FK → Staff), scheduledAt (DateTime)
- durationMinutes (Int), status (SessionStatus)
- createdAt, updatedAt

**Family**
- id (uuid), campusId (FK), name, primaryEmail, primaryPhone?
- addressStreet?, addressCity?, addressState?, addressPostcode?
- createdAt, updatedAt

**Student**
- id (uuid), familyId (FK), firstName, lastName, birthDate (DateTime)
- gender?, healthConcerns?, allowPhoto (Boolean, default true)
- createdAt, updatedAt

**Enrolment**
- id (uuid), studentId (FK), cohortId (FK), status (EnrolmentStatus)
- startDate (DateTime), dropDate?
- isTrial (Boolean, default false), isWaitlist (Boolean, default false)
- createdAt, updatedAt
- unique: (studentId, cohortId)

**Attendance**
- id (uuid), sessionId (FK), studentId (FK), status (AttendanceStatus), notes?
- createdAt, updatedAt
- unique: (sessionId, studentId)

### Field mapping from iClassPro

| Prisma field | iClassPro source |
|---|---|
| `Student.allowPhoto` | `flags.allowImage` |
| `Student.healthConcerns` | `healthConcerns` |
| `Enrolment.isTrial` | `flags.trial` |
| `Enrolment.isWaitlist` | `flags.waitlist` |
| `Enrolment.startDate` | `startDate` |
| `Enrolment.dropDate` | `dropDate` |
| `Cohort.maxCapacity` | `occupancy.max` |
| `Cohort.room` | `room` |
| `Session.durationMinutes` | `durations[0] / 60` (iClassPro stores seconds) |
| `Family.primaryEmail` | `primaryEmail` |
| `Family.primaryPhone` | `primaryPhone` |
| `Family.*address*` | `address.{ street, city, state, zip }` → postcode |

## Seed Data

**File:** `platform/api/prisma/seed.js`

### Organisation
- Rocket Academy

### Campus
- Werribee | 12 Hoppers Lane, Werribee, VIC, 3030

### Staff (3)

| Name | Role | Email |
|------|------|-------|
| Sarah Mitchell | ADMIN | sarah.mitchell@rocketacademy.edu.au |
| Jake Scott | LEAD_INSTRUCTOR | jake.scott@rocketacademy.edu.au |
| Emma Chen | LEAD_INSTRUCTOR | emma.chen@rocketacademy.edu.au |

All staff linked to Werribee campus via CampusStaff.

### Programs (2)
- Junior Engineers
- Master Builder Prime

### Cohorts (2)

| Name | Program | Status | Capacity | Instructor |
|------|---------|--------|----------|------------|
| Junior Engineers — Term 1 2026 | Junior Engineers | ACTIVE | 8 | Jake Scott |
| Master Builder Prime — Term 2 2026 | Master Builder Prime | UPCOMING | 8 | Emma Chen |

### Sessions (4)

| # | Cohort | Date | Status |
|---|--------|------|--------|
| 1 | Junior Engineers T1 | 2026-02-11 Wed 4:00 PM AEDT | COMPLETED |
| 2 | Junior Engineers T1 | 2026-02-18 Wed 4:00 PM AEDT (today) | SCHEDULED |
| 3 | Master Builder Prime T2 | 2026-02-25 Wed 5:00 PM AEDT | SCHEDULED |
| 4 | Master Builder Prime T2 | 2026-03-04 Wed 5:00 PM AEDT | SCHEDULED |

All sessions 75 minutes (matching iClassPro's 4500 second durations).

### Families & Students (12)

One family per student, synthetic Australian names, Victorian addresses.

**Junior Engineers cohort (6 students):**
1. Liam Nguyen
2. Charlotte Tran
3. Oscar Smith
4. Mia Johnson
5. Ethan Williams
6. Zoe Brown

**Master Builder Prime cohort (6 students):**
7. Noah Davis
8. Isla Wilson
9. Lucas Taylor
10. Amelia Anderson
11. Finn Thomas
12. Sophie Jackson

### Enrolments (12)
- 6 × ACTIVE → Junior Engineers cohort
- 6 × ACTIVE → Master Builder Prime cohort

### Attendance (12 records)

| Session | Records | Distribution |
|---------|---------|--------------|
| Session 1 (past) | 6 | PRESENT ×4, ABSENT ×1, LATE ×1 |
| Session 2 (today) | 6 | PRESENT ×6 |
| Sessions 3 & 4 (future) | 0 | — |

## data-model.md Updates

Add an **Implementation Status** section near the top of `platform/Docs/data-model.md` containing:

1. A status table listing all entities with: `✅ MVP` | `⏳ Planned`
2. For each MVP entity, a note on fields deferred to later (e.g. JSONB settings, denormalized counts)

**Entity status:**

| Entity | MVP Status |
|--------|-----------|
| Organisation | ✅ MVP |
| Campus | ✅ MVP |
| Staff + CampusStaff | ✅ MVP |
| Program | ✅ MVP |
| Cohort | ✅ MVP |
| Session | ✅ MVP |
| Family | ✅ MVP |
| Student | ✅ MVP |
| Enrolment | ✅ MVP |
| Attendance | ✅ MVP |
| SkillTree / SkillNode / SkillProgress | ⏳ Planned |
| ProjectSubmission | ⏳ Planned |
| Invoice / Payment | ⏳ Planned |
| Message / Notification | ⏳ Planned |

**Deferred fields per MVP entity (examples):**
- Organisation: `settings Json` (JSONB config)
- Campus: timezone, contact email/phone
- Staff: `qualifications Json`
- Cohort: `currentEnrolments` (denormalized count), `startDate`, `endDate`
- Enrolment: full state machine transitions (enquiry → trial → pending_payment → enrolled → active → completed/dropped/transferred)
- Invoice / Payment: entire billing layer

## Files to Create/Modify

| File | Action |
|------|--------|
| `platform/api/prisma/schema.prisma` | Replace HealthCheck placeholder with full schema |
| `platform/api/prisma/seed.js` | Create seed script |
| `platform/api/package.json` | Confirm `prisma.seed` script entry |
| `platform/Docs/data-model.md` | Add Implementation Status section |
