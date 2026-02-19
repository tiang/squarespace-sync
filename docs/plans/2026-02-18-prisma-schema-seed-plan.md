# Prisma Schema & Seed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Define the Prisma schema for 10 platform entities, run the initial migration, and seed with realistic synthetic Australian data.

**Architecture:** Schema uses Approach B — platform-native entities (Organisation → Campus → Cohort → Session, Student → Family → Enrolment → Attendance) with fields grounded in what iClassPro currently tracks. No speculative columns. Seed data is fully synthetic (no PII from iClassPro).

**Tech Stack:** Prisma 5.22, PostgreSQL (Docker), Node.js plain JS

**Pre-requisite:** Docker infra must be running before Tasks 3 and 5.
```bash
cd platform && docker-compose -f docker-compose.infra.yml up -d
# or: make infra-up (if Makefile has that target)
```

---

### Task 1: Update data-model.md with Implementation Status

**Files:**
- Modify: `platform/Docs/data-model.md`

**Step 1: Insert the Implementation Status section**

Open `platform/Docs/data-model.md`. After the `# Data Model` heading (line 1) and before `## 1. Core Entities` (line 3), insert the following block:

```markdown
## Implementation Status

This document tracks both the full aspirational data model and the current MVP implementation.

| Entity | MVP Status | Notes |
|--------|-----------|-------|
| Organisation | ✅ Implemented | MVP fields only (name). Deferred: logo_url, primary_color, billing_email, abn, settings |
| Campus | ✅ Implemented | MVP fields only (name, address columns). Deferred: timezone, contact_email, contact_phone, is_active |
| Staff + CampusStaff | ✅ Implemented | MVP fields (firstName, lastName, email, role). Deferred: qualifications JSONB |
| Program | ✅ Implemented | MVP fields (name, description). Deferred: age_min/max, skill_level, duration_weeks, session_duration_minutes, default_price, skill_tree_id, is_active |
| Cohort | ✅ Implemented | MVP fields (name, status, room, maxCapacity). Deferred: startDate, endDate, currentEnrolments (denorm count), CohortStaff join table |
| Session | ✅ Implemented | MVP fields (scheduledAt, durationMinutes, status, leadInstructorId). Deferred: teaching assistant many-to-many, notes |
| Family | ✅ Implemented | MVP fields (name, primaryEmail, primaryPhone, address columns). Deferred: emergencyContacts, account_balance |
| Student | ✅ Implemented | MVP fields (firstName, lastName, birthDate, gender, healthConcerns, allowPhoto). Deferred: — |
| Enrolment | ✅ Implemented | MVP fields (status, startDate, dropDate, isTrial, isWaitlist). Deferred: full state machine (enquiry → trial → pending_payment → enrolled → active → completed/dropped/transferred) |
| Attendance | ✅ Implemented | MVP fields (status, notes). Unique on (sessionId, studentId). |
| SkillTree / SkillNode / SkillProgress | ⏳ Planned | — |
| ProjectSubmission | ⏳ Planned | — |
| Invoice / Payment | ⏳ Planned | — |
| Message / Notification | ⏳ Planned | — |

### iClassPro → MVP Field Mapping

Fields in the MVP schema that directly map from iClassPro data:

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
| `Family.addressStreet/City/State/Postcode` | `address.{ street, city, state, zip }` |

---

```

**Step 2: Commit**

```bash
git add platform/Docs/data-model.md
git commit -m "docs: add implementation status and iClassPro field mapping to data-model"
```

---

### Task 2: Write the Prisma Schema

**Files:**
- Modify: `platform/api/prisma/schema.prisma`

**Step 1: Replace the file entirely with the full schema**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

// ─── Enums ────────────────────────────────────────────────────────────────────

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

// ─── Models ───────────────────────────────────────────────────────────────────

model Organisation {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  campuses Campus[]
  staff    Staff[]
  programs Program[]
}

model Campus {
  id              String       @id @default(uuid())
  organisationId  String
  organisation    Organisation @relation(fields: [organisationId], references: [id])
  name            String
  addressStreet   String?
  addressCity     String?
  addressState    String?
  addressPostcode String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  campusStaff CampusStaff[]
  cohorts     Cohort[]
  families    Family[]
}

model Staff {
  id             String       @id @default(uuid())
  organisationId String
  organisation   Organisation @relation(fields: [organisationId], references: [id])
  firstName      String
  lastName       String
  email          String       @unique
  role           StaffRole
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  campusStaff CampusStaff[]
  ledSessions Session[]     @relation("LeadInstructor")
}

model CampusStaff {
  campusId String
  staffId  String
  campus   Campus @relation(fields: [campusId], references: [id])
  staff    Staff  @relation(fields: [staffId], references: [id])

  @@id([campusId, staffId])
}

model Program {
  id             String       @id @default(uuid())
  organisationId String
  organisation   Organisation @relation(fields: [organisationId], references: [id])
  name           String
  description    String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  cohorts Cohort[]
}

model Cohort {
  id          String       @id @default(uuid())
  programId   String
  program     Program      @relation(fields: [programId], references: [id])
  campusId    String
  campus      Campus       @relation(fields: [campusId], references: [id])
  name        String
  status      CohortStatus
  room        String?
  maxCapacity Int
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  sessions   Session[]
  enrolments Enrolment[]
}

model Session {
  id               String        @id @default(uuid())
  cohortId         String
  cohort           Cohort        @relation(fields: [cohortId], references: [id])
  leadInstructorId String
  leadInstructor   Staff         @relation("LeadInstructor", fields: [leadInstructorId], references: [id])
  scheduledAt      DateTime
  durationMinutes  Int
  status           SessionStatus
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  attendances Attendance[]
}

model Family {
  id              String   @id @default(uuid())
  campusId        String
  campus          Campus   @relation(fields: [campusId], references: [id])
  name            String
  primaryEmail    String
  primaryPhone    String?
  addressStreet   String?
  addressCity     String?
  addressState    String?
  addressPostcode String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  students Student[]
}

model Student {
  id             String    @id @default(uuid())
  familyId       String
  family         Family    @relation(fields: [familyId], references: [id])
  firstName      String
  lastName       String
  birthDate      DateTime
  gender         String?
  healthConcerns String?
  allowPhoto     Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  enrolments  Enrolment[]
  attendances Attendance[]
}

model Enrolment {
  id         String          @id @default(uuid())
  studentId  String
  student    Student         @relation(fields: [studentId], references: [id])
  cohortId   String
  cohort     Cohort          @relation(fields: [cohortId], references: [id])
  status     EnrolmentStatus
  startDate  DateTime
  dropDate   DateTime?
  isTrial    Boolean         @default(false)
  isWaitlist Boolean         @default(false)
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt

  @@unique([studentId, cohortId])
}

model Attendance {
  id        String           @id @default(uuid())
  sessionId String
  session   Session          @relation(fields: [sessionId], references: [id])
  studentId String
  student   Student          @relation(fields: [studentId], references: [id])
  status    AttendanceStatus
  notes     String?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@unique([sessionId, studentId])
}
```

**Step 2: Validate schema**

```bash
cd platform/api && npx prisma validate
```

Expected: `The schema at "prisma/schema.prisma" is valid 🎉`

**Step 3: Commit**

```bash
git add platform/api/prisma/schema.prisma
git commit -m "feat(platform): define Prisma schema for 10 MVP entities"
```

---

### Task 3: Run Initial Migration

**Pre-requisite:** Docker Postgres container must be running.
```bash
# From repo root — start infra only (postgres, not the full stack)
cd platform && docker-compose -f docker-compose.infra.yml up -d postgres
# Wait ~5 seconds for Postgres to be ready, then verify:
docker-compose -f docker-compose.infra.yml ps
# postgres container should show "healthy"
```

**Step 1: Run migration**

```bash
cd platform/api && npx prisma migrate dev --name init
```

Expected output:
```
Applying migration `20260218000000_init`
Database changes applied.
✔ Generated Prisma Client
```

A new file is created: `platform/api/prisma/migrations/20260218XXXXXX_init/migration.sql`

**Step 2: Confirm migration file exists**

```bash
ls platform/api/prisma/migrations/
```

Expected: one folder named `20260218XXXXXX_init` containing `migration.sql`

**Step 3: Commit**

```bash
git add platform/api/prisma/migrations/
git commit -m "feat(platform): add initial Prisma migration"
```

---

### Task 4: Write Seed Script and Configure package.json

**Files:**
- Create: `platform/api/prisma/seed.js`
- Modify: `platform/api/package.json`

**Step 1: Add seed script entry to package.json**

In `platform/api/package.json`, add a `prisma` key with a `seed` command (alongside the existing `scripts`, `jest`, `dependencies` keys):

```json
{
  "name": "platform-api",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "prisma": {
    "seed": "node prisma/seed.js"
  },
  "jest": {
    "testEnvironment": "node"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "cors": "^2.8.5",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.9",
    "prisma": "^5.22.0",
    "supertest": "^7.0.0"
  }
}
```

**Step 2: Create the seed file**

Create `platform/api/prisma/seed.js` with the following content:

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clean up in reverse FK dependency order
  await prisma.attendance.deleteMany();
  await prisma.enrolment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.cohort.deleteMany();
  await prisma.program.deleteMany();
  await prisma.campusStaff.deleteMany();
  await prisma.student.deleteMany();
  await prisma.family.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.organisation.deleteMany();

  // ── Organisation ──────────────────────────────────────────────────────────
  const org = await prisma.organisation.create({
    data: { name: 'Rocket Academy' },
  });

  // ── Campus ────────────────────────────────────────────────────────────────
  const campus = await prisma.campus.create({
    data: {
      organisationId: org.id,
      name: 'Werribee',
      addressStreet: '12 Hoppers Lane',
      addressCity: 'Werribee',
      addressState: 'VIC',
      addressPostcode: '3030',
    },
  });

  // ── Staff ─────────────────────────────────────────────────────────────────
  const sarah = await prisma.staff.create({
    data: {
      organisationId: org.id,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      email: 'sarah.mitchell@rocketacademy.edu.au',
      role: 'ADMIN',
    },
  });

  const jake = await prisma.staff.create({
    data: {
      organisationId: org.id,
      firstName: 'Jake',
      lastName: 'Scott',
      email: 'jake.scott@rocketacademy.edu.au',
      role: 'LEAD_INSTRUCTOR',
    },
  });

  const emma = await prisma.staff.create({
    data: {
      organisationId: org.id,
      firstName: 'Emma',
      lastName: 'Chen',
      email: 'emma.chen@rocketacademy.edu.au',
      role: 'LEAD_INSTRUCTOR',
    },
  });

  // ── CampusStaff ───────────────────────────────────────────────────────────
  await prisma.campusStaff.createMany({
    data: [
      { campusId: campus.id, staffId: sarah.id },
      { campusId: campus.id, staffId: jake.id },
      { campusId: campus.id, staffId: emma.id },
    ],
  });

  // ── Programs ──────────────────────────────────────────────────────────────
  const juniorEngineers = await prisma.program.create({
    data: {
      organisationId: org.id,
      name: 'Junior Engineers',
      description: 'Introduction to programming through hands-on engineering projects',
    },
  });

  const masterBuilder = await prisma.program.create({
    data: {
      organisationId: org.id,
      name: 'Master Builder Prime',
      description: 'Advanced construction and computational thinking for experienced builders',
    },
  });

  // ── Cohorts ───────────────────────────────────────────────────────────────
  const cohort1 = await prisma.cohort.create({
    data: {
      programId: juniorEngineers.id,
      campusId: campus.id,
      name: 'Junior Engineers — Term 1 2026',
      status: 'ACTIVE',
      room: 'Room A',
      maxCapacity: 8,
    },
  });

  const cohort2 = await prisma.cohort.create({
    data: {
      programId: masterBuilder.id,
      campusId: campus.id,
      name: 'Master Builder Prime — Term 2 2026',
      status: 'UPCOMING',
      room: 'Room B',
      maxCapacity: 8,
    },
  });

  // ── Sessions ──────────────────────────────────────────────────────────────
  // All sessions: Wed 4:00 PM AEDT (UTC+11) = 05:00 UTC
  // Cohort 2 sessions: Wed 5:00 PM AEDT = 06:00 UTC
  const session1 = await prisma.session.create({
    data: {
      cohortId: cohort1.id,
      leadInstructorId: jake.id,
      scheduledAt: new Date('2026-02-11T05:00:00.000Z'), // past — COMPLETED
      durationMinutes: 75,
      status: 'COMPLETED',
    },
  });

  const session2 = await prisma.session.create({
    data: {
      cohortId: cohort1.id,
      leadInstructorId: jake.id,
      scheduledAt: new Date('2026-02-18T05:00:00.000Z'), // today
      durationMinutes: 75,
      status: 'SCHEDULED',
    },
  });

  await prisma.session.create({
    data: {
      cohortId: cohort2.id,
      leadInstructorId: emma.id,
      scheduledAt: new Date('2026-02-25T06:00:00.000Z'), // future
      durationMinutes: 75,
      status: 'SCHEDULED',
    },
  });

  await prisma.session.create({
    data: {
      cohortId: cohort2.id,
      leadInstructorId: emma.id,
      scheduledAt: new Date('2026-03-04T06:00:00.000Z'), // future
      durationMinutes: 75,
      status: 'SCHEDULED',
    },
  });

  // ── Families & Students ───────────────────────────────────────────────────
  const cohort1Data = [
    {
      family: { name: 'Nguyen Family', primaryEmail: 'nguyen.family@gmail.com', primaryPhone: '0412345678', addressStreet: '14 Parkview Drive', addressCity: 'Werribee', addressState: 'VIC', addressPostcode: '3030' },
      student: { firstName: 'Liam', lastName: 'Nguyen', birthDate: new Date('2017-03-15'), gender: 'M' },
    },
    {
      family: { name: 'Tran Family', primaryEmail: 'tran.family@gmail.com', primaryPhone: '0423456789', addressStreet: '7 Bellbird Court', addressCity: 'Hoppers Crossing', addressState: 'VIC', addressPostcode: '3029' },
      student: { firstName: 'Charlotte', lastName: 'Tran', birthDate: new Date('2016-07-22'), gender: 'F' },
    },
    {
      family: { name: 'Smith Family', primaryEmail: 'smith.family@gmail.com', primaryPhone: '0434567890', addressStreet: '23 Rivervale Way', addressCity: 'Wyndham Vale', addressState: 'VIC', addressPostcode: '3024' },
      student: { firstName: 'Oscar', lastName: 'Smith', birthDate: new Date('2018-01-10'), gender: 'M' },
    },
    {
      family: { name: 'Johnson Family', primaryEmail: 'johnson.family@gmail.com', primaryPhone: '0445678901', addressStreet: '5 Sunridge Crescent', addressCity: 'Point Cook', addressState: 'VIC', addressPostcode: '3030' },
      student: { firstName: 'Mia', lastName: 'Johnson', birthDate: new Date('2015-11-30'), gender: 'F' },
    },
    {
      family: { name: 'Williams Family', primaryEmail: 'williams.family@gmail.com', primaryPhone: '0456789012', addressStreet: '31 Maplewood Avenue', addressCity: 'Werribee', addressState: 'VIC', addressPostcode: '3030' },
      student: { firstName: 'Ethan', lastName: 'Williams', birthDate: new Date('2017-09-05'), gender: 'M' },
    },
    {
      family: { name: 'Brown Family', primaryEmail: 'brown.family@gmail.com', primaryPhone: '0467890123', addressStreet: '18 Cloverleaf Street', addressCity: 'Hoppers Crossing', addressState: 'VIC', addressPostcode: '3029' },
      student: { firstName: 'Zoe', lastName: 'Brown', birthDate: new Date('2016-04-18'), gender: 'F' },
    },
  ];

  const cohort2Data = [
    {
      family: { name: 'Davis Family', primaryEmail: 'davis.family@gmail.com', primaryPhone: '0478901234', addressStreet: '42 Banksia Road', addressCity: 'Tarneit', addressState: 'VIC', addressPostcode: '3029' },
      student: { firstName: 'Noah', lastName: 'Davis', birthDate: new Date('2018-06-25'), gender: 'M' },
    },
    {
      family: { name: 'Wilson Family', primaryEmail: 'wilson.family@gmail.com', primaryPhone: '0489012345', addressStreet: '9 Lillypilly Lane', addressCity: 'Wyndham Vale', addressState: 'VIC', addressPostcode: '3024' },
      student: { firstName: 'Isla', lastName: 'Wilson', birthDate: new Date('2015-08-14'), gender: 'F' },
    },
    {
      family: { name: 'Taylor Family', primaryEmail: 'taylor.family@gmail.com', primaryPhone: '0491123456', addressStreet: '67 Federation Drive', addressCity: 'Werribee', addressState: 'VIC', addressPostcode: '3030' },
      student: { firstName: 'Lucas', lastName: 'Taylor', birthDate: new Date('2017-12-03'), gender: 'M' },
    },
    {
      family: { name: 'Anderson Family', primaryEmail: 'anderson.family@gmail.com', primaryPhone: '0402234567', addressStreet: '11 Kurrajong Close', addressCity: 'Point Cook', addressState: 'VIC', addressPostcode: '3030' },
      student: { firstName: 'Amelia', lastName: 'Anderson', birthDate: new Date('2016-02-28'), gender: 'F' },
    },
    {
      family: { name: 'Thomas Family', primaryEmail: 'thomas.family@gmail.com', primaryPhone: '0413345678', addressStreet: '29 Ironbark Court', addressCity: 'Hoppers Crossing', addressState: 'VIC', addressPostcode: '3029' },
      student: { firstName: 'Finn', lastName: 'Thomas', birthDate: new Date('2018-10-17'), gender: 'M' },
    },
    {
      family: { name: 'Jackson Family', primaryEmail: 'jackson.family@gmail.com', primaryPhone: '0424456789', addressStreet: '3 Acacia Way', addressCity: 'Tarneit', addressState: 'VIC', addressPostcode: '3029' },
      student: { firstName: 'Sophie', lastName: 'Jackson', birthDate: new Date('2015-05-09'), gender: 'F' },
    },
  ];

  const cohort1Students = [];
  for (const { family: familyData, student: studentData } of cohort1Data) {
    const family = await prisma.family.create({ data: { campusId: campus.id, ...familyData } });
    const student = await prisma.student.create({ data: { familyId: family.id, ...studentData } });
    cohort1Students.push(student);
  }

  const cohort2Students = [];
  for (const { family: familyData, student: studentData } of cohort2Data) {
    const family = await prisma.family.create({ data: { campusId: campus.id, ...familyData } });
    const student = await prisma.student.create({ data: { familyId: family.id, ...studentData } });
    cohort2Students.push(student);
  }

  // ── Enrolments ────────────────────────────────────────────────────────────
  for (const student of cohort1Students) {
    await prisma.enrolment.create({
      data: { studentId: student.id, cohortId: cohort1.id, status: 'ACTIVE', startDate: new Date('2026-02-04') },
    });
  }

  for (const student of cohort2Students) {
    await prisma.enrolment.create({
      data: { studentId: student.id, cohortId: cohort2.id, status: 'ACTIVE', startDate: new Date('2026-04-07') },
    });
  }

  // ── Attendance ────────────────────────────────────────────────────────────
  // Session 1 (past, COMPLETED): 4 PRESENT, 1 ABSENT, 1 LATE
  const session1Statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE'];
  for (let i = 0; i < cohort1Students.length; i++) {
    await prisma.attendance.create({
      data: { sessionId: session1.id, studentId: cohort1Students[i].id, status: session1Statuses[i] },
    });
  }

  // Session 2 (today, SCHEDULED): all PRESENT
  for (const student of cohort1Students) {
    await prisma.attendance.create({
      data: { sessionId: session2.id, studentId: student.id, status: 'PRESENT' },
    });
  }

  console.log('Seed complete:');
  console.log('  1 organisation, 1 campus, 3 staff');
  console.log('  2 programs, 2 cohorts, 4 sessions');
  console.log('  12 families, 12 students, 12 enrolments');
  console.log('  12 attendance records (sessions 1 & 2 only)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 3: Commit**

```bash
git add platform/api/prisma/seed.js platform/api/package.json
git commit -m "feat(platform): add seed script with synthetic Australian data"
```

---

### Task 5: Run Seed and Verify

**Pre-requisite:** Docker Postgres must be running (same as Task 3).

**Step 1: Run seed**

```bash
cd platform/api && npx prisma db seed
```

Expected output:
```
Running seed command `node prisma/seed.js` ...
Seed complete:
  1 organisation, 1 campus, 3 staff
  2 programs, 2 cohorts, 4 sessions
  12 families, 12 students, 12 enrolments
  12 attendance records (sessions 1 & 2 only)

🌱  The seed command has been executed.
```

**Step 2: Verify record counts via Prisma**

Run a quick verification script inline:

```bash
cd platform/api && node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.organisation.count(),
  p.campus.count(),
  p.staff.count(),
  p.program.count(),
  p.cohort.count(),
  p.session.count(),
  p.family.count(),
  p.student.count(),
  p.enrolment.count(),
  p.attendance.count(),
]).then(([org, campus, staff, program, cohort, session, family, student, enrolment, attendance]) => {
  console.log({ org, campus, staff, program, cohort, session, family, student, enrolment, attendance });
  return p.\$disconnect();
});
"
```

Expected:
```json
{ org: 1, campus: 1, staff: 3, program: 2, cohort: 2, session: 4, family: 12, student: 12, enrolment: 12, attendance: 12 }
```

**Step 3: Spot-check a student with their cohort**

```bash
cd platform/api && node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.student.findFirst({
  include: { family: true, enrolments: { include: { cohort: true } } }
}).then(s => {
  console.log(s.firstName, s.lastName, '->', s.enrolments[0].cohort.name);
  return p.\$disconnect();
});
"
```

Expected: something like `Liam Nguyen -> Junior Engineers — Term 1 2026`

**Step 4: Commit**

No new files — this task has no changes to commit. Seed data lives in the database, not in git.

---

## Summary

| Task | Files changed |
|------|--------------|
| 1. Update data-model.md | `platform/Docs/data-model.md` |
| 2. Prisma schema | `platform/api/prisma/schema.prisma` |
| 3. Migration | `platform/api/prisma/migrations/` (auto-generated) |
| 4. Seed script | `platform/api/prisma/seed.js`, `platform/api/package.json` |
| 5. Run & verify | No files (database only) |
