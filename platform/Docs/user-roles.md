# User Roles — Rocket Academy Classroom Management Tool

## 1. Role Overview Table

| Role | Type | Primary Goal | Access Level |
|---|---|---|---|
| Super Admin | Internal | Oversee entire organisation across all campuses | Full Admin |
| Campus Manager | Internal | Manage operations for one or more campuses | Campus Admin |
| Lead Instructor | Internal | Teach classes, track student progress | Write (own cohorts) |
| Teaching Assistant | Internal | Support classes, take attendance | Read + Limited Write |
| Front Desk Staff | Internal | Handle enrolments, payments, parent inquiries | Write (enrolments, payments) |
| Parent/Guardian | External | Monitor child progress, manage payments, communicate | Read (own family) |
| Student | External | View own progress, submit projects | Read (own data) |

---

## 2. Detailed Role Profiles

### Super Admin

**Description:** Top-level administrator with full system access across the entire organisation. Typically the business owner or senior operations manager.

**Key Responsibilities:**
- Configure organisation-wide settings (programs, billing rules, notification templates)
- Manage all campuses, staff, and permissions
- Access all financial and operational reports
- Handle data exports and system integrations
- Manage user roles and security settings

**Key Permissions:**
- ✅ Create/edit/delete campuses, programs, cohorts
- ✅ Manage all staff accounts and assign roles
- ✅ Access all financial data and reports across all campuses
- ✅ Configure system-wide settings (branding, payment gateway, notification rules)
- ✅ Export all organisational data
- ✅ View audit logs

**Key Restrictions:**
- None — full system access

**Primary Screens:**
- Admin Dashboard (org-wide KPIs)
- Campus Management
- Staff Directory
- Financial Reports
- System Settings

---

### Campus Manager

**Description:** Manages day-to-day operations for one or more assigned campuses. Handles enrolments, staffing, and parent communications for their campus(es).

**Key Responsibilities:**
- Manage cohorts and schedules for assigned campus(es)
- Assign instructors to cohorts
- Approve/reject enrolment requests
- Handle parent inquiries and issues
- Monitor attendance and student progress
- Generate campus-specific reports

**Key Permissions:**
- ✅ Create/edit/delete cohorts for assigned campus(es)
- ✅ Assign instructors and TAs to cohorts
- ✅ Approve enrolments and process withdrawals
- ✅ View financial data for assigned campus(es)
- ✅ Send bulk messages to families at their campus
- ✅ Configure campus-specific settings (blackout dates, room assignments)

**Key Restrictions:**
- ❌ Cannot access other campuses' data
- ❌ Cannot modify organisation-wide settings
- ❌ Cannot create/delete staff accounts (can only assign existing staff)
- ❌ Cannot access full financial reports (campus-level only)

**Primary Screens:**
- Campus Dashboard (campus KPIs)
- Enrolment Management
- Cohort Schedule
- Campus Calendar
- Staff Assignment

---

### Lead Instructor

**Description:** Teaches classes and tracks student learning progress. Primary point of contact for students during sessions.

**Key Responsibilities:**
- Take attendance for assigned cohorts
- Update student skill progress during/after class
- Review and grade student project submissions
- Add learning notes on individual students
- Communicate with parents about student progress
- Coordinate with assigned TAs

**Key Permissions:**
- ✅ View roster and details for assigned cohorts only
- ✅ Take attendance and mark excused absences
- ✅ Update student skill progress and milestones
- ✅ Grade student projects using rubrics
- ✅ Send messages to parents of students in their cohorts
- ✅ View student attendance history and progress

**Key Restrictions:**
- ❌ Cannot access financial data (invoices, payments)
- ❌ Cannot modify enrolment status or cohort settings
- ❌ Cannot access other instructors' cohorts
- ❌ Cannot approve/reject enrolment requests
- ⚠️ Can view but not edit family contact details

**Primary Screens:**
- Instructor Dashboard (upcoming sessions)
- Roll Call / Attendance (mobile-first)
- Cohort Roster
- Skill Progress Tracker
- Project Submissions

---

### Teaching Assistant (TA)

**Description:** Supports lead instructors during sessions, helps with attendance and basic student support.

**Key Responsibilities:**
- Assist during class sessions
- Take attendance under instructor supervision
- Help students with technical issues
- Monitor student engagement

**Key Permissions:**
- ✅ View roster for assigned cohorts
- ✅ Take attendance (with instructor approval)
- ⚠️ Can view but not edit skill progress
- ✅ View student projects (read-only)
- ⚠️ Can send messages to parents with instructor approval

**Key Restrictions:**
- ❌ Cannot update skill progress or grade projects
- ❌ Cannot access financial data
- ❌ Cannot modify cohort settings
- ❌ Cannot independently approve absences

**Primary Screens:**
- Session Attendance
- Cohort Roster (read-only)
- Messaging (limited)

---

### Front Desk Staff

**Description:** Handles in-person and phone inquiries, processes enrolments and payments at campus reception.

**Key Responsibilities:**
- Process walk-in enrolments and registrations
- Accept manual payments (cash, cheque)
- Answer parent inquiries about programs and schedules
- Assist with kiosk check-in troubleshooting
- Issue refunds and credits with manager approval

**Key Permissions:**
- ✅ Create new family and student records
- ✅ Process enrolments for assigned campus
- ✅ Record manual payments
- ✅ View invoice and payment history
- ✅ Issue account credits (with approval workflow)
- ✅ View campus calendar and cohort availability

**Key Restrictions:**
- ❌ Cannot access student learning progress
- ❌ Cannot modify cohort schedules or instructor assignments
- ❌ Cannot access financial reports (can only view individual ledgers)
- ❌ Cannot send bulk messages

**Primary Screens:**
- Enrolment Portal
- Payment Processing
- Family Ledger
- Campus Calendar (read-only)

---

### Parent/Guardian

**Description:** External user representing one or more enrolled students. Primary customer-facing role.

**Key Responsibilities:**
- Monitor child's learning progress and attendance
- Pay invoices and manage payment methods
- Register planned absences
- Communicate with instructors and campus staff
- Update family and student information

**Key Permissions:**
- ✅ View all enrolled children's progress, attendance, projects
- ✅ View and pay invoices online
- ✅ Submit planned absences
- ✅ Send messages to instructors and campus manager
- ✅ Update emergency contacts and family details
- ✅ Download payment receipts and certificates

**Key Restrictions:**
- ❌ Cannot view other families' data
- ❌ Cannot modify enrolment status (must request via staff)
- ❌ Cannot access instructor notes (private)
- ❌ Cannot grade or edit skill progress

**Primary Screens:**
- Family Dashboard
- Child Progress View
- Invoice & Payment Portal
- Messaging Inbox
- Session Calendar

---

### Student

**Description:** End learner in the system. Primarily read-only access to their own data with limited submission capabilities.

**Key Responsibilities:**
- View own learning progress
- Submit project links for review
- Check upcoming sessions
- View attendance history

**Key Permissions:**
- ✅ View own skill progress and milestones
- ✅ Submit project URLs and descriptions
- ✅ View own attendance history
- ✅ View session schedule for enrolled cohorts
- ⚠️ Can send messages to instructor (read-only on parent messages)

**Key Restrictions:**
- ❌ Cannot view financial data
- ❌ Cannot view other students' progress
- ❌ Cannot modify enrolment or family details
- ❌ Cannot access instructor notes

**Primary Screens:**
- Student Dashboard (my progress)
- Project Submission Portal
- Session Calendar (read-only)

---

## 3. Role Interaction Map

### Hierarchical Relationships
```
Super Admin
    ↓
Campus Manager (per campus)
    ↓
Lead Instructor ← → Teaching Assistant
    ↓
Student ← → Parent/Guardian
```

### Communication Flows
- **Parent ↔ Lead Instructor:** Progress updates, absence notifications, general inquiries
- **Parent ↔ Campus Manager:** Enrolment issues, billing disputes, complaints
- **Parent ↔ Front Desk:** Walk-in payments, quick questions, check-in support
- **Lead Instructor ↔ Campus Manager:** Cohort coordination, scheduling conflicts, student issues
- **Lead Instructor ↔ TA:** Session coordination, attendance handoff
- **Campus Manager ↔ Super Admin:** Campus performance, staffing needs, system issues

### Approval Workflows
- **Enrolment Requests:** Parent submits → Front Desk reviews → Campus Manager approves
- **Refund Requests:** Parent requests → Campus Manager reviews → Super Admin approves (if >$500)
- **Skill Progress Updates:** Instructor updates → Auto-visible to Parent (no approval needed)
- **Planned Absences:** Parent submits → Auto-logged (no approval) → Instructor sees flag

---

## 4. Permission Matrix

| Action | Super Admin | Campus Manager | Lead Instructor | TA | Front Desk | Parent | Student |
|---|---|---|---|---|---|---|---|
| **Enrolment Management** |
| Create enrolment | ✅ | ✅ | ❌ | ❌ | ✅ | ⚠️ Request only | ❌ |
| Approve enrolment | ✅ | ✅ | ❌ | ❌ | ⚠️ Campus only | ❌ | ❌ |
| Withdraw student | ✅ | ✅ | ❌ | ❌ | ⚠️ With approval | ⚠️ Request only | ❌ |
| Transfer cohorts | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ Request only | ❌ |
| **Financial** |
| View invoices (all) | ✅ | ⚠️ Campus only | ❌ | ❌ | ⚠️ Individual only | ⚠️ Own family | ❌ |
| Process payments | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Issue refunds | ✅ | ⚠️ <$500 | ❌ | ❌ | ⚠️ With approval | ⚠️ Request only | ❌ |
| View financial reports | ✅ | ⚠️ Campus only | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Class Management** |
| Create cohorts | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign instructors | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cancel sessions | ✅ | ✅ | ⚠️ Emergency only | ❌ | ❌ | ❌ | ❌ |
| View cohort roster | ✅ | ✅ | ⚠️ Own cohorts | ⚠️ Own cohorts | ✅ | ❌ | ❌ |
| **Attendance** |
| Take attendance | ✅ | ✅ | ✅ | ⚠️ With approval | ❌ | ❌ | ❌ |
| Excuse absences | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ Via planned absence | ❌ |
| View attendance history | ✅ | ✅ | ⚠️ Own cohorts | ⚠️ Own cohorts | ✅ | ⚠️ Own children | ⚠️ Own only |
| Issue makeup tokens | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Learning Progress** |
| Update skill progress | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Grade projects | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View skill progress | ✅ | ✅ | ⚠️ Own cohorts | ⚠️ Own cohorts | ❌ | ⚠️ Own children | ⚠️ Own only |
| Submit projects | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Add learning notes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Communication** |
| Send bulk messages | ✅ | ⚠️ Campus only | ❌ | ❌ | ❌ | ❌ | ❌ |
| Message parents | ✅ | ✅ | ⚠️ Own cohorts | ⚠️ With approval | ✅ | N/A | ❌ |
| Message instructors | ✅ | ✅ | N/A | N/A | ✅ | ✅ | ⚠️ Limited |
| View message history | ✅ | ✅ | ⚠️ Own threads | ⚠️ Own threads | ⚠️ Own threads | ⚠️ Own threads | ⚠️ Own threads |
| **Administration** |
| Manage staff accounts | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configure settings | ✅ | ⚠️ Campus only | ❌ | ❌ | ❌ | ⚠️ Preferences | ⚠️ Preferences |
| Access audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export data | ✅ | ⚠️ Campus only | ❌ | ❌ | ❌ | ⚠️ Own family | ❌ |
| Generate reports | ✅ | ⚠️ Campus only | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full permission
- ⚠️ Limited/conditional permission (see notes)
- ❌ No permission
