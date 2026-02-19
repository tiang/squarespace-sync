# Feature List — Rocket Academy Classroom Management Tool

## 1. Enrolment & Registration

- **Public Registration Portal** — Parents can browse available programs, cohorts, and sessions, and submit registration requests online [MVP]
- **Multi-child Registration** — Allow parents to register multiple children in a single session with family-level discount logic [MVP]
- **Enrolment Workflow States** — Track enrolments through states: Enquiry → Trial → Pending Payment → Enrolled → Active → Completed → Dropped [MVP]
- **Waitlist Management** — When cohorts are full, parents can join a waitlist with automatic notification when spots open [V2]
- **Trial Class Booking** — Allow one-time trial class enrolment with conditional conversion to full enrolment [MVP]
- **Prorated Enrolment** — Auto-calculate prorated fees when students join mid-term based on remaining sessions [MVP]
- **Sibling Discounts** — Automatic application of family discounts when multiple children from the same family enrol [MVP]
- **Enrolment Transfers** — Allow students to transfer between cohorts with admin approval and fee adjustments [V2]
- **Drop-in Sessions** — Support single-session bookings for casual attendance without full enrolment [V2]
- **Withdrawal & Refund Rules** — Configurable withdrawal windows with automatic refund calculation [V2]
- **Bulk Enrolment Import** — CSV import for mass enrolment from external sources [Future]
- **Auto-enrolment for Next Term** — Automatically re-enrol active students for the next term with parent confirmation [V2]

## 2. Billing & Payments

- **Family Ledger** — Single account ledger per family showing all charges, payments, credits, and outstanding balance [MVP]
- **Invoice Generation** — Auto-generate invoices on enrolment, with line items for tuition, materials, discounts [MVP]
- **Recurring Billing Schedules** — Support weekly, fortnightly, monthly, or term-based payment schedules [MVP]
- **Online Payment Gateway** — Integrate with Stripe/Square for credit card and bank transfer payments (AUD support) [MVP]
- **Auto-charge on Schedule** — Automatically charge saved payment methods according to billing schedule [V2]
- **Payment Plans** — Allow families to split payments across multiple instalments [V2]
- **Late Payment Fees** — Auto-apply late fees after grace period with configurable rules [V2]
- **Account Credit System** — Track and apply account credits from refunds, discounts, or promotional offers [MVP]
- **Payment Receipt & History** — Auto-email receipts and provide full payment history in parent portal [MVP]
- **Manual Payment Entry** — Admin can manually record cash/cheque payments [MVP]
- **Overdue Invoice Alerts** — Automated reminders to parents for overdue invoices [V2]
- **Tax Invoice Compliance** — Generate Australian GST-compliant tax invoices [MVP]
- **Discount & Promo Codes** — Support percentage or fixed-amount discounts via coupon codes [V2]
- **Family Payment Portal** — Dedicated view for parents to see all invoices, make payments, download receipts [MVP]

## 3. Class & Program Management

- **Multi-campus Support** — Manage multiple physical locations under one account with location-specific class lists [MVP]
- **Program Catalogue** — Define reusable programs (e.g., Scratch Basics, Python Intro) with descriptions, age ranges, skill levels [MVP]
- **Cohort Management** — Create cohorts as instances of programs with start/end dates, capacity, assigned instructors [MVP]
- **Session Scheduling** — Define recurring sessions per cohort with date, time, location, and instructor [MVP]
- **Class Capacity & Enrollment Limits** — Set min/max student numbers per cohort with auto-closing when full [MVP]
- **Instructor Assignment** — Assign lead instructor and TAs to cohorts with conflict detection [MVP]
- **Campus Calendar View** — Visual calendar showing all cohorts, sessions, and instructor schedules across campuses [MVP]
- **Session Cancellation** — Mark sessions as cancelled with auto-notification to enrolled families [MVP]
- **Make-up Session Tokens** — Issue tokens when students miss sessions, redeemable for make-up attendance [V2]
- **Blackout Dates** — Define campus closures (holidays, public holidays) with prorated billing adjustments [MVP]
- **Room/Resource Allocation** — Assign physical rooms or equipment to sessions with conflict detection [V2]
- **Substitute Instructor Management** — Assign substitute instructors when regulars are unavailable [V2]

## 4. Attendance

- **Roll Call Interface** — Instructor mobile view to mark students present, absent, late, or excused for each session [MVP]
- **QR Code Check-in Kiosk** — Touchless check-in via iPad kiosk where students scan QR codes [V2]
- **Attendance Status Codes** — Support Present, Absent, Late, Excused, Makeup statuses [MVP]
- **Partial Attendance** — Mark students who arrive late or leave early [V2]
- **Attendance History** — Full attendance record per student visible to parents and admin [MVP]
- **Attendance Alerts** — Auto-notify parents when child is marked absent [V2]
- **Attendance Percentage Tracking** — Calculate and display attendance rate per student [MVP]
- **Makeup Token Generation** — Auto-issue makeup tokens on excused absences or cancelled sessions [V2]
- **Planned Absences** — Parents can pre-register planned absences via portal [V2]
- **Attendance Reports** — Generate reports by cohort, student, date range, or campus [MVP]
- **Staff Attendance Log** — Track instructor check-in/check-out times [Future]

## 5. Learning Progress & Assessment

- **Coding Skill Framework** — Define hierarchical skill trees by language/topic (Python, Scratch, Web Dev, etc.) [MVP]
- **Skill Milestone Tracking** — Mark student progress through skill levels with visual badges [MVP]
- **Project Submission** — Students submit project links (GitHub, Replit, etc.) for instructor review [MVP]
- **Rubric-based Assessment** — Score submissions using custom rubrics (e.g., functionality, code quality, creativity) [V2]
- **Progress Dashboard** — Student-facing view showing skills mastered, projects completed, next milestones [MVP]
- **Instructor Skill Updates** — Real-time skill progress updates from instructor's mobile device during/after class [MVP]
- **Achievement Certificates** — Auto-generate completion certificates when students finish programs [V2]
- **Skill Progress Reports** — Parent-visible reports on child's learning journey [MVP]
- **Peer Review Module** — Enable students to review each other's projects (moderated) [Future]
- **Portfolio View** — Aggregate all student projects in one shareable portfolio [V2]
- **Learning Notes** — Instructors can add private notes on student progress visible to admin only [MVP]
- **Skill Prerequisites** — Enforce prerequisite skills before advancing to next levels [V2]

## 6. Parent & Family Portal

- **Family Dashboard** — Overview showing all enrolled children, upcoming sessions, invoices, messages [MVP]
- **Child Progress View** — Per-child skill tree, attendance summary, recent projects [MVP]
- **Session Calendar** — View all upcoming sessions across all enrolled children [MVP]
- **Invoice & Payment Management** — View outstanding invoices, payment history, pay online [MVP]
- **Direct Messaging** — Send messages to instructors or campus admin [MVP]
- **Planned Absence Registration** — Submit upcoming absences in advance [V2]
- **Document Upload** — Upload consent forms, medical info, emergency contacts [V2]
- **Notification Preferences** — Configure email/SMS preferences for attendance, billing, announcements [V2]
- **Sibling Management** — View and manage multiple children from single login [MVP]
- **Session Feedback** — Submit post-session feedback or ratings [V2]
- **Referral Program** — Share referral links and track rewards [Future]
- **Mobile App** — Native iOS/Android app for parents [Future]

## 7. Communication & Notifications

- **Email Notifications** — Auto-send transactional emails for enrolment, invoices, attendance alerts, session cancellations [MVP]
- **SMS Notifications** — Send critical alerts via SMS (attendance, payment reminders) [V2]
- **Push Notifications** — In-app push for parent mobile app [Future]
- **Announcement Feed** — Campus-wide or cohort-specific announcements visible in parent portal [MVP]
- **Direct Messaging System** — Threaded conversations between parents, instructors, and admin [MVP]
- **Message Templates** — Pre-built templates for common communications [V2]
- **Notification Log** — Track all sent notifications with delivery status [V2]
- **Bulk Messaging** — Send announcements to all families in a cohort or campus [MVP]
- **Scheduled Messages** — Queue messages to send at specific times [V2]
- **Unsubscribe Management** — Allow parents to opt out of non-critical messages [MVP]

## 8. Staff & Role Management

- **Role-based Access Control** — Define roles: Super Admin, Campus Manager, Lead Instructor, TA, Front Desk [MVP]
- **Staff Directory** — Manage staff profiles with contact info, assigned campuses, qualifications [MVP]
- **Instructor Availability** — Staff set availability windows for scheduling [V2]
- **Permission Matrix** — Granular permissions per role (view, edit, delete for each entity) [MVP]
- **Staff Portal Mobile View** — Mobile-first interface for instructors to take attendance, update skills [MVP]
- **Multi-campus Staff** — Allow staff to work across multiple campuses with separate schedules [V2]
- **Time Clock** — Staff clock in/out with location verification [Future]
- **Staff Performance Reports** — Track instructor metrics (attendance accuracy, response time) [Future]
- **Onboarding Workflows** — Guided setup for new staff members [V2]

## 9. Reporting & Analytics

- **Admin Dashboard** — KPI widgets: active enrolments, revenue, attendance rate, outstanding invoices [MVP]
- **Enrolment Reports** — Track enrolment trends by campus, program, term [MVP]
- **Revenue Reports** — Financial summaries by campus, program, payment method [MVP]
- **Attendance Reports** — Aggregate attendance data by cohort, student, date range [MVP]
- **Student Progress Reports** — Export skill progress data for all students [V2]
- **Retention Analysis** — Track student drop-off rates and re-enrolment [V2]
- **Custom Report Builder** — Allow admins to create ad-hoc reports with filters [Future]
- **Export to CSV/PDF** — Download all reports in standard formats [MVP]
- **Scheduled Reports** — Auto-email reports to stakeholders on a schedule [V2]
- **Real-time Data Sync** — Ensure dashboards reflect live data [MVP]

## 10. Platform & Administration

- **Multi-tenant Architecture** — Each organisation has isolated data with shared infrastructure [MVP]
- **Single Sign-On (SSO)** — Support Google/Microsoft SSO for staff [V2]
- **Two-factor Authentication** — Optional 2FA for all user types [V2]
- **Audit Logs** — Track all admin actions (enrolment changes, payments, data exports) [V2]
- **Data Export** — Export all organisation data in machine-readable format [MVP]
- **Custom Branding** — White-label parent portal with org logo and colors [V2]
- **API Access** — RESTful API for third-party integrations [Future]
- **Mobile Responsive** — All views fully responsive on mobile browsers [MVP]
- **Dark Mode** — Optional dark theme for parent and staff portals [Future]
- **Help Documentation** — In-app help docs and video tutorials [V2]
- **System Health Monitoring** — Uptime tracking and error logging [MVP]
- **Privacy Compliance** — Australian Privacy Act 1988 compliance (data retention, consent, access requests) [MVP]
