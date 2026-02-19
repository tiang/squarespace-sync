# Technical Architecture — Rocket Academy Classroom Management Tool

## 1. Architecture Overview

### System Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet / CDN                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼──────────┐          ┌──────────▼────────────┐
│  React Web App     │          │   Mobile Browser      │
│  (Admin/Staff)     │          │   (Parent/Student)    │
└─────────┬──────────┘          └──────────┬────────────┘
          │                                 │
          └────────────────┬────────────────┘
                           │
                  ┌────────▼────────┐
                  │   Load Balancer │
                  │   (ALB / Nginx) │
                  └────────┬────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼──────────┐          ┌──────────▼────────────┐
│  API Server 1      │          │  API Server 2         │
│  (Node.js/Express) │          │  (Node.js/Express)    │
└─────────┬──────────┘          └──────────┬────────────┘
          │                                 │
          └────────────────┬────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼──────────┐          ┌──────────▼────────────┐
│  PostgreSQL        │          │   Redis Cache         │
│  (Primary DB)      │          │   (Sessions/Queue)    │
└────────────────────┘          └───────────────────────┘
                                            │
          ┌─────────────────────────────────┼─────────────┐
          │                                 │             │
┌─────────▼──────────┐  ┌──────────▼────┐ ┌▼────────────▼────┐
│  S3 Storage        │  │  Stripe API   │ │  Background Jobs  │
│  (Files/Photos)    │  │  (Payments)   │ │  (Bull/BullMQ)    │
└────────────────────┘  └───────────────┘ └───────────────────┘
          │
┌─────────▼──────────┐
│  SendGrid / SES    │
│  (Email)           │
└────────────────────┘
┌────────────────────┐
│  Twilio (SMS)      │
│  (V2)              │
└────────────────────┘
```

### Architecture Pattern

**Chosen Pattern:** **Modular Monolith** (Single codebase, multiple logical modules, deployed as one unit)

**Rationale:**
- **Team Size:** Small team (3-5 developers) doesn't justify microservices complexity
- **Deployment Simplicity:** Single deployment unit reduces operational overhead
- **Shared Transactions:** Billing, enrolment, and invoicing need ACID transactions across entities
- **Performance:** No network overhead between services; faster than inter-service calls
- **Future-Proof:** Modules can be extracted to microservices later if scale demands (e.g., payment module → payment service)

**SaaS Model:** Multi-tenant single database with row-level security (organisation_id scoping)

---

## 2. Tech Stack Recommendation

### Frontend Framework

**Primary Recommendation: React 18+ with Vite**
- **Pros:** Large talent pool in Melbourne, excellent ecosystem (React Router, React Query, TanStack Table), fast dev server (Vite), mature tooling
- **Cons:** Requires state management decisions (Context vs Zustand vs Redux)
- **Justification:** React is the safe choice for team velocity and hiring. Vite offers faster builds than Create React App.

**Alternative: Next.js 14 (App Router)**
- **Pros:** Server-side rendering (SSR) for better SEO (if needed), built-in API routes, file-based routing
- **Cons:** Overkill for internal admin tool; adds hosting complexity (requires Node server, not static hosting)
- **When to Use:** If public marketing site + app are in one codebase, or if SEO is critical for parent portal

**State Management:** React Query (server state) + Zustand (client state)
**UI Library:** Tailwind CSS + shadcn/ui (pre-built accessible components)
**Forms:** React Hook Form + Zod (validation)

---

### Backend / API

**Primary Recommendation: Node.js 20 LTS + Express.js**
- **Pros:** Matches frontend stack (JavaScript everywhere), vast package ecosystem, non-blocking I/O good for APIs, easy to hire developers
- **Cons:** Callback hell if not using async/await; weaker typing than TypeScript
- **Justification:** Shared language with frontend team. Fast prototyping. Excellent Stripe SDK.

**TypeScript Migration Path:** Start with JavaScript, migrate to TypeScript incrementally (add types to new modules first)

**Alternative: Python (FastAPI)**
- **Pros:** Excellent for data-heavy reports (pandas), strong typing with Pydantic, async support
- **Cons:** Split stack (JS frontend, Python backend) increases hiring complexity; slower ecosystem for payments
- **When to Use:** If team has Python expertise or heavy data science needs (advanced analytics)

**API Design:** RESTful JSON API with versioning (`/api/v1/...`)
**Validation:** Joi (Node) or Zod (if using TypeScript)
**ORM:** Prisma (type-safe, great migrations) or Sequelize (more mature, broader adoption)

---

### Database

**Primary: PostgreSQL 15+**
- **Pros:** ACID compliance (critical for billing), JSON support (JSONB for flexible fields), excellent performance for <100k rows, mature ecosystem, free tier on AWS RDS
- **Cons:** Slightly more complex than MySQL; requires understanding of indexes/query optimization
- **Justification:** Best fit for relational data with some flexible schema (JSONB). Strong ACID guarantees for financial transactions.

**Hosting:** AWS RDS PostgreSQL (Multi-AZ for production, single instance for staging)

**Secondary Stores:**
- **Redis 7+** (Sessions, background job queue, rate limiting)
  - Pros: In-memory speed, pub/sub for real-time features (V2), simple key-value for caching
  - Hosting: AWS ElastiCache or Redis Cloud

**Alternative: MySQL 8**
- Slightly simpler than PostgreSQL, more familiar to some teams, but JSON support is inferior

---

### Authentication

**Primary Recommendation: Passport.js (Node) with JWT**
- **Pros:** Flexible strategies (local, OAuth in V2), widely used, good docs
- **Cons:** Requires manual session management and CSRF protection
- **Flow:**
  1. User logs in with email/password
  2. Server validates, generates JWT (signed with secret), stores session_id in Redis
  3. JWT sent to client in httpOnly cookie
  4. Client includes cookie on all API requests
  5. Server verifies JWT signature and checks session in Redis
- **Token Expiry:** 24 hours; refresh tokens in V2

**Alternative: Auth0 / Clerk**
- **Pros:** Managed service, handles MFA, SSO, password resets out of the box
- **Cons:** $$$; vendor lock-in; overkill for MVP
- **When to Use:** If SSO (Google/Microsoft login) is MVP requirement (currently V2)

**Password Hashing:** bcrypt (12 rounds minimum)
**RBAC:** Middleware checks user.role against route permissions (defined in permission matrix)

---

### File / Media Storage

**Primary Recommendation: AWS S3**
- **Pros:** Unlimited storage, 99.999999999% durability, cheap (~$0.023/GB/month), integrates with CloudFront CDN
- **Cons:** Public URLs require signed URLs or bucket policies
- **Use Cases:** Student photos, project attachments (if file-based), invoice PDFs, backup exports
- **File Upload Flow:**
  1. Client requests presigned S3 URL from API
  2. Client uploads directly to S3 (bypasses server)
  3. Client notifies server of upload completion
  4. Server stores S3 key in DB

**Alternative: Cloudinary**
- **Pros:** Built-in image transformations (resize, crop), auto-format, CDN included
- **Cons:** More expensive than raw S3; slight vendor lock-in
- **When to Use:** If student photos need heavy manipulation (thumbnails, profile crops)

---

### Email / SMS / Push Notifications

**Email: SendGrid (Primary) or AWS SES (Alternative)**
- **SendGrid:**
  - Pros: 100 free emails/day (sufficient for MVP), good templates, analytics (open rates, clicks)
  - Cons: Paid tier needed beyond 100/day (~$20/month for 40k emails)
  - Australian Support: Yes, SMTP globally available
- **AWS SES:**
  - Pros: Extremely cheap ($0.10 per 1000 emails), integrates with AWS ecosystem
  - Cons: Requires more setup (domain verification, bounce handling), no built-in templates
- **Recommendation:** Start with SendGrid for ease; migrate to SES if volume grows

**SMS: Twilio (V2 Feature)**
- **Pros:** Strong Australian support, reliable delivery, good API
- **Cons:** ~$0.08 AUD per SMS (adds up for 1000s of students)
- **Recommendation:** Email-only for MVP; add SMS for critical alerts (session cancellation, overdue invoices) in V2

**Push Notifications (V2):** OneSignal or Firebase Cloud Messaging (FCM)

---

### Payment Processing

**Primary Recommendation: Stripe**
- **Pros:**
  - Strong Australian support (AUD currency, BECS Direct Debit for bank transfers)
  - Excellent developer experience (webhooks, SDKs, test mode)
  - PCI compliance handled by Stripe
  - Transparent pricing: 1.75% + $0.30 per successful card charge (AU cards)
  - Support for subscriptions (recurring billing in V2)
- **Cons:** Slightly higher fees than Square (1.9%)
- **Integration:**
  - Use Stripe Checkout (hosted payment page) for MVP
  - Migrate to Stripe Elements (embedded form) in V2 for custom UX
  - Webhook handler at `/api/webhooks/stripe` to process payment confirmations

**Alternative: Square**
- **Pros:** Integrated POS terminal for in-person payments, slightly simpler setup
- **Cons:** Higher fees (1.9% + $0.30), less flexible API
- **When to Use:** If Rocket Academy needs in-person POS at campus reception

**Payment Flow:**
1. Parent clicks "Pay Now" on invoice
2. API creates Stripe Checkout session with invoice amount, metadata
3. Redirect parent to Stripe Checkout hosted page
4. Parent completes payment
5. Stripe sends webhook `checkout.session.completed`
6. API webhook handler creates Payment record, updates Invoice status, sends receipt email

---

### Hosting / Infrastructure

**Primary Recommendation: AWS (Sydney Region: ap-southeast-2)**
- **Pros:** Data sovereignty (Australian Privacy Act compliance), full service suite (RDS, S3, SES, CloudFront), scalable
- **Cons:** Complex pricing, requires AWS expertise
- **Services:**
  - **Compute:** Elastic Beanstalk (easy deployment) or ECS Fargate (containerized, more control)
  - **Load Balancer:** Application Load Balancer (ALB)
  - **Database:** RDS PostgreSQL (Multi-AZ for production)
  - **Cache:** ElastiCache Redis
  - **Storage:** S3
  - **CDN:** CloudFront
  - **Monitoring:** CloudWatch

**Alternative: Render.com or Railway.app**
- **Pros:** Extremely simple deployment (Git push → deploy), free tier, Australian data center (Render)
- **Cons:** Less control, slightly more expensive at scale
- **When to Use:** For MVP prototyping or if team lacks AWS expertise

**Development Environment:**
- Local: Docker Compose (Postgres + Redis + API + Frontend)
- Staging: AWS Beanstalk (single instance)
- Production: AWS Beanstalk (multi-instance) or ECS Fargate

---

### CI/CD

**Primary Recommendation: GitHub Actions**
- **Pros:** Free for public repos (2000 min/month for private), integrated with GitHub, simple YAML config
- **Cons:** Slower runners than paid options (Buildkite, CircleCI)
- **Pipeline:**
  1. **On Push to `develop`:** Run tests → lint → build → deploy to staging
  2. **On Push to `main`:** Run tests → lint → build → deploy to production (manual approval gate)
- **Tests:** Jest (unit), Playwright (E2E)

**Alternative: GitLab CI/CD**
- Similar to GitHub Actions but requires GitLab hosting

---

### Monitoring & Logging

**Application Monitoring: Sentry**
- **Pros:** Real-time error tracking, stack traces, user context, Australian data center option
- **Cons:** Free tier limited (5k events/month)
- **Use:** Track frontend and backend exceptions

**Logs: AWS CloudWatch Logs**
- **Pros:** Native AWS integration, queryable with CloudWatch Insights
- **Cons:** Can get expensive at high volume
- **Alternative:** Logtail or Papertrail for simpler UI

**Uptime Monitoring: UptimeRobot (Free) or Pingdom**

**Performance Monitoring (V2):** New Relic or Datadog APM

---

## 3. System Architecture Breakdown

### 3a. Frontend Architecture

#### Routing Structure
```
/                              → Public landing page (marketing)
/login                         → Login page (all roles)
/admin/dashboard               → Super Admin / Campus Manager dashboard
/admin/enrolments              → Enrolment management
/admin/cohorts                 → Cohort list and creation
/admin/cohort/:id              → Cohort detail (roster, schedule, attendance)
/admin/billing                 → Invoice and payment management
/admin/staff                   → Staff directory
/admin/reports                 → Reports and analytics
/admin/settings                → Organisation settings

/instructor/dashboard          → Instructor dashboard (upcoming sessions)
/instructor/session/:id/attend → Roll call / attendance screen

/parent/dashboard              → Parent dashboard (children overview)
/parent/child/:id              → Child detailed progress view
/parent/billing                → Family invoices and payments
/parent/messages               → Messaging inbox

/student/dashboard             → Student dashboard (own progress)
/student/projects              → Project submissions
```

#### State Management
- **React Query:** API data fetching, caching, background refetching
  - Example: `useQuery(['enrolments', campusId], fetchEnrolments)` automatically caches and deduplicates requests
- **Zustand:** Global client state (current user, UI state like sidebar open/closed)
- **React Hook Form:** Local form state

#### Key Component Hierarchy

**Admin Portal:**
```
<App>
  <AuthProvider>           // Manages auth state, redirects if not logged in
    <Layout>               // Sidebar + top nav
      <Sidebar />
      <TopNav />
      <Outlet>             // React Router outlet
        <DashboardPage />  // or EnrolmentsPage, etc.
      </Outlet>
    </Layout>
  </AuthProvider>
</App>
```

**Parent Portal:**
```
<App>
  <AuthProvider>
    <ParentLayout>         // Different nav, child-focused
      <TopNav />
      <Outlet>
        <ParentDashboard />
      </Outlet>
    </ParentLayout>
  </AuthProvider>
</App>
```

**Shared Components:**
- `<Table>` — Reusable data table (uses TanStack Table)
- `<Modal>` — Overlay dialogs
- `<StatusBadge>` — Color-coded status indicators
- `<SkillTree>` — Hierarchical skill display

---

### 3b. Backend / API Architecture

#### API Design

**RESTful API with versioning:**
```
/api/v1/auth/login                POST    — Login
/api/v1/auth/logout               POST    — Logout

/api/v1/families                  GET     — List families (admin)
/api/v1/families                  POST    — Create family
/api/v1/families/:id              GET     — Get family details
/api/v1/families/:id              PATCH   — Update family
/api/v1/families/:id/students     GET     — List students in family

/api/v1/students                  GET     — List students (admin, filtered by campus)
/api/v1/students/:id              GET     — Get student profile
/api/v1/students/:id/enrolments   GET     — List student's enrolments
/api/v1/students/:id/progress     GET     — Get skill progress

/api/v1/cohorts                   GET     — List cohorts (filtered by campus, status)
/api/v1/cohorts                   POST    — Create cohort
/api/v1/cohorts/:id               GET     — Get cohort details (roster, schedule)
/api/v1/cohorts/:id/sessions      GET     — List sessions in cohort

/api/v1/sessions/:id/attendance   GET     — Get attendance for session
/api/v1/sessions/:id/attendance   PUT     — Submit/update attendance

/api/v1/invoices                  GET     — List invoices (filtered by family, status)
/api/v1/invoices/:id              GET     — Get invoice details
/api/v1/invoices/:id/pay          POST    — Create Stripe Checkout session

/api/v1/payments                  GET     — List payments
/api/v1/payments                  POST    — Record manual payment

/api/v1/webhooks/stripe           POST    — Stripe webhook handler
```

**Authentication Middleware:**
```javascript
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.get('/api/v1/cohorts', requireAuth, requireRole(['super_admin', 'campus_manager']), getCohorts);
```

#### Core Service Modules

Backend is organized into modules (folders):
```
/src
  /modules
    /auth          — Login, logout, JWT generation
    /families      — Family CRUD
    /students      — Student CRUD, enrolments
    /cohorts       — Cohort, session management
    /attendance    — Attendance recording
    /billing       — Invoice generation, payment recording
    /payments      — Stripe integration
    /notifications — Email sending
    /reports       — Analytics queries
  /middleware      — Auth, error handling, logging
  /utils           — Helpers (date formatting, validators)
  /db              — Prisma client, migrations
  /jobs            — Background jobs (Bull)
```

**Each module has:**
- `controller.js` — Express route handlers
- `service.js` — Business logic
- `model.js` — Prisma schema definitions (or Sequelize models)

**Example: Enrolment Creation Flow**
1. POST `/api/v1/enrolments` → `enrolmentController.create()`
2. Controller validates request body (Joi/Zod)
3. Controller calls `enrolmentService.create(studentId, cohortId, ...)`
4. Service checks:
   - Student age within program range?
   - Cohort at capacity?
   - Duplicate enrolment?
5. Service creates Enrolment record (status: 'pending_payment')
6. Service calls `billingService.createEnrolmentInvoice(enrolment)`
7. Billing service generates Invoice with line items (tuition, sibling discount, GST)
8. Service calls `notificationService.sendEnrolmentConfirmation(family, invoice)`
9. Return invoice to client

---

#### Background Job / Queue Design

**Tool:** BullMQ (Redis-backed job queue)

**Async Jobs:**
- **Send email:** Offload to queue (don't block API response)
- **Enrolment state transitions:** Cron job runs daily at midnight to transition `enrolled` → `active` on start_date
- **Invoice reminders:** Cron job runs daily to send reminder emails for overdue invoices
- **Data exports:** Large CSV exports queued and emailed when ready

**Example Queue:**
```javascript
// Producer (in API)
await emailQueue.add('send-email', {
  to: 'parent@example.com',
  template: 'enrolment-confirmation',
  data: { family, invoice }
});

// Consumer (worker process)
emailQueue.process('send-email', async (job) => {
  const { to, template, data } = job.data;
  await sendgrid.send(renderTemplate(template, data));
});
```

**Worker Scaling:** Separate worker process (`npm run worker`) scales independently from API

---

#### Webhook Handling

**Stripe Webhooks:**
- Endpoint: `/api/webhooks/stripe`
- Verify signature using Stripe secret
- Handle events:
  - `checkout.session.completed` → Create Payment, update Invoice status, send receipt
  - `payment_intent.payment_failed` → Log error, notify parent
- Use idempotency key (Stripe's `event.id`) to prevent duplicate processing

```javascript
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await paymentService.handleCheckoutComplete(session);
  }

  res.json({ received: true });
});
```

---

### 3c. Database Architecture

#### Schema Overview
See "Data Model" artifact for full schema. Key highlights:
- **Multi-tenancy:** All tables have `organisation_id` foreign key
- **Row-Level Security (RLS):** PostgreSQL policies enforce `WHERE organisation_id = current_user.organisation_id`
- **Denormalized Fields:** `family.account_balance`, `invoice.amount_outstanding`, `cohort.current_enrolments` for performance

#### Key Indexes
```sql
CREATE INDEX idx_enrolment_status ON enrolments(status);
CREATE INDEX idx_invoice_family_status ON invoices(family_id, status);
CREATE INDEX idx_attendance_session ON attendances(session_id);
CREATE INDEX idx_session_date ON sessions(scheduled_date);
CREATE INDEX idx_family_email ON families(primary_contact_email);
```

#### Query Optimization
- **N+1 Prevention:** Use Prisma's `include` or Sequelize's `include` for eager loading
  - Example: Fetch cohort with roster in 1 query:
    ```javascript
    const cohort = await prisma.cohort.findUnique({
      where: { id },
      include: { enrolments: { include: { student: true } } }
    });
    ```
- **Pagination:** All list endpoints paginated (limit 20-50 records per request)
- **Materialized Views (V2):** For complex reports (e.g., retention analysis), create materialized views refreshed nightly

#### Multi-Tenancy Strategy

**Single Database with Org-Level Isolation:**
- All queries automatically filter by `organisation_id`
- Enforced at middleware level:
  ```javascript
  app.use((req, res, next) => {
    if (req.user) {
      req.organisationId = req.user.organisation_id;
    }
    next();
  });
  ```
- Alternative (V2+): Separate schemas per organisation (`org_123.students`, `org_456.students`)

---

### 3d. Auth & Security

#### Auth Flow (JWT + Redis Session)
1. User submits email/password to `/api/v1/auth/login`
2. Server validates credentials (bcrypt compare)
3. Server generates:
   - `session_id` (UUID)
   - JWT payload: `{ user_id, organisation_id, role, session_id }`
4. Server stores session in Redis: `SET session:{session_id} {user_id} EX 86400` (24hr TTL)
5. Server signs JWT with secret, sends in httpOnly cookie
6. Client includes cookie on all requests
7. API middleware:
   - Verifies JWT signature
   - Checks `session_id` exists in Redis
   - If valid, attaches `req.user` and `req.organisationId`

**Logout:** Delete session from Redis

**Refresh Tokens (V2):** Extend session without re-login

---

#### Role-Based Access Control (RBAC)

**Permission Middleware:**
```javascript
const PERMISSIONS = {
  'super_admin': ['*'],  // All permissions
  'campus_manager': ['cohort.create', 'cohort.edit', 'enrolment.approve', 'invoice.view'],
  'lead_instructor': ['attendance.mark', 'progress.update', 'student.view'],
  'parent': ['child.view', 'invoice.pay'],
};

function requirePermission(permission) {
  return (req, res, next) => {
    const userPerms = PERMISSIONS[req.user.role];
    if (userPerms.includes('*') || userPerms.includes(permission)) {
      return next();
    }
    res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Usage
app.post('/api/v1/cohorts', requireAuth, requirePermission('cohort.create'), createCohort);
```

**Row-Level Permissions:**
- Campus Manager can only access cohorts at their assigned campus(es)
- Parent can only access their own family/student data

---

#### Data Encryption & Privacy

**At Rest:**
- Database encryption: AWS RDS encryption enabled (AES-256)
- Sensitive fields (payment card tokens) encrypted using `crypto` library before storing

**In Transit:**
- HTTPS/TLS 1.3 only (enforce via ALB listener rules)
- No HTTP traffic allowed

**Australian Privacy Act Compliance:**
- **Consent:** Checkbox during registration: "I consent to Rocket Academy collecting and storing my family's data"
- **Data Access:** Parent can download their data as JSON via `/api/v1/families/:id/export`
- **Data Retention:** Soft delete only; data retained 7 years, then anonymized
- **Breach Notification:** Sentry alerts on exceptions; manual process to notify OAIC if >500 records affected

---

## 4. Key Integrations

### Payment Gateway: Stripe

**Provider:** Stripe (https://stripe.com/au)
**Why:** Best-in-class developer experience, strong AUD support, BECS Direct Debit for bank transfers
**Integration:**
- SDK: `stripe` npm package
- Checkout flow: Redirect to Stripe Checkout (hosted page)
- Webhook: `/api/webhooks/stripe` handles `checkout.session.completed`
- Test Mode: Use test API keys during development

---

### Email Service: SendGrid

**Provider:** SendGrid (https://sendgrid.com)
**Why:** Free tier (100 emails/day), excellent templates, analytics
**Integration:**
- SDK: `@sendgrid/mail` npm package
- Templates: Create email templates in SendGrid UI (enrolment confirmation, invoice reminder, etc.)
- Dynamic data: Pass `templateId` + `dynamicTemplateData` to SendGrid API
- Bounce handling: Webhook at `/api/webhooks/sendgrid` marks emails as undeliverable

---

### SMS Service: Twilio (V2)

**Provider:** Twilio (https://twilio.com)
**Why:** Strong AU support, reliable delivery
**Integration:**
- SDK: `twilio` npm package
- Use Cases: Critical alerts (session cancellation, payment failed)
- Cost: ~$0.08 AUD per SMS; budget accordingly

---

### Push Notifications (V2): OneSignal

**Provider:** OneSignal (https://onesignal.com)
**Why:** Free tier (10k subscribers), easy React Native integration
**Integration:**
- Web SDK for browser notifications
- Mobile SDK for React Native app (future)

---

### Calendar Sync (Optional, V2)

**Provider:** Google Calendar API or Outlook Calendar API
**Why:** Allow parents to sync session schedule to personal calendars
**Integration:**
- OAuth flow to access parent's Google/Outlook calendar
- Create calendar events for each session
- Update on reschedule/cancellation

---

## 5. Deployment Architecture

### Environment Strategy

**Three Environments:**

| Environment | Purpose | Deployment Trigger | Infra |
|---|---|---|---|
| **Development** | Local dev | Git commit (local) | Docker Compose on dev machine |
| **Staging** | QA testing, demo | Push to `develop` branch | AWS Beanstalk (single instance) |
| **Production** | Live system | Push to `main` branch (manual approval) | AWS Beanstalk (multi-instance) or ECS |

---

### Infrastructure as Code

**Tool:** Terraform or AWS CDK
**Why:** Reproducible infrastructure, version-controlled

**Resources Defined:**
- VPC, subnets, security groups
- RDS PostgreSQL (Multi-AZ in prod, single-AZ in staging)
- ElastiCache Redis
- S3 buckets (one per environment)
- Elastic Beanstalk application + environments
- CloudFront distribution (CDN)

**Example Terraform:**
```hcl
resource "aws_db_instance" "postgres" {
  identifier           = "rocket-academy-db-${var.env}"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = var.env == "production" ? "db.t3.medium" : "db.t3.micro"
  allocated_storage    = 20
  multi_az             = var.env == "production"
  publicly_accessible  = false
  vpc_security_group_ids = [aws_security_group.db.id]
}
```

---

### Scaling Strategy

**Vertical Scaling (MVP):**
- Single API instance (t3.medium) handles 50 concurrent users easily
- Upgrade to t3.large or c5.large if CPU/memory constrained

**Horizontal Scaling (Post-MVP):**
- Auto Scaling Group: 2-4 API instances behind ALB
- Trigger: Scale up if CPU >70% for 5 mins; scale down if <30%
- Database: Read replicas for analytics queries (V2)

**Database Scaling:**
- Up to 10k active students: single RDS instance sufficient
- 10k-100k: Add read replicas, use connection pooling (PgBouncer)
- 100k+: Consider sharding by campus or switching to multi-tenant architecture

---

### Backup and Disaster Recovery

**Database Backups:**
- RDS automated backups: daily snapshots, 7-day retention
- Manual snapshots before major migrations

**Disaster Recovery Plan:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour (via RDS snapshots)
- **Failover:** RDS Multi-AZ auto-failover in <60 seconds
- **Manual Recovery:**
  1. Restore RDS from latest snapshot
  2. Update DNS to point to new RDS endpoint
  3. Redeploy API instances

**Application Backups:**
- S3 versioning enabled (recover deleted files)
- Weekly full data export to S3 (JSON dump of all tables)

---

## 6. Development Roadmap

### Phase 1: MVP (12 weeks)

**Week 1-2: Foundation**
- [ ] Set up repo, CI/CD, staging environment
- [ ] Database schema design and Prisma migrations
- [ ] Auth system (login, JWT, RBAC middleware)
- [ ] Basic API endpoints (families, students, staff)

**Week 3-4: Enrolment & Billing**
- [ ] Cohort creation and scheduling
- [ ] Enrolment workflow (enquiry → pending → enrolled)
- [ ] Invoice generation logic
- [ ] Stripe Checkout integration
- [ ] Webhook handler for payment confirmation

**Week 5-6: Attendance & Progress**
- [ ] Session creation (linked to cohorts)
- [ ] Instructor roll call screen (mobile-optimised)
- [ ] Attendance recording and history
- [ ] Skill tree data model
- [ ] Instructor skill progress updates

**Week 7-8: Parent Portal**
- [ ] Parent login and dashboard
- [ ] Child progress view (skill tree display)
- [ ] Invoice and payment portal
- [ ] Direct messaging system

**Week 9-10: Admin Portal**
- [ ] Super Admin dashboard (KPI widgets)
- [ ] Enrolment management screen
- [ ] Cohort management (roster, schedule)
- [ ] Financial reports (revenue, outstanding invoices)

**Week 11-12: Testing & Launch Prep**
- [ ] End-to-end testing (Playwright)
- [ ] User acceptance testing with Rocket Academy staff
- [ ] Performance testing (load test with 100 concurrent users)
- [ ] Security audit (OWASP Top 10 checklist)
- [ ] Production deployment and monitoring setup
- [ ] Staff training sessions

**Team Composition (MVP):**
- 1 Full-Stack Lead (80% backend, 20% frontend)
- 1 Frontend Developer (React, Tailwind)
- 1 Backend Developer (Node.js, database)
- 1 Designer/UX (Part-time: wireframes, UI mockups, usability testing)
- 1 QA Tester (Part-time: manual and automated testing)

---

### Phase 2: Enhanced Features (8 weeks post-MVP)

**Weeks 13-16:**
- [ ] Waitlist management and auto-notifications
- [ ] QR code check-in kiosk (iPad app)
- [ ] Recurring auto-charge (Stripe subscriptions)
- [ ] Payment plans (split payments)
- [ ] Makeup session tokens

**Weeks 17-20:**
- [ ] SMS notifications (Twilio)
- [ ] Rubric-based grading for projects
- [ ] Achievement certificates (auto-generated PDFs)
- [ ] SSO (Google/Microsoft login)
- [ ] Advanced reporting (custom report builder)

---

### Phase 3: Scale & Mobile (12 weeks)

**Weeks 21-28:**
- [ ] Mobile app (React Native: iOS + Android)
- [ ] Push notifications
- [ ] Offline support for instructor app
- [ ] API for third-party integrations
- [ ] Calendar sync (Google Calendar, Outlook)

**Weeks 29-32:**
- [ ] Horizontal scaling (auto-scaling API instances)
- [ ] Read replicas for analytics
- [ ] Advanced analytics (retention cohort analysis, LTV)
- [ ] Referral program

---

## Recommended Team Composition

**MVP Team (3-5 people):**
- 1 Full-Stack Lead Engineer
- 1-2 Frontend Developers (React)
- 1 Backend Developer (Node.js + DB)
- 1 Designer/UX (Part-time)
- 1 QA/DevOps (Part-time)

**Post-MVP Team (5-8 people):**
- Same as MVP +
- 1 Mobile Developer (React Native)
- 1 Data Engineer / Analytics (for reports, dashboards)
- 1 Customer Success / Support (to gather feedback)

---

## Final Notes

This architecture is designed for:
- **Rapid MVP launch** (12 weeks with a small team)
- **Australian compliance** (data in Sydney region, Privacy Act considerations)
- **Scalability** (handles 5,000 students without major refactoring)
- **Maintainability** (modular monolith, standard tech stack, clear separation of concerns)

**Next Steps:**
1. Review with Rocket Academy stakeholders
2. Finalise tech stack choices (confirm Stripe vs Square, SendGrid vs SES)
3. Set up AWS account and staging environment
4. Create detailed sprint plan for Phase 1
