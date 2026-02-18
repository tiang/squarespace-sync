# Data Model — Rocket Academy Classroom Management Tool

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

## 1. Core Entities

### Organisation
**Description:** Top-level tenant representing the entire business (Rocket Academy).

**Key Fields:**
- `id` (UUID, PK)
- `name` (VARCHAR 200)
- `logo_url` (VARCHAR 500)
- `primary_color` (VARCHAR 7) — hex color for branding
- `billing_email` (VARCHAR 255)
- `abn` (VARCHAR 20) — Australian Business Number
- `settings` (JSONB) — org-wide config (notification templates, defaults)
- `created_at` (TIMESTAMP)

**Relationships:**
- One-to-many: Campus
- One-to-many: Staff
- One-to-many: Program

---

### Campus
**Description:** Physical location where classes are held. Supports multi-campus operations.

**Key Fields:**
- `id` (UUID, PK)
- `organisation_id` (UUID, FK → Organisation)
- `name` (VARCHAR 200) — "Werribee Campus"
- `address` (TEXT)
- `suburb` (VARCHAR 100)
- `state` (VARCHAR 3) — "VIC", "NSW"
- `postcode` (VARCHAR 4)
- `timezone` (VARCHAR 50) — "Australia/Melbourne"
- `contact_email` (VARCHAR 255)
- `contact_phone` (VARCHAR 20)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Organisation
- One-to-many: Cohort
- Many-to-many: Staff (via CampusStaff)

---

### Program
**Description:** Reusable curriculum template (e.g., "Scratch Basics Level 1"). Used to create Cohorts.

**Key Fields:**
- `id` (UUID, PK)
- `organisation_id` (UUID, FK → Organisation)
- `name` (VARCHAR 200)
- `description` (TEXT)
- `age_min` (INT) — minimum age
- `age_max` (INT) — maximum age
- `skill_level` (ENUM: 'beginner', 'intermediate', 'advanced')
- `duration_weeks` (INT) — typical program length
- `session_duration_minutes` (INT) — e.g., 90
- `default_price` (DECIMAL 10,2) — base tuition per term
- `skill_tree_id` (UUID, FK → SkillTree)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Organisation
- One-to-many: Cohort
- Many-to-one: SkillTree

---

### Cohort
**Description:** Instance of a Program scheduled for specific dates, campus, and instructors. The "class" students enrol in.

**Key Fields:**
- `id` (UUID, PK)
- `program_id` (UUID, FK → Program)
- `campus_id` (UUID, FK → Campus)
- `name` (VARCHAR 200) — "Scratch Basics - Spring 2026"
- `start_date` (DATE)
- `end_date` (DATE)
- `max_capacity` (INT)
- `current_enrolments` (INT) — denormalized count
- `status` (ENUM: 'draft', 'open', 'full', 'in_progress', 'completed', 'cancelled')
- `tuition_price` (DECIMAL 10,2) — can override program default
- `room` (VARCHAR 100)
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Program
- Many-to-one: Campus
- One-to-many: Session
- One-to-many: Enrolment
- Many-to-many: Staff (via CohortStaff)

---

### Session
**Description:** Individual class meeting within a Cohort. Represents a single date/time slot.

**Key Fields:**
- `id` (UUID, PK)
- `cohort_id` (UUID, FK → Cohort)
- `session_number` (INT) — 1, 2, 3... within cohort
- `scheduled_date` (DATE)
- `scheduled_start_time` (TIME)
- `scheduled_end_time` (TIME)
- `actual_start_time` (TIME) — nullable
- `actual_end_time` (TIME) — nullable
- `status` (ENUM: 'scheduled', 'in_progress', 'completed', 'cancelled')
- `cancellation_reason` (TEXT) — nullable
- `location_notes` (VARCHAR 200) — "Room changed to Lab 2"
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Cohort
- One-to-many: Attendance
- Many-to-one: Staff (lead_instructor_id FK)
- Many-to-many: Staff (TAs via SessionStaff)

---

### Family
**Description:** Billing and account unit. One family account may have multiple children enrolled.

**Key Fields:**
- `id` (UUID, PK)
- `organisation_id` (UUID, FK → Organisation)
- `family_name` (VARCHAR 200) — "The Smiths"
- `primary_contact_name` (VARCHAR 200)
- `primary_contact_email` (VARCHAR 255, UNIQUE)
- `primary_contact_phone` (VARCHAR 20)
- `secondary_contact_name` (VARCHAR 200) — nullable
- `secondary_contact_email` (VARCHAR 255) — nullable
- `secondary_contact_phone` (VARCHAR 20) — nullable
- `street_address` (TEXT)
- `suburb` (VARCHAR 100)
- `state` (VARCHAR 3)
- `postcode` (VARCHAR 4)
- `emergency_contact_name` (VARCHAR 200)
- `emergency_contact_phone` (VARCHAR 20)
- `account_balance` (DECIMAL 10,2) — denormalized current balance
- `stripe_customer_id` (VARCHAR 100) — nullable
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Organisation
- One-to-many: Student
- One-to-many: Invoice
- One-to-many: Payment
- One-to-many: Message

---

### Student
**Description:** Individual learner enrolled in programs. Always belongs to a Family.

**Key Fields:**
- `id` (UUID, PK)
- `family_id` (UUID, FK → Family)
- `first_name` (VARCHAR 100)
- `last_name` (VARCHAR 100)
- `date_of_birth` (DATE)
- `medical_info` (TEXT) — allergies, conditions
- `dietary_restrictions` (TEXT)
- `photo_url` (VARCHAR 500) — nullable
- `preferred_name` (VARCHAR 100) — nullable
- `pronouns` (VARCHAR 50) — nullable
- `student_login_email` (VARCHAR 255) — nullable, for student portal
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Family
- One-to-many: Enrolment
- One-to-many: Attendance
- One-to-many: SkillProgress
- One-to-many: ProjectSubmission

---

### Enrolment
**Description:** Links a Student to a Cohort with status tracking and billing info.

**Key Fields:**
- `id` (UUID, PK)
- `student_id` (UUID, FK → Student)
- `cohort_id` (UUID, FK → Cohort)
- `status` (ENUM: 'enquiry', 'trial', 'pending_payment', 'enrolled', 'active', 'completed', 'dropped', 'transferred')
- `enrolment_date` (TIMESTAMP)
- `start_date` (DATE) — can differ from cohort start if joined late
- `end_date` (DATE) — nullable
- `tuition_override` (DECIMAL 10,2) — nullable, if different from cohort price
- `discount_applied` (DECIMAL 10,2) — sibling discount, promo code
- `is_trial` (BOOLEAN)
- `withdrawal_date` (DATE) — nullable
- `withdrawal_reason` (TEXT) — nullable
- `makeup_tokens` (INT) — number of available makeup sessions
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Student
- Many-to-one: Cohort
- One-to-many: Attendance
- One-to-one: Invoice (enrolment fee invoice)

**State Transition Notes:**
- See "Enrolment State Machine" section below

---

### Staff
**Description:** All internal users (admins, managers, instructors, TAs, front desk).

**Key Fields:**
- `id` (UUID, PK)
- `organisation_id` (UUID, FK → Organisation)
- `email` (VARCHAR 255, UNIQUE)
- `password_hash` (VARCHAR 255) — bcrypt
- `first_name` (VARCHAR 100)
- `last_name` (VARCHAR 100)
- `phone` (VARCHAR 20)
- `role` (ENUM: 'super_admin', 'campus_manager', 'lead_instructor', 'teaching_assistant', 'front_desk')
- `is_active` (BOOLEAN)
- `hired_date` (DATE)
- `qualifications` (JSONB) — certifications, degrees
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Organisation
- Many-to-many: Campus (via CampusStaff)
- Many-to-many: Cohort (via CohortStaff)
- One-to-many: Message (as sender)

---

### Attendance
**Description:** Records a student's presence at a specific session.

**Key Fields:**
- `id` (UUID, PK)
- `session_id` (UUID, FK → Session)
- `student_id` (UUID, FK → Student)
- `enrolment_id` (UUID, FK → Enrolment)
- `status` (ENUM: 'present', 'absent', 'late', 'excused', 'makeup')
- `check_in_time` (TIMESTAMP) — nullable
- `check_out_time` (TIMESTAMP) — nullable
- `notes` (TEXT) — "Student arrived 20 mins late"
- `recorded_by_staff_id` (UUID, FK → Staff)
- `recorded_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Session
- Many-to-one: Student
- Many-to-one: Enrolment
- Many-to-one: Staff (recorded_by)

---

### SkillTree
**Description:** Hierarchical structure of skills for a program (e.g., Python skills tree).

**Key Fields:**
- `id` (UUID, PK)
- `name` (VARCHAR 200) — "Python Fundamentals"
- `description` (TEXT)
- `created_at` (TIMESTAMP)

**Relationships:**
- One-to-many: SkillNode
- One-to-many: Program

---

### SkillNode
**Description:** Individual skill within a SkillTree (e.g., "Variables", "Loops", "Functions").

**Key Fields:**
- `id` (UUID, PK)
- `skill_tree_id` (UUID, FK → SkillTree)
- `parent_node_id` (UUID, FK → SkillNode) — nullable, for hierarchy
- `name` (VARCHAR 200)
- `description` (TEXT)
- `level` (INT) — depth in tree (0 = root)
- `order` (INT) — display order within siblings
- `badge_icon_url` (VARCHAR 500) — nullable
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: SkillTree
- Many-to-one: SkillNode (parent)
- One-to-many: SkillNode (children)
- One-to-many: SkillProgress

---

### SkillProgress
**Description:** Tracks a student's progress on individual skills.

**Key Fields:**
- `id` (UUID, PK)
- `student_id` (UUID, FK → Student)
- `skill_node_id` (UUID, FK → SkillNode)
- `status` (ENUM: 'not_started', 'in_progress', 'mastered')
- `mastered_at` (TIMESTAMP) — nullable
- `updated_by_staff_id` (UUID, FK → Staff)
- `notes` (TEXT) — instructor notes
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Student
- Many-to-one: SkillNode
- Many-to-one: Staff (updated_by)

---

### ProjectSubmission
**Description:** Student project submissions for assessment.

**Key Fields:**
- `id` (UUID, PK)
- `student_id` (UUID, FK → Student)
- `cohort_id` (UUID, FK → Cohort)
- `title` (VARCHAR 200)
- `description` (TEXT)
- `project_url` (VARCHAR 500) — GitHub, Replit, etc.
- `submitted_at` (TIMESTAMP)
- `graded_by_staff_id` (UUID, FK → Staff) — nullable
- `score` (DECIMAL 5,2) — nullable
- `rubric_scores` (JSONB) — {functionality: 8, code_quality: 7, creativity: 9}
- `feedback` (TEXT)
- `graded_at` (TIMESTAMP) — nullable

**Relationships:**
- Many-to-one: Student
- Many-to-one: Cohort
- Many-to-one: Staff (graded_by)

---

### Invoice
**Description:** Billing document issued to a Family for enrolment fees, tuition, materials, etc.

**Key Fields:**
- `id` (UUID, PK)
- `invoice_number` (VARCHAR 50, UNIQUE) — "INV-2026-001234"
- `family_id` (UUID, FK → Family)
- `enrolment_id` (UUID, FK → Enrolment) — nullable if not enrolment-specific
- `issue_date` (DATE)
- `due_date` (DATE)
- `total_amount` (DECIMAL 10,2)
- `gst_amount` (DECIMAL 10,2) — 10% GST for Australia
- `discount_amount` (DECIMAL 10,2)
- `amount_paid` (DECIMAL 10,2) — denormalized
- `amount_outstanding` (DECIMAL 10,2) — denormalized
- `status` (ENUM: 'draft', 'sent', 'paid', 'partial', 'overdue', 'void')
- `line_items` (JSONB) — [{desc: "Scratch Term 1", qty: 1, price: 450}]
- `notes` (TEXT)
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Family
- Many-to-one: Enrolment (nullable)
- One-to-many: Payment

---

### Payment
**Description:** Record of money received from a Family toward their account.

**Key Fields:**
- `id` (UUID, PK)
- `family_id` (UUID, FK → Family)
- `invoice_id` (UUID, FK → Invoice) — nullable if unallocated
- `payment_date` (TIMESTAMP)
- `amount` (DECIMAL 10,2)
- `payment_method` (ENUM: 'credit_card', 'bank_transfer', 'cash', 'cheque')
- `stripe_payment_intent_id` (VARCHAR 100) — nullable
- `reference_number` (VARCHAR 100)
- `notes` (TEXT)
- `recorded_by_staff_id` (UUID, FK → Staff) — nullable if online
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Family
- Many-to-one: Invoice (nullable)
- Many-to-one: Staff (recorded_by, nullable)

---

### Message
**Description:** Communication between staff and families or between staff.

**Key Fields:**
- `id` (UUID, PK)
- `sender_type` (ENUM: 'staff', 'parent')
- `sender_staff_id` (UUID, FK → Staff) — nullable
- `sender_family_id` (UUID, FK → Family) — nullable
- `recipient_type` (ENUM: 'staff', 'parent')
- `recipient_staff_id` (UUID, FK → Staff) — nullable
- `recipient_family_id` (UUID, FK → Family) — nullable
- `thread_id` (UUID) — groups messages in a conversation
- `subject` (VARCHAR 200)
- `body` (TEXT)
- `is_read` (BOOLEAN)
- `sent_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Staff (sender)
- Many-to-one: Family (sender)
- Many-to-one: Staff (recipient)
- Many-to-one: Family (recipient)

---

### Notification
**Description:** System-generated notifications (email, SMS, push).

**Key Fields:**
- `id` (UUID, PK)
- `recipient_family_id` (UUID, FK → Family) — nullable
- `recipient_staff_id` (UUID, FK → Staff) — nullable
- `type` (ENUM: 'email', 'sms', 'push')
- `template_name` (VARCHAR 100) — e.g., 'attendance_alert'
- `subject` (VARCHAR 200)
- `body` (TEXT)
- `status` (ENUM: 'queued', 'sent', 'failed')
- `sent_at` (TIMESTAMP) — nullable
- `created_at` (TIMESTAMP)

**Relationships:**
- Many-to-one: Family (nullable)
- Many-to-one: Staff (nullable)

---

## 2. Entity Relationship Summary

### One-to-Many Relationships
- **Organisation → Campus**: One org has multiple campuses
- **Organisation → Program**: One org offers multiple programs
- **Campus → Cohort**: One campus hosts multiple cohorts
- **Program → Cohort**: One program template creates multiple cohort instances
- **Cohort → Session**: One cohort has many scheduled sessions
- **Cohort → Enrolment**: One cohort has many student enrolments
- **Family → Student**: One family has multiple children
- **Family → Invoice**: One family receives multiple invoices
- **Family → Payment**: One family makes multiple payments
- **Student → Enrolment**: One student enrolls in multiple cohorts (over time)
- **Student → Attendance**: One student has many attendance records
- **Student → SkillProgress**: One student progresses through many skills
- **Session → Attendance**: One session has attendance for all enrolled students
- **SkillTree → SkillNode**: One tree contains many skill nodes
- **SkillNode → SkillNode**: Hierarchical parent-child relationship

### Many-to-Many Relationships
- **Campus ↔ Staff** (via `CampusStaff`): Staff can work at multiple campuses; campuses have multiple staff
- **Cohort ↔ Staff** (via `CohortStaff`): Cohorts have lead instructor + TAs; instructors teach multiple cohorts

### Join Tables (Implied)
```sql
CREATE TABLE CampusStaff (
  campus_id UUID REFERENCES Campus(id),
  staff_id UUID REFERENCES Staff(id),
  assigned_at TIMESTAMP,
  PRIMARY KEY (campus_id, staff_id)
);

CREATE TABLE CohortStaff (
  cohort_id UUID REFERENCES Cohort(id),
  staff_id UUID REFERENCES Staff(id),
  role ENUM('lead_instructor', 'teaching_assistant'),
  assigned_at TIMESTAMP,
  PRIMARY KEY (cohort_id, staff_id)
);
```

---

## 3. Key Design Decisions

### Decision 1: Family as Billing Unit
**Rationale:** Families (not individual students) are the paying customers. All invoices, payments, and account balances belong to the Family entity. This simplifies billing when multiple children from one family are enrolled, allows family-level discounts, and provides a single parent login for all children.

### Decision 2: Cohort vs Class Terminology
**Rationale:** We use "Cohort" to represent a scheduled instance of a Program (similar to a "class" in traditional LMS). This distinguishes it from "Session" (individual class meeting). The hierarchy is Program → Cohort → Session.

### Decision 3: Enrolment State Machine
**Rationale:** Enrolment status tracks the entire customer journey from initial enquiry through to completion or withdrawal. This allows marketing tracking, trial conversion metrics, and proper handling of different billing states. See section 4 below for full state machine.

### Decision 4: Denormalized Balances and Counts
**Rationale:** `family.account_balance`, `cohort.current_enrolments`, and `invoice.amount_outstanding` are denormalized for query performance. These are updated via triggers or application logic on payment/enrolment changes. Trade-off: slight data redundancy for significantly faster dashboard queries.

### Decision 5: JSONB for Flexible Schema Fields
**Rationale:** `organisation.settings`, `invoice.line_items`, `staff.qualifications`, and `project_submission.rubric_scores` use PostgreSQL JSONB to allow schema evolution without migrations. This is acceptable for non-relational data that doesn't require joins.

### Decision 6: Separate Student Login from Family
**Rationale:** Students have an optional `student_login_email` allowing them to log in independently to view their own progress and submit projects. Parents log in with `family.primary_contact_email` to see all their children. This separation supports child independence while maintaining parent oversight.

### Decision 7: Soft Deletes Not Implemented
**Rationale:** For compliance and audit purposes, we do NOT delete records. Instead, entities have `is_active` or status fields. For example, withdrawn students have enrolment `status='dropped'` rather than deleted enrolment records. This preserves history for reporting and regulatory compliance (Australian Privacy Act requires data retention for 7 years for minors).

### Decision 8: Multi-tenancy at Organisation Level
**Rationale:** Single database with `organisation_id` foreign keys on all tenant-scoped tables. This is simpler to manage than separate databases per tenant and supports cross-organisation reporting for Rocket Academy corporate (if needed in future). Row-Level Security (RLS) in PostgreSQL enforces data isolation.

---

## 4. Enrolment State Machine

### States
1. **enquiry**: Family expressed interest but hasn't committed
2. **trial**: Student attending a trial class (no charge or reduced charge)
3. **pending_payment**: Enrolment accepted, waiting for payment
4. **enrolled**: Payment received, enrolment confirmed but cohort hasn't started
5. **active**: Cohort in progress, student attending
6. **completed**: Cohort finished successfully
7. **dropped**: Student withdrew before completion
8. **transferred**: Student moved to a different cohort (terminal state for this enrolment)

### Valid Transitions
```
enquiry → trial
enquiry → pending_payment
enquiry → dropped

trial → pending_payment (trial conversion)
trial → dropped

pending_payment → enrolled (on payment)
pending_payment → dropped (payment failed/timeout)

enrolled → active (on cohort start_date)
enrolled → dropped (withdrawal before start)

active → completed (on cohort end_date)
active → dropped (withdrawal during term)
active → transferred (moved to different cohort)

completed: terminal
dropped: terminal
transferred: terminal
```

### Triggers for Transitions
- **Cohort start_date reached** → `enrolled` → `active` (automated job)
- **Cohort end_date reached** → `active` → `completed` (automated job)
- **Payment received** → `pending_payment` → `enrolled` (webhook from Stripe)
- **Parent requests withdrawal** → any state → `dropped` (manual admin action)

---

## 5. Suggested Database Schema (SQL)

### Core Tables

```sql
-- Organisation
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7),
  billing_email VARCHAR(255),
  abn VARCHAR(20),
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campus
CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  name VARCHAR(200) NOT NULL,
  address TEXT,
  suburb VARCHAR(100),
  state VARCHAR(3),
  postcode VARCHAR(4),
  timezone VARCHAR(50) DEFAULT 'Australia/Melbourne',
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_campus_org ON campuses(organisation_id);

-- Program
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  age_min INT,
  age_max INT,
  skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  duration_weeks INT,
  session_duration_minutes INT,
  default_price DECIMAL(10,2),
  skill_tree_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_program_org ON programs(organisation_id);

-- Cohort
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id),
  campus_id UUID NOT NULL REFERENCES campuses(id),
  name VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_capacity INT NOT NULL,
  current_enrolments INT DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('draft', 'open', 'full', 'in_progress', 'completed', 'cancelled')),
  tuition_price DECIMAL(10,2),
  room VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_cohort_program ON cohorts(program_id);
CREATE INDEX idx_cohort_campus ON cohorts(campus_id);
CREATE INDEX idx_cohort_dates ON cohorts(start_date, end_date);

-- Session
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id),
  session_number INT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME NOT NULL,
  scheduled_end_time TIME NOT NULL,
  actual_start_time TIME,
  actual_end_time TIME,
  status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  cancellation_reason TEXT,
  location_notes VARCHAR(200),
  lead_instructor_id UUID REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(cohort_id, session_number)
);
CREATE INDEX idx_session_cohort ON sessions(cohort_id);
CREATE INDEX idx_session_date ON sessions(scheduled_date);

-- Family
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  family_name VARCHAR(200),
  primary_contact_name VARCHAR(200) NOT NULL,
  primary_contact_email VARCHAR(255) NOT NULL UNIQUE,
  primary_contact_phone VARCHAR(20),
  secondary_contact_name VARCHAR(200),
  secondary_contact_email VARCHAR(255),
  secondary_contact_phone VARCHAR(20),
  street_address TEXT,
  suburb VARCHAR(100),
  state VARCHAR(3),
  postcode VARCHAR(4),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  account_balance DECIMAL(10,2) DEFAULT 0,
  stripe_customer_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_family_org ON families(organisation_id);
CREATE INDEX idx_family_email ON families(primary_contact_email);

-- Student
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  medical_info TEXT,
  dietary_restrictions TEXT,
  photo_url VARCHAR(500),
  preferred_name VARCHAR(100),
  pronouns VARCHAR(50),
  student_login_email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_student_family ON students(family_id);

-- Enrolment
CREATE TABLE enrolments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  cohort_id UUID NOT NULL REFERENCES cohorts(id),
  status VARCHAR(20) CHECK (status IN ('enquiry', 'trial', 'pending_payment', 'enrolled', 'active', 'completed', 'dropped', 'transferred')),
  enrolment_date TIMESTAMP DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  tuition_override DECIMAL(10,2),
  discount_applied DECIMAL(10,2),
  is_trial BOOLEAN DEFAULT FALSE,
  withdrawal_date DATE,
  withdrawal_reason TEXT,
  makeup_tokens INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, cohort_id)
);
CREATE INDEX idx_enrolment_student ON enrolments(student_id);
CREATE INDEX idx_enrolment_cohort ON enrolments(cohort_id);
CREATE INDEX idx_enrolment_status ON enrolments(status);

-- Staff
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(30) CHECK (role IN ('super_admin', 'campus_manager', 'lead_instructor', 'teaching_assistant', 'front_desk')),
  is_active BOOLEAN DEFAULT TRUE,
  hired_date DATE,
  qualifications JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_staff_org ON staff(organisation_id);
CREATE INDEX idx_staff_email ON staff(email);

-- Attendance
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  student_id UUID NOT NULL REFERENCES students(id),
  enrolment_id UUID NOT NULL REFERENCES enrolments(id),
  status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused', 'makeup')),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  notes TEXT,
  recorded_by_staff_id UUID REFERENCES staff(id),
  recorded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);
CREATE INDEX idx_attendance_session ON attendances(session_id);
CREATE INDEX idx_attendance_student ON attendances(student_id);

-- Invoice
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  family_id UUID NOT NULL REFERENCES families(id),
  enrolment_id UUID REFERENCES enrolments(id),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_outstanding DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'void')),
  line_items JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_invoice_family ON invoices(family_id);
CREATE INDEX idx_invoice_status ON invoices(status);

-- Payment
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  invoice_id UUID REFERENCES invoices(id),
  payment_date TIMESTAMP DEFAULT NOW(),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('credit_card', 'bank_transfer', 'cash', 'cheque')),
  stripe_payment_intent_id VARCHAR(100),
  reference_number VARCHAR(100),
  notes TEXT,
  recorded_by_staff_id UUID REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_payment_family ON payments(family_id);
CREATE INDEX idx_payment_invoice ON payments(invoice_id);
```

### Supporting Tables

```sql
-- SkillTree
CREATE TABLE skill_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SkillNode
CREATE TABLE skill_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_tree_id UUID NOT NULL REFERENCES skill_trees(id),
  parent_node_id UUID REFERENCES skill_nodes(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  level INT NOT NULL,
  order_num INT NOT NULL,
  badge_icon_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_skillnode_tree ON skill_nodes(skill_tree_id);
CREATE INDEX idx_skillnode_parent ON skill_nodes(parent_node_id);

-- SkillProgress
CREATE TABLE skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  skill_node_id UUID NOT NULL REFERENCES skill_nodes(id),
  status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'mastered')),
  mastered_at TIMESTAMP,
  updated_by_staff_id UUID REFERENCES staff(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, skill_node_id)
);
CREATE INDEX idx_skillprogress_student ON skill_progress(student_id);

-- ProjectSubmission
CREATE TABLE project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  cohort_id UUID NOT NULL REFERENCES cohorts(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  project_url VARCHAR(500),
  submitted_at TIMESTAMP DEFAULT NOW(),
  graded_by_staff_id UUID REFERENCES staff(id),
  score DECIMAL(5,2),
  rubric_scores JSONB,
  feedback TEXT,
  graded_at TIMESTAMP
);
CREATE INDEX idx_project_student ON project_submissions(student_id);
CREATE INDEX idx_project_cohort ON project_submissions(cohort_id);
```
