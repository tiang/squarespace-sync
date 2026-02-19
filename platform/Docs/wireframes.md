# Wireframes — Rocket Academy Classroom Management Tool

This document contains detailed wireframe descriptions for 8 key screens. Each wireframe is described in sufficient detail for a developer to implement.

---

## 1. Admin Dashboard

**User:** Super Admin, Campus Manager
**Purpose:** High-level overview of organisation or campus health

### Layout Structure
```
┌────────────────────────────────────────────────────────────┐
│ [Logo] Rocket Academy        [Search] [Notifications] [👤] │
├────────────────────────────────────────────────────────────┤
│ Sidebar │ Main Content Area                                │
│         │                                                   │
│ 📊 Dashboard │ ┌──────────────────────────────────────┐    │
│ 📝 Enrolments │ │ Active Enrolments    │   Revenue    │    │
│ 👥 Cohorts    │ │      248             │  $124,500    │    │
│ 💰 Billing    │ │  ↑ 12% vs last term  │  ↑ 8%        │    │
│ 📅 Calendar   │ └──────────────────────────────────────┘    │
│ 👨‍🏫 Staff      │                                            │
│ 📈 Reports    │ ┌──────────────────────────────────────┐    │
│ ⚙️ Settings    │ │ Outstanding Invoices │ Attendance   │    │
│               │ │      $18,200         │    92%       │    │
│               │ │  ⚠️ 12 overdue       │  ↑ 3%        │    │
│               │ └──────────────────────────────────────┘    │
│               │                                            │
│               │ Recent Enrolments (This Week)              │
│               │ ┌────────────────────────────────────────┐ │
│               │ │ Name      │ Program    │ Campus │ Date │ │
│               │ │ Emma S.   │ Scratch L1 │ Werr.  │ 2/15│ │
│               │ │ Liam T.   │ Python Fnd │ Camb.  │ 2/14│ │
│               │ │ [+ 8 more...]                         │ │
│               │ └────────────────────────────────────────┘ │
│               │                                            │
│               │ Campus Performance Comparison              │
│               │ [Bar chart: Werribee, Camberwell, Hawthorn]│
└────────────────────────────────────────────────────────────┘
```

### Elements Detail
- **Top Nav:** Logo left, global search bar center, notification bell icon (with red dot if unread), user avatar with dropdown menu right
- **Sidebar:** Vertical nav with icons + labels, active item highlighted
- **KPI Cards (4):** 2x2 grid, each card shows: metric name, large number, trend arrow (↑ or ↓), percentage change, sparkline graph (optional)
- **Recent Enrolments Table:** Headers: Name, Program, Campus, Date. Rows sortable. "View All" link at bottom.
- **Campus Comparison Chart:** Horizontal bar chart showing active enrolments per campus, color-coded

### Interactions
- Click KPI card to drill into detailed report
- Click enrolment name to open student profile
- Click "View All" to open full enrolment list
- Sidebar items navigate to different sections

---

## 2. Enrolment Management

**User:** Campus Manager, Front Desk Staff
**Purpose:** View, filter, and manage all enrolments

### Layout Structure
```
┌────────────────────────────────────────────────────────────┐
│ Enrolments                                                 │
├────────────────────────────────────────────────────────────┤
│ [+ New Enrolment]  [Filter: All Status ▾] [Campus: All ▾] │
│ [Search by student name...]                        [Export]│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Student   │ Cohort      │ Status    │ Start │ Actions │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ Emma S.   │ Scratch L1  │ 🟢 Active │ 2/1   │ [...] │ │
│ │           │ Werribee    │           │       │       │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ Liam T.   │ Python Fnd  │ 🟡 Pending│ 2/15  │ [...] │ │
│ │           │ Camberwell  │           │       │       │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ Ava K.    │ Scratch L2  │ ⭕ Enquiry│ -     │ [...] │ │
│ │           │ Hawthorn    │           │       │       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Showing 1-20 of 248 | [< Previous] [1 2 3 ... 13] [Next >]│
└────────────────────────────────────────────────────────────┘
```

### Elements Detail
- **Action Bar:** "New Enrolment" button (primary CTA), filter dropdowns (Status, Campus), search input, "Export CSV" button
- **Table Columns:**
  - Student: Name + small avatar
  - Cohort: Program name (bolded) + campus name (smaller, grey)
  - Status: Badge with icon and color (🟢 Active, 🟡 Pending Payment, ⭕ Enquiry, 🔴 Dropped)
  - Start Date: Session start date
  - Actions: Three-dot menu with: View Details, Edit, Withdraw, Transfer
- **Pagination:** Bottom bar with page numbers and prev/next arrows

### Interactions
- Click student name to open profile modal
- Click status badge to filter by that status
- Click [...] actions to show dropdown menu
- Filter/search updates table in real-time
- Click "New Enrolment" to open enrolment form modal

---

## 3. Cohort / Class View

**User:** Campus Manager, Lead Instructor
**Purpose:** View roster, schedule, and attendance summary for a specific cohort

### Layout Structure
```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Cohorts                                          │
│                                                            │
│ Scratch Basics Level 1 — Spring 2026                       │
│ Werribee Campus | Sat 10:00am-12:00pm | Room 3            │
│ Instructor: Mia Chen | TA: Alex Patel                      │
│                                                            │
│ [Tabs: Roster | Schedule | Attendance | Settings]          │
│                                                            │
│ ──────── Roster Tab ────────                               │
│                                                            │
│ 12 / 15 enrolled   [+ Add Student]                         │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Photo │ Name        │ Age │ Attendance │ Progress │ │   │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ [👤]  │ Emma Smith  │ 9   │ 100% (8/8) │ ████░░  65%│ │
│ │ [👤]  │ Liam Tang   │ 10  │ 88% (7/8)  │ ██████░ 85%│ │
│ │ [👤]  │ Ava Kumar   │ 9   │ 75% (6/8)  │ ███░░░  45%│ │
│ │ [+ 9 more students...]                                 │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ──────── Schedule Tab (not shown) ────────                 │
│ Lists all 12 sessions with dates, times, status            │
│                                                            │
│ ──────── Attendance Tab (not shown) ────────               │
│ Session-by-session attendance matrix                       │
└────────────────────────────────────────────────────────────┘
```

### Elements Detail
- **Cohort Header:** Large title (program name + term), metadata line (campus, time, room), instructor names
- **Tab Navigation:** Roster (default), Schedule, Attendance, Settings
- **Roster Stats:** Enrollment count vs capacity, "Add Student" button
- **Student Table:**
  - Photo: Circular avatar or placeholder
  - Name: Clickable link to student profile
  - Age: Calculated from DOB
  - Attendance: Percentage + fraction (e.g., "7/8 sessions")
  - Progress: Horizontal bar showing % of skills mastered
- **Actions (per student):** Hover reveals quick icons: View Profile, Message Parent, Mark Absence

### Interactions
- Click student name to open detailed profile modal
- Click "Add Student" to search and enrol existing students or create new
- Switch tabs to view Schedule (list of sessions) or Attendance (grid view)
- Click attendance % to open detailed attendance history for that student

---

## 4. Attendance Screen (Instructor Mobile View)

**User:** Lead Instructor, TA
**Purpose:** Quickly mark attendance on mobile during or after class

### Layout Structure (Mobile, Portrait)
```
┌──────────────────────────┐
│ Rocket Academy           │
│                          │
│ Session 8 of 12          │
│ Scratch Basics Level 1   │
│ Today, Sat Feb 17, 10am  │
│ Werribee - Room 3        │
│                          │
│ [Mark All Present]       │
│                          │
│ ────────────────────────│
│ [👤] Emma Smith          │
│ ┌────┬────┬────┬────┐   │
│ │ ✅ │ ❌ │ ⏰ │ 🔔 │   │
│ │Present│Absent│Late│Ex│
│ └────┴────┴────┴────┘   │
│ Status: ✅ Present      │
│ ────────────────────────│
│ [👤] Liam Tang           │
│ ┌────┬────┬────┬────┐   │
│ │ ✅ │ ❌ │ ⏰ │ 🔔 │   │
│ └────┴────┴────┴────┘   │
│ Status: Not marked yet  │
│ ────────────────────────│
│ [👤] Ava Kumar           │
│ ┌────┬────┬────┬────┐   │
│ │ ✅ │ ❌ │ ⏰ │ 🔔 │   │
│ └────┴────┴────┴────┘   │
│ Status: ❌ Absent       │
│ [+ Add Note]            │
│ ────────────────────────│
│                          │
│ [12 students below...]   │
│                          │
│ [← Back] [Save & Close]  │
└──────────────────────────┘
```

### Elements Detail
- **Session Header:** Session number, cohort name, date/time, location (all read-only)
- **Quick Action:** "Mark All Present" button to default everyone to present
- **Student Cards:** One per student, each with:
  - Avatar + name
  - 4 large tap buttons: Present ✅, Absent ❌, Late ⏰, Excused 🔔
  - Current status displayed below buttons (updates immediately on tap)
  - Optional "Add Note" button (expands to text field)
- **Bottom Nav:** Back button, "Save & Close" button (saves all changes and exits)

### Interactions
- Tap any status button to mark student (button highlights, status updates instantly)
- Tap same button again to toggle off (resets to "Not marked")
- Tap "Add Note" to open text field for comments (e.g., "Arrived 20 mins late")
- Scroll vertically to see all students
- "Save & Close" commits all attendance and returns to instructor dashboard

### Mobile Optimizations
- Large touch targets (48x48px minimum)
- Sticky header (session info stays visible while scrolling)
- Auto-save on each tap (no need to wait for "Save & Close")
- Offline support (V2): cache attendance locally, sync when online

---

## 5. Parent Portal — Home

**User:** Parent/Guardian
**Purpose:** Overview of all enrolled children and key actions

### Layout Structure
```
┌────────────────────────────────────────────────────────────┐
│ [Logo] Rocket Academy             [Messages 3] [Logout 👤] │
├────────────────────────────────────────────────────────────┤
│ Welcome back, Priya!                                       │
│                                                            │
│ My Children                                                 │
│ ┌───────────────────────┐ ┌───────────────────────┐       │
│ │ [👤 Emma Smith]       │ │ [👤 Liam Smith]       │       │
│ │ Age 9                 │ │ Age 12                │       │
│ │ ─────────────────────│ │ ─────────────────────│       │
│ │ Scratch Basics L1     │ │ Python Fundamentals   │       │
│ │ Werribee Campus       │ │ Camberwell Campus     │       │
│ │                       │ │                       │       │
│ │ Next session:         │ │ Next session:         │       │
│ │ Sat Feb 17, 10am      │ │ Sun Feb 18, 2pm       │       │
│ │                       │ │                       │       │
│ │ Attendance: 100% ✅   │ │ Attendance: 88% ⚠️    │       │
│ │ Progress: ████░░ 65%  │ │ Progress: ██████░ 85% │       │
│ │                       │ │                       │       │
│ │ [View Details →]      │ │ [View Details →]      │       │
│ └───────────────────────┘ └───────────────────────┘       │
│                                                            │
│ Upcoming Sessions (Next 7 Days)                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Date      │ Student │ Program       │ Campus          │ │
│ │ Sat 2/17  │ Emma    │ Scratch L1    │ Werribee 10am   │ │
│ │ Sun 2/18  │ Liam    │ Python Fnd    │ Camberwell 2pm  │ │
│ │ Sat 2/24  │ Emma    │ Scratch L1    │ Werribee 10am   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Invoices & Payments                                        │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ⚠️ 1 Overdue Invoice: $450 due Feb 1 [Pay Now →]      │ │
│ │ 💰 Account Balance: -$450.00                           │ │
│ │ [View All Invoices →]                                  │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Elements Detail
- **Top Nav:** Logo left, message icon with unread count, logout with user avatar
- **Greeting:** Personalised "Welcome back, [Name]!"
- **Child Cards:** One per enrolled child (2-column grid on desktop, stack on mobile)
  - Child avatar, name, age
  - Current cohort name + campus
  - Next session date/time
  - Attendance percentage with status icon (✅ >90%, ⚠️ <90%, ❌ <75%)
  - Progress bar (skills mastered %)
  - "View Details" button to child profile
- **Upcoming Sessions:** Table showing next 7 days of sessions across all children
- **Invoices Widget:** Alert if overdue, account balance, "Pay Now" CTA, link to full invoice list

### Interactions
- Click child card "View Details" to open child's detailed progress page
- Click upcoming session row to view session details (date, time, location, instructor)
- Click "Pay Now" to open payment flow for overdue invoice
- Click message icon to open inbox

---

## 6. Parent Portal — Progress View

**User:** Parent/Guardian
**Purpose:** Detailed view of one child's learning progress

### Layout Structure
```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Home                                             │
│                                                            │
│ [👤] Emma Smith (Age 9)                                    │
│ Scratch Basics Level 1 | Werribee Campus                   │
│ Instructor: Mia Chen                                       │
│                                                            │
│ [Tabs: Progress | Attendance | Projects]                   │
│                                                            │
│ ──────── Progress Tab ────────                             │
│                                                            │
│ Skills Mastered: 13 / 20 (65%)                             │
│ ████████████░░░░░░░░                                       │
│                                                            │
│ Skill Tree                                                 │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🟢 Variables                Mastered Feb 10            │ │
│ │   └ Creating variables      ✅                         │ │
│ │   └ Assigning values        ✅                         │ │
│ │                                                        │ │
│ │ 🟡 Loops                     In Progress               │ │
│ │   └ For loops               ✅                         │ │
│ │   └ While loops             ⚪ Not started             │ │
│ │   └ Nested loops            ⚪ Not started             │ │
│ │                                                        │ │
│ │ ⚪ Functions                 Not Started                │ │
│ │   └ Defining functions      ⚪                         │ │
│ │   └ Parameters & arguments  ⚪                         │ │
│ │   └ Return values           ⚪                         │ │
│ │                                                        │ │
│ │ [+ 10 more skills...]                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Instructor Notes                                           │
│ "Emma is doing great with loops! Encourage her to practice│
│  nested loops at home." — Mia Chen, Feb 15                │
└────────────────────────────────────────────────────────────┘
```

### Elements Detail
- **Child Header:** Avatar, name, age, current cohort, instructor
- **Tab Navigation:** Progress (default), Attendance, Projects
- **Overall Progress:** Fraction + percentage, visual progress bar
- **Skill Tree:**
  - Hierarchical list: top-level topics (Variables, Loops, Functions) with sub-skills indented
  - Status icons: 🟢 Mastered, 🟡 In Progress, ⚪ Not Started
  - Mastered date shown next to completed skills
  - Collapsible sections (click topic to expand/collapse sub-skills)
- **Instructor Notes:** Latest note from instructor, with date and instructor name

### Interactions
- Click skill name to see detailed description (modal)
- Click mastered badge to see certificate (V2)
- Switch to "Attendance" tab to see session-by-session history (table: date, status, notes)
- Switch to "Projects" tab to see submitted projects with grades and feedback

---

## 7. Billing & Invoices

**User:** Parent/Guardian
**Purpose:** View all invoices, payment history, and pay outstanding balances

### Layout Structure
```
┌────────────────────────────────────────────────────────────┐
│ Billing & Invoices                                         │
├────────────────────────────────────────────────────────────┤
│ Account Balance: -$450.00                                  │
│ ⚠️ You have 1 overdue invoice                              │
│                                                            │
│ Outstanding Invoices                                       │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ INV-2026-001234 | Emma - Scratch L1 | Due Feb 1        │ │
│ │ Amount: $450.00 | Status: ⚠️ Overdue (16 days)         │ │
│ │ [View Details] [Pay Now]                               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Payment History                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Date     │ Invoice        │ Amount    │ Method   │ Rcpt │ │
│ │ Jan 15   │ INV-2026-001120│ $450.00   │ Visa     │ [📄] │ │
│ │ Dec 10   │ INV-2025-000987│ $425.00   │ Transfer │ [📄] │ │
│ │ [+ 5 more...]                                          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ All Invoices                                               │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Invoice #       │ Issue Date │ Amount  │ Status    │   │ │
│ │ INV-2026-001234 │ Jan 15     │ $450.00 │ Overdue   │   │ │
│ │ INV-2026-001120 │ Dec 1      │ $450.00 │ Paid ✅   │   │ │
│ │ INV-2025-000987 │ Nov 1      │ $425.00 │ Paid ✅   │   │ │
│ │ [+ 12 more...]                                         │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Elements Detail
- **Account Summary:** Current balance (negative = owed), alert for overdue invoices
- **Outstanding Invoices:** Accordion-style cards showing unpaid invoices
  - Invoice number, student/program, due date
  - Amount, status badge (⚠️ Overdue, 🟡 Due Soon, ⚪ Not Due)
  - "View Details" expands card to show line items (tuition, discounts, GST)
  - "Pay Now" button (primary CTA)
- **Payment History:** Table of completed payments with receipt download link
- **All Invoices:** Full invoice history (both paid and unpaid)

### Interactions
- Click "View Details" to expand invoice card and see line-item breakdown
- Click "Pay Now" to open Stripe Checkout modal
- Click receipt icon [📄] to download PDF receipt
- Click invoice number to open full invoice PDF in new tab

---

## 8. Student Profile

**User:** Campus Manager, Lead Instructor, Parent (read-only)
**Purpose:** Comprehensive view of a student's data

### Layout Structure
```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Students                                         │
│                                                            │
│ ┌────────────────┐                                        │
│ │ [👤 Emma Smith]│  Emma Smith                            │
│ │                │  Age 9 (DOB: Jan 15, 2017)             │
│ └────────────────┘  Werribee Campus                       │
│                     Parent: Priya Smith                    │
│                     Email: priya@example.com | 0412345678  │
│                                                            │
│ [Tabs: Overview | Enrolments | Attendance | Progress |    │
│        Projects | Notes | Family]                          │
│                                                            │
│ ──────── Overview Tab ────────                             │
│                                                            │
│ Current Enrolments                                         │
│ • Scratch Basics Level 1 (Active) — Sat 10am, Werribee    │
│                                                            │
│ Quick Stats                                                │
│ • Overall Attendance: 100% (8/8 sessions)                  │
│ • Skills Mastered: 13 / 20 (65%)                           │
│ • Projects Submitted: 3 / 4                                │
│                                                            │
│ Medical Information                                        │
│ • Allergies: None                                          │
│ • Dietary Restrictions: Vegetarian                         │
│                                                            │
│ Emergency Contact                                          │
│ • Raj Smith (Father) — 0498765432                          │
│                                                            │
│ ──────── Other Tabs (not shown) ────────                   │
│ Enrolments: History of all past and current enrolments    │
│ Attendance: Full session-by-session log                    │
│ Progress: Skill tree view (same as parent portal)          │
│ Projects: All submitted projects with grades               │
│ Notes: Private instructor notes (admin/instructor only)    │
│ Family: Parent/guardian details, siblings, account balance │
└────────────────────────────────────────────────────────────┘
```

### Elements Detail
- **Profile Header:** Large avatar, name, age (calculated), DOB, campus, parent contact
- **Tab Navigation:** Overview (default), Enrolments, Attendance, Progress, Projects, Notes, Family
- **Overview Tab Sections:**
  - Current Enrolments: List of active cohorts with schedule
  - Quick Stats: Key metrics (attendance, progress, projects)
  - Medical Info: Allergies, dietary restrictions (editable by parent/admin)
  - Emergency Contact: Name, phone (editable)
- **Action Buttons (top-right, not shown in layout):** Edit Profile, Message Parent, Withdraw Student

### Interactions
- Click "Edit Profile" to open form for updating student details
- Click "Message Parent" to compose message
- Switch tabs to view detailed history (Enrolments, Attendance, etc.)
- Click cohort name in "Current Enrolments" to open cohort page

---

## Notes on Wireframe Style

These wireframes are **low-fidelity** and intentionally minimal to focus on:
- **Information hierarchy:** What's most important on each screen?
- **Layout structure:** Where do elements live?
- **User flows:** How do users navigate between screens?

**Not included in wireframes:**
- Final colors, fonts, or branding
- Detailed error states (these should be documented separately)
- Animations or transitions
- Exact pixel dimensions (these are for developer discretion)

**Next Steps:**
1. Review wireframes with Rocket Academy stakeholders
2. Create high-fidelity mockups with branding
3. Build interactive prototype (Figma or React)
4. Conduct usability testing with parents and instructors
