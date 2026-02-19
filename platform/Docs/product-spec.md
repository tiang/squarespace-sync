# Product Specification — Rocket Academy Classroom Management Tool

## 1. Product Overview

### Vision Statement
Rocket Academy Classroom Tool is an all-in-one platform that seamlessly manages the entire lifecycle of coding bootcamp operations—from enrolment and billing to learning progress and parent engagement—across multiple campuses. By combining the operational strength of activity management systems with the academic tracking of learning management systems, we empower Rocket Academy staff to focus on teaching while giving parents unprecedented visibility into their child's coding journey.

### Problem Statement

**Current Pain Points:**
1. **Fragmented Systems:** Rocket Academy currently juggles multiple tools—spreadsheets for enrolment, separate payment processing, manual attendance tracking, and ad-hoc progress updates. No single source of truth exists.

2. **Poor Parent Visibility:** Parents lack real-time visibility into their child's learning progress, making it difficult to justify the investment in coding education and leading to increased support inquiries.

3. **Manual Administrative Overhead:** Staff spend excessive time on administrative tasks (chasing payments, manual attendance, reconciling enrolments across campuses) instead of teaching and curriculum development.

4. **No Multi-Campus Intelligence:** With programs across Werribee, Camberwell, Hawthorn, and other Melbourne locations, there's no unified view of enrolments, revenue, or instructor allocation.

5. **Inflexible Billing:** Managing prorated fees, sibling discounts, make-up sessions, and payment plans requires manual spreadsheet work prone to errors.

### Target Users

#### **Super Admin (Operations Director)**
- **Persona:** Sarah, 38, manages all Rocket Academy operations across Melbourne
- **Goals:** Maximise revenue, optimise instructor utilisation, ensure compliance, make data-driven decisions
- **Pain Points:** No consolidated view of business health; spends hours creating reports manually
- **Success Metrics:** Reduce admin time by 40%, increase term-over-term enrolment retention by 15%

#### **Campus Manager (Location Lead)**
- **Persona:** David, 42, runs the Werribee campus
- **Goals:** Keep classes full, parents happy, instructors on schedule; hit campus revenue targets
- **Pain Points:** Can't easily see which cohorts are at risk; chases late payments manually
- **Success Metrics:** Reduce late payments from 30% to <10%; fill 95% of class capacity

#### **Lead Instructor (Educator)**
- **Persona:** Mia, 29, teaches Python and Scratch courses
- **Goals:** Track student learning progress, communicate wins to parents, minimise admin work
- **Pain Points:** No structured way to log skill mastery; attendance is pen-and-paper
- **Success Metrics:** Update student progress in <2 minutes per class; reduce parent "How's my child doing?" inquiries

#### **Parent/Guardian (Customer)**
- **Persona:** Priya, 41, has 2 kids enrolled in Scratch and Python programs
- **Goals:** See child's progress, manage payments easily, know upcoming session times
- **Pain Points:** Receives generic updates; doesn't know if child is improving; unclear invoices
- **Success Metrics:** Check child progress 2x/week; reduce late payments; NPS score >70

#### **Student (End Learner)**
- **Persona:** Ethan, 12, enrolled in Python Fundamentals
- **Goals:** See what skills he's unlocked, share projects, know what's coming next
- **Pain Points:** No visibility into own progress; doesn't feel motivated to level up
- **Success Metrics:** Check progress 1x/week; complete 90% of projects on time

### Success Metrics

| User Type | Metric | Current | Target (6 months post-launch) |
|---|---|---|---|
| **Organisation** | Admin hours/week | 25 | 10 |
| **Organisation** | Term-over-term retention | 68% | 80% |
| **Organisation** | Invoice collection time | 21 days avg | 7 days avg |
| **Campus Manager** | Class fill rate | 78% | 92% |
| **Campus Manager** | Parent satisfaction (NPS) | 52 | 70 |
| **Instructor** | Time to update progress/class | 15 min | 2 min |
| **Instructor** | Parent progress inquiries/week | 8 | 2 |
| **Parent** | Portal login frequency | N/A | 2x/week |
| **Parent** | Invoice dispute rate | 18% | <5% |
| **Student** | Project completion rate | 74% | 85% |

---

## 2. MVP Scope

### In Scope for MVP

**Core Enrolment & Billing:**
- ✅ Family account creation and management
- ✅ Multi-child enrolment under one family account
- ✅ Enrolment workflow (enquiry → pending payment → enrolled → active)
- ✅ Invoice generation (enrolment fees, tuition)
- ✅ Online payment via Stripe (credit card, bank transfer)
- ✅ Manual payment recording (cash, cheque)
- ✅ Family ledger with account balance
- ✅ Sibling discount auto-application
- ✅ Prorated billing for mid-term joins

**Multi-Campus Operations:**
- ✅ Campus management (create, edit campuses)
- ✅ Program catalogue (reusable program templates)
- ✅ Cohort creation and scheduling
- ✅ Session scheduling with recurring dates
- ✅ Instructor assignment to cohorts
- ✅ Campus calendar view

**Attendance & Progress:**
- ✅ Mobile-first instructor roll call (present/absent/late/excused)
- ✅ Attendance history per student
- ✅ Coding skill framework (hierarchical skill trees)
- ✅ Instructor-driven skill progress updates
- ✅ Project submission by students (URL-based)
- ✅ Student progress dashboard (parent-facing)

**Communication:**
- ✅ Direct messaging (parent ↔ instructor, parent ↔ admin)
- ✅ Email notifications for key events (enrolment confirmed, invoice due, attendance alert)
- ✅ Announcement feed (campus or cohort-specific)

**Reporting:**
- ✅ Admin dashboard (KPIs: active enrolments, revenue, attendance rate)
- ✅ Enrolment reports (by campus, program)
- ✅ Financial summary (revenue, outstanding invoices)
- ✅ Export to CSV

**User Management:**
- ✅ Role-based access control (Super Admin, Campus Manager, Lead Instructor, TA, Parent, Student)
- ✅ Staff directory
- ✅ Parent portal with family dashboard
- ✅ Student portal (optional independent login)

### Out of Scope for MVP (V2 or Later)

- ❌ Waitlist management and auto-notifications
- ❌ QR code check-in kiosk
- ❌ SMS notifications (email only in MVP)
- ❌ Recurring auto-charge (manual payment each term in MVP)
- ❌ Payment plans (single payment only in MVP)
- ❌ Makeup session tokens
- ❌ Rubric-based grading (simple pass/fail in MVP)
- ❌ Achievement certificates
- ❌ Referral program
- ❌ Mobile native app (mobile-responsive web only in MVP)
- ❌ API for third-party integrations
- ❌ Custom report builder
- ❌ SSO (Google/Microsoft login)

### Rationale for MVP Scope
The MVP focuses on solving the three highest-pain workflows:
1. **Enrolment & Billing** — eliminates spreadsheets and manual reconciliation
2. **Attendance & Progress** — gives instructors a fast mobile interface and parents real-time visibility
3. **Multi-campus View** — provides organisation-level intelligence missing today

Features excluded from MVP either require significant technical complexity (auto-charge, kiosk) or serve "nice-to-have" use cases that don't block core operations (referrals, advanced reporting).

---

## 3. Detailed Feature Specifications

### Feature 1: Family & Student Registration / Enrolment Flow

**User Story:**
As a parent, I want to register my children for coding programs online so that I can browse available cohorts, compare schedules, and secure spots without needing to call or visit the campus.

**Acceptance Criteria:**
- [ ] Parent can create a family account with primary contact details (name, email, phone, address)
- [ ] Parent can add multiple children under the family account (first name, last name, DOB, medical info)
- [ ] Parent can browse available programs filtered by campus, age range, and skill level
- [ ] Parent can see cohort details: start date, end date, session times, instructor, price, remaining capacity
- [ ] Parent can select a cohort and initiate enrolment
- [ ] System checks if student age is within program's age_min/age_max range
- [ ] Enrolment is created with status "pending_payment"
- [ ] Parent is redirected to invoice payment page
- [ ] Upon successful payment, enrolment status updates to "enrolled"
- [ ] Parent receives confirmation email with invoice, cohort details, and next steps
- [ ] Admin receives notification of new enrolment for approval (if required)

**Edge Cases:**
- **Student age outside range:** Display warning "This program is for ages 8-12, but [Student] is 13. Continue anyway?" with override option
- **Cohort at capacity:** Show "Waitlist" button instead of "Enrol" (waitlist feature is V2; for MVP, show "Full" and disable enrolment)
- **Duplicate enrolment:** If student is already enrolled in the same cohort, show error "Already enrolled in this cohort"
- **Incomplete family profile:** If emergency contact is missing, prompt to complete before enrolment
- **Payment failure:** If Stripe payment fails, keep enrolment in "pending_payment" state and show payment retry option

**Out of Scope for MVP:**
- Trial class booking (V2)
- Sibling enrolment in a single checkout (MVP: enrol one child at a time)
- Promo codes (V2)

---

### Feature 2: Cohort & Class Management

**User Story:**
As a campus manager, I want to create and schedule cohorts so that I can offer multiple programs across different times, assign instructors, and ensure classes don't overlap.

**Acceptance Criteria:**
- [ ] Campus manager can create a cohort from a program template
- [ ] System auto-populates cohort with program defaults (duration, session length, price) but allows overrides
- [ ] Manager sets cohort-specific: name, start date, max capacity, instructor, room
- [ ] System generates recurring sessions based on cohort schedule (e.g., "Every Saturday 10am-12pm for 12 weeks")
- [ ] Manager can manually edit or cancel individual sessions
- [ ] System validates instructor isn't double-booked (assigned to another cohort at overlapping time)
- [ ] Manager can mark cohort as "open" (visible to parents), "full", or "in_progress"
- [ ] System auto-transitions cohort from "enrolled" to "active" on start_date, and "active" to "completed" on end_date
- [ ] Manager can view all cohorts in campus calendar (week view, color-coded by program)

**Edge Cases:**
- **Instructor conflict:** If instructor is already assigned to another cohort at the same time, show error "Instructor unavailable. Choose a different time or instructor."
- **Blackout dates:** If campus is closed on public holiday, system skips that session and extends end date by 1 week (blackout management is V2; MVP: admin manually adjusts dates)
- **Zero enrolments:** If cohort reaches start_date with 0 enrolments, system flags for cancellation but doesn't auto-cancel
- **Mid-term edits:** Changing instructor or time after cohort is "active" triggers notification to all enrolled families

**Out of Scope for MVP:**
- Room conflict detection (V2)
- Substitute instructor management (V2)
- Bulk cohort creation (e.g., "Create 4 identical cohorts across different campuses")

---

### Feature 3: Attendance Marking

**User Story:**
As a lead instructor, I want to take attendance on my mobile phone so that I can quickly mark students present, absent, or late during or after class without paperwork.

**Acceptance Criteria:**
- [ ] Instructor logs in to mobile-optimised portal on session day
- [ ] Dashboard shows "Today's Sessions" list with upcoming and in-progress sessions
- [ ] Instructor taps a session to open roll call screen
- [ ] Roll call displays all enrolled students in that cohort, sorted alphabetically
- [ ] Each student has buttons: ✅ Present, ❌ Absent, ⏰ Late, 🔔 Excused
- [ ] Instructor can tap a button to mark status; status is saved immediately (no submit button)
- [ ] Default status is "Absent" if not marked
- [ ] Instructor can add notes to individual students (e.g., "Left early - doctor appointment")
- [ ] System timestamps when attendance was recorded and by which staff member
- [ ] Once marked, instructor can edit attendance for up to 24 hours after session end
- [ ] Parents receive email notification if child is marked "Absent" (sent 1 hour after session end)

**Edge Cases:**
- **Student arrives late:** Instructor marks "Present" initially, then changes to "Late" and adds note "Arrived 15 mins late"
- **Makeup student attending:** If student is using a makeup token to attend a different cohort's session, they appear in that session's roll call with a "Makeup" badge
- **Session cancelled:** If session is cancelled, attendance screen shows "Session Cancelled" and prevents marking
- **No internet connection:** App caches marks locally and syncs when connection restored (requires offline-first architecture; V2 feature)

**Out of Scope for MVP:**
- QR code kiosk check-in (V2)
- Partial attendance (arrived at 10:30am for a 10am-12pm session)
- Makeup token auto-generation on excused absence (V2)

---

### Feature 4: Progress Tracking & Skill Assessment

**User Story:**
As a lead instructor, I want to update each student's skill progress so that parents can see what their child has learned and I can track readiness for the next program level.

**Acceptance Criteria:**
- [ ] Each program has an associated skill tree (e.g., "Python Fundamentals" skill tree)
- [ ] Skill tree is hierarchical: top-level topics (Variables, Loops, Functions) contain sub-skills (For loops, While loops)
- [ ] Instructor opens a student's progress view from the cohort roster
- [ ] Progress view shows the skill tree with each skill marked: "Not Started", "In Progress", or "Mastered"
- [ ] Instructor can tap a skill to update status and add notes (e.g., "Struggled with nested loops, needs review")
- [ ] When a skill is marked "Mastered", system timestamps it and shows a badge icon
- [ ] Student's progress view (parent-facing) displays all skills in a visual tree with colored badges (grey = not started, yellow = in progress, green = mastered)
- [ ] Parent can tap a skill to see instructor notes (if not marked as private)

**Edge Cases:**
- **Regressing a skill:** If instructor changes a skill from "Mastered" to "In Progress", system logs the change in skill history (visible to admin only)
- **Prerequisite skills:** MVP doesn't enforce prerequisites; instructor can mark any skill regardless of order (V2: prerequisite logic)
- **Skill tree changes mid-term:** If admin edits the skill tree (adds/removes skills), existing student progress is preserved and new skills appear as "Not Started"

**Out of Scope for MVP:**
- Auto-suggest next skills based on progress (V2)
- Skill-based cohort recommendations (e.g., "Your child is ready for Python Intermediate")
- Peer comparison (V2)

---

### Feature 5: Parent Portal

**User Story:**
As a parent, I want a dashboard where I can see all my children's upcoming sessions, learning progress, and invoices so that I don't need to email the campus for updates.

**Acceptance Criteria:**
- [ ] Parent logs in with family account email/password
- [ ] Dashboard shows tiles for each enrolled child with photo (if uploaded), name, current cohort(s)
- [ ] Each child tile shows: next session date/time, attendance % this term, recent skill badges earned
- [ ] Sidebar shows: upcoming sessions (calendar view), unpaid invoices (amount + due date), unread messages (count)
- [ ] Parent clicks a child to open detailed progress view
- [ ] Progress view shows: skill tree with mastery status, attendance history (table: date, status, notes), list of submitted projects with grades
- [ ] Parent can click "View Invoice" to see line-item breakdown and "Pay Now" button
- [ ] Parent can click "Message Instructor" to open a new message thread
- [ ] Parent can update family contact details and student emergency info

**Edge Cases:**
- **Child with no enrolments:** If a student has no active enrolments, tile shows "No active enrolments. Browse programs >"
- **Multiple cohorts:** If student is enrolled in 2 cohorts (e.g., Scratch and Python), both appear in the child tile and progress view tabs
- **Sibling view:** Parent with 3 kids can toggle between children without logging out
- **Archived data:** After cohort is "completed", student progress remains visible but marked as "Past Enrolment"

**Out of Scope for MVP:**
- Mobile app (V2; MVP is mobile-responsive web)
- Push notifications (V2)
- Planned absence registration (V2)
- Document upload (consent forms, medical) (V2)

---

### Feature 6: Billing & Invoice Management

**User Story:**
As a parent, I want to see a clear breakdown of all charges and payments so that I know what I owe and can pay online.

**Acceptance Criteria:**
- [ ] When a student is enrolled, system auto-generates an invoice with:
  - Line item: "[Program Name] - Term [X]" with quantity 1 and price
  - Line item: Sibling discount (if applicable) as negative amount
  - Subtotal, GST (10%), Total Due
- [ ] Invoice has a unique number (e.g., INV-2026-001234), issue date, due date (14 days from issue)
- [ ] Invoice status starts as "sent"; transitions to "paid" when full amount received
- [ ] Parent can view invoice in portal and download as PDF
- [ ] Parent can click "Pay Now" to open Stripe Checkout with pre-filled amount
- [ ] Upon successful payment, invoice updates to "paid" and parent receives emailed receipt
- [ ] System logs payment with: date, amount, method (credit card / bank transfer), reference number
- [ ] Family ledger shows all invoices and payments in chronological order with running balance
- [ ] If invoice is unpaid 7 days after due date, status changes to "overdue" and parent receives reminder email

**Edge Cases:**
- **Partial payment:** If parent pays $200 on a $500 invoice, invoice status becomes "partial" and amount_outstanding updates to $300 (full partial payment support is V2; MVP: allow one-off partial manual recording by admin)
- **Refund:** If enrolment is cancelled before start date, admin can issue a refund which creates a negative invoice line item and updates family balance
- **Prorated enrolment:** If student joins in Week 4 of a 12-week program, system calculates: (remaining weeks / total weeks) * tuition_price
- **Sibling discount:** If 2 siblings are enrolled in same cohort, system applies 10% discount to the 2nd child's invoice automatically

**Out of Scope for MVP:**
- Recurring auto-charge (V2)
- Payment plans (split into instalments) (V2)
- Late fees (V2)
- Promo codes (V2)

---

### Feature 7: Online Payment

**User Story:**
As a parent, I want to pay invoices online with my credit card or bank transfer so that I don't need to visit the campus in person.

**Acceptance Criteria:**
- [ ] Parent clicks "Pay Now" on an unpaid invoice
- [ ] System redirects to Stripe Checkout with pre-filled: amount, invoice description, family email
- [ ] Stripe Checkout supports credit card and direct debit (Australian bank accounts)
- [ ] Upon successful payment, Stripe webhook notifies system
- [ ] System creates a Payment record linked to the invoice
- [ ] Invoice status updates to "paid"
- [ ] Family account balance decrements by payment amount
- [ ] Parent is redirected back to portal with success message: "Payment received. Receipt emailed to [email]."
- [ ] Parent receives automated receipt email with payment details and updated invoice PDF

**Edge Cases:**
- **Payment failure:** Stripe returns error (e.g., card declined); parent sees error message "Payment failed: [reason]. Please try a different card." Invoice remains "sent"
- **Duplicate payment attempt:** If parent clicks "Pay Now" twice, Stripe's idempotency prevents duplicate charge
- **Refund:** If admin processes a refund via Stripe dashboard, webhook updates Payment record and family balance accordingly

**Out of Scope for MVP:**
- Saved payment methods (one-time payment only in MVP; save for V2)
- Split payment across multiple cards (V2)
- Offline payment methods (cash, cheque) are recorded manually by admin in the payment log

---

### Feature 8: Notifications & Messaging System

**User Story:**
As a parent, I want to receive notifications about important events (enrolment confirmed, invoice due, my child was absent) so that I stay informed without constantly checking the portal.

**Acceptance Criteria:**
- [ ] System sends automated emails for these events:
  - Enrolment confirmed (upon payment)
  - Invoice generated (with PDF attachment)
  - Invoice overdue (7 days after due date)
  - Student marked absent (1 hour after session end)
  - Session cancelled (immediate)
  - New message from instructor or admin
- [ ] Emails are sent from noreply@rocketacademy.com.au with reply-to set to campus contact email
- [ ] Parent can configure notification preferences: toggle each notification type on/off
- [ ] Messaging: parent can send message to instructor or campus manager from portal
- [ ] Messages are threaded (like email); all replies appear in same thread
- [ ] Instructor receives email when new message arrives: "You have a new message from [Parent]. Reply in your portal."
- [ ] Unread message count appears in portal sidebar

**Edge Cases:**
- **Email bounce:** If parent's email is invalid, system marks family with "Email Undeliverable" flag; admin must contact via phone
- **Unsubscribe:** Parent can unsubscribe from non-critical notifications (e.g., invoice reminders) but cannot unsubscribe from critical ones (e.g., session cancellation)
- **Bulk announcements:** Campus manager can send an announcement to all families in a cohort or campus; sent as individual emails (not BCC) to preserve privacy

**Out of Scope for MVP:**
- SMS notifications (V2)
- Push notifications (V2)
- Scheduled messages (V2)

---

### Feature 9: Reporting Dashboard (Admin-Level)

**User Story:**
As a super admin, I want a dashboard showing organisation-wide KPIs so that I can monitor business health and make data-driven decisions.

**Acceptance Criteria:**
- [ ] Dashboard displays KPI widgets:
  - **Active Enrolments:** Count of students with enrolment status "active" across all campuses
  - **Revenue (This Term):** Sum of all paid invoices issued this term
  - **Outstanding Invoices:** Sum of all unpaid/partial invoices
  - **Attendance Rate (This Week):** Percentage of students marked "Present" across all sessions this week
  - **New Enrolments (This Month):** Count of enrolments created this month
- [ ] Each widget shows: current value, trend arrow (up/down vs last period), and percentage change
- [ ] Super admin can filter dashboard by campus, date range, or program
- [ ] Dashboard includes quick links to detailed reports:
  - Enrolment report (table: student, cohort, status, enrolment date) exportable to CSV
  - Revenue report (table: invoice number, family, amount, status, paid date) exportable to CSV
  - Attendance report (table: session, student, status, notes) exportable to CSV

**Edge Cases:**
- **No data:** If organisation is new with no enrolments, widgets show "0" and message "No data yet. Create your first cohort to get started."
- **Multi-campus comparison:** Super admin can toggle to "Campus Comparison" view showing KPIs side-by-side for all campuses

**Out of Scope for MVP:**
- Custom report builder (V2)
- Automated email reports (V2)
- Advanced analytics (retention cohort analysis, revenue forecasting) (V2)

---

### Feature 10: Multi-Campus Management

**User Story:**
As a super admin, I want to manage multiple campuses under one account so that I can see organisation-wide operations and share resources (programs, instructors) across locations.

**Acceptance Criteria:**
- [ ] Super admin can create campuses with: name, address, contact email, contact phone, timezone
- [ ] Each cohort is linked to exactly one campus
- [ ] Campus managers can only see cohorts, enrolments, and finances for their assigned campus(es)
- [ ] Super admin can assign staff to multiple campuses (e.g., an instructor teaches at both Werribee and Camberwell)
- [ ] Programs are organisation-wide (shared across all campuses); cohorts are campus-specific
- [ ] Family and student records are organisation-wide (one family can have children enrolled at different campuses)
- [ ] Calendar view allows super admin to toggle between "All Campuses" and individual campus views

**Edge Cases:**
- **Staff cross-campus scheduling:** If instructor is assigned to cohorts at 2 campuses with overlapping times, system shows conflict warning
- **Family moving campuses:** If parent wants to transfer child from Werribee to Camberwell cohort, admin marks original enrolment as "transferred" and creates new enrolment (V2: transfer wizard)
- **Campus deactivation:** If campus is closed, super admin marks it "inactive"; existing enrolments remain visible but cohort creation is blocked

**Out of Scope for MVP:**
- Campus-specific branding (logo, colors) (V2)
- Resource sharing (e.g., shared instructor pool, shared equipment) (V2)
- Inter-campus billing (if family owes at one campus, shouldn't block enrolment at another) — out of scope; billing is family-level

---

## 4. Non-Functional Requirements

### Performance Targets
- **Page Load Time:** <2 seconds for all portal pages (P95)
- **API Response Time:** <500ms for standard requests (P95)
- **Concurrent Users:** Support 50 simultaneous users without degradation
- **Database Queries:** No N+1 queries; all list views must use joins or eager loading
- **Mobile Performance:** Portal loads in <3 seconds on 4G connection

### Security Requirements
- **Authentication:** Password-based login with bcrypt hashing (min 12 rounds)
- **Session Management:** Secure, httpOnly cookies with 24-hour expiry
- **HTTPS:** All traffic over TLS 1.3
- **CSRF Protection:** CSRF tokens on all state-changing requests
- **SQL Injection Prevention:** Use parameterized queries only (ORM or prepared statements)
- **XSS Prevention:** Sanitize all user input; escape output in templates
- **Rate Limiting:** Max 100 requests/minute per IP for public endpoints; 500/min for authenticated users
- **Data Encryption:** Sensitive fields (payment details) encrypted at rest using AES-256
- **Audit Logging:** Log all admin actions (enrolment changes, payments, data exports) with timestamp and staff_id

### Accessibility
- **WCAG 2.1 Level AA:** Minimum compliance target
- **Keyboard Navigation:** All interactive elements reachable via keyboard (tab order, focus indicators)
- **Screen Reader Support:** Semantic HTML, ARIA labels on custom components
- **Color Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Form Validation:** Clear, accessible error messages linked to form fields

### Mobile Responsiveness
- **Breakpoints:** Desktop (>1024px), Tablet (768-1023px), Mobile (<767px)
- **Touch Targets:** Minimum 44x44px for all buttons and links on mobile
- **Viewport:** Uses responsive meta tag; no horizontal scroll on mobile
- **Instructor Portal:** Mobile-first design optimised for roll call on phone

### Data Retention and Privacy (Australian Privacy Act 1988)
- **Consent:** Parents provide explicit consent to collect and store student data during registration
- **Data Minimisation:** Only collect data necessary for service delivery
- **Retention Period:** Retain student/family data for 7 years after last enrolment (Australian legal requirement for minors)
- **Right to Access:** Parents can request export of their family data (download as JSON via portal)
- **Right to Deletion:** Parents can request account deletion; system marks family as "archived" and anonymizes data after retention period
- **Data Breach Notification:** If breach affects >500 records, notify OAIC within 72 hours and affected families within 7 days
- **Third-Party Sharing:** No student data shared with third parties except payment processor (Stripe) under DPA
- **Cross-Border Transfer:** Data stored in Australian AWS region (ap-southeast-2 Sydney); no overseas transfer

---

## 5. Open Questions & Decisions Required

### 1. **Enrolment Approval Workflow**
**Question:** Should all enrolments be auto-approved upon payment, or should campus managers manually review each one?

**Options:**
- **Auto-approve:** Parent pays → enrolment status = "enrolled" immediately. Faster for parents; less control for staff.
- **Manual review:** Parent pays → enrolment status = "pending_payment" → manager reviews and approves → status = "enrolled". Allows screening for fit (age, behavior history) but adds admin overhead.
- **Hybrid:** Auto-approve for returning families; manual for new families.

**Tradeoff:** Auto-approve maximises conversion but risks enrolling students in wrong cohorts (e.g., age mismatch). Manual review adds friction.

**Recommendation Needed:** Pilot with auto-approve; add manager override if needed in V2.

---

### 2. **Payment Gateway: Stripe vs. Square**
**Question:** Which payment gateway should we integrate for online payments?

**Options:**
- **Stripe:** 1.75% + $0.30 per transaction (Australian cards); strong API; supports direct debit (via BECS)
- **Square:** 1.9% + $0.30 per transaction; integrated POS terminal; simpler setup

**Tradeoff:** Stripe has better developer experience and lower fees but requires more technical setup. Square is easier for non-technical staff but slightly higher fees.

**Recommendation Needed:** Confirm if Rocket Academy needs in-person POS (if yes, Square); if online-only, Stripe.

---

### 3. **Sibling Discount Logic**
**Question:** How should sibling discounts be calculated?

**Options:**
- **Flat percentage:** 10% off for 2nd child, 15% off for 3rd+ child (regardless of program)
- **Absolute dollar amount:** $50 off per additional child
- **Conditional:** Discount only applies if siblings are enrolled in same term

**Tradeoff:** Percentage is simple but can lead to large discounts for expensive programs. Absolute amount is predictable but may feel unfair across different price points.

**Recommendation Needed:** Validate with Rocket Academy's current pricing strategy.

---

### 4. **Attendance Grace Period**
**Question:** How long should instructors have to mark attendance after a session ends?

**Options:**
- **24 hours:** Flexible for instructors but delays parent notifications
- **2 hours:** Forces timely marking; parents get faster updates
- **End of session + 30 mins:** Tight deadline; requires marking during/immediately after class

**Tradeoff:** Longer grace periods reduce instructor stress but delay parent alerts. Shorter windows improve parent experience but may lead to missed markings.

**Recommendation Needed:** Test with instructors in pilot; adjust based on feedback.

---

### 5. **Student Portal: Required or Optional?**
**Question:** Should students have their own login, or should all progress be viewed via parent account?

**Options:**
- **Required:** Every student gets a login; can submit projects and view progress independently
- **Optional:** Parent creates student login only if desired; useful for older students (12+)
- **Parent-only:** No student login; everything accessed via parent account

**Tradeoff:** Separate student logins foster independence and engagement (especially for teens) but add complexity (password resets, support). Parent-only is simpler but may reduce student ownership.

**Recommendation Needed:** Make optional in MVP; test adoption rate.

---

### 6. **Refund Policy Implementation**
**Question:** How should refunds be handled for early withdrawals?

**Options:**
- **Pro-rata refund:** If student withdraws after 3 of 12 sessions, refund 9/12 of tuition (minus admin fee)
- **No refunds after start date:** Full refund only if withdrawn before cohort start_date
- **Manager discretion:** No automatic refunds; campus manager reviews each case

**Tradeoff:** Pro-rata is fairest to parents but complicates accounting. No refunds is simplest but may hurt retention and reputation.

**Recommendation Needed:** Define clear policy before launch to set parent expectations.

---

### 7. **Instructor Compensation Tracking**
**Question:** Should the system track instructor hours and wages for payroll?

**Options:**
- **In-system time clock:** Instructors clock in/out via portal; system calculates hours
- **External:** Use separate payroll system; classroom tool only tracks scheduled hours
- **No tracking:** Admin manually reconciles instructor pay outside the system

**Tradeoff:** In-system tracking reduces manual work but increases scope. External integration is feasible but requires API or export.

**Recommendation Needed:** Out of scope for MVP; revisit in V2 if admin requests it.

---

### 8. **Data Export Frequency**
**Question:** How often should super admins be able to export data (for backup or external analysis)?

**Options:**
- **On-demand:** Admin clicks "Export All Data" button; generates CSV anytime
- **Scheduled:** System auto-exports to S3/Dropbox weekly
- **Both:** On-demand + optional scheduled exports

**Tradeoff:** On-demand is simple but requires admin action. Scheduled is hands-off but may export stale data.

**Recommendation Needed:** On-demand in MVP; scheduled in V2 if requested.

---

### 9. **Make-up Session Allocation**
**Question:** When a student misses a session, how should they be offered a make-up?

**Options:**
- **Token-based:** System issues a "makeup token" which parent can redeem for any available session across all cohorts
- **Fixed make-up dates:** Campus schedules specific make-up sessions (e.g., "Saturday Make-up Lab") where all makeup students attend
- **Instructor discretion:** Instructor manually invites student to attend another cohort's session

**Tradeoff:** Tokens are flexible but complex (need booking system). Fixed dates are simple but inflexible for parents. Discretion relies on instructor memory.

**Recommendation Needed:** Out of scope for MVP; gather parent feedback on preference in V2.

---

### 10. **Privacy: Student Photos in Portal**
**Question:** Should student photos be displayed in instructor/parent portals for easy identification?

**Options:**
- **Optional upload:** Parent can upload photo; if none, show placeholder
- **Required upload:** Mandatory during registration (helps instructors learn names)
- **No photos:** Privacy-first approach; no photos stored

**Tradeoff:** Photos improve UX (especially for instructors with large cohorts) but raise privacy concerns (photo consent, secure storage). No photos is safest but reduces personalization.

**Recommendation Needed:** Make optional with explicit consent checkbox during registration.
