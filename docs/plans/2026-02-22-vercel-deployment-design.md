# Platform Vercel Deployment Design

**Date:** 2026-02-22
**Status:** Approved

## Goal

Deploy the Rocket Academy platform (API, Admin, and Parent Portal) to Vercel with production-ready configuration using three separate Vercel projects, Vercel Postgres database, and custom subdomains under rocketacademy.com.au.

## Requirements

- Deploy only the `platform/` directory (not sync jobs or dashboard)
- Vercel Postgres for production database
- Production environment only (no staging for now)
- No authentication initially (public access)
- Separate subdomains for each app (admin, portal, api)
- Use rocketacademy.com.au domain with custom subdomains

## Architecture Overview

Three independent Vercel projects, all connected to the same GitHub repository:

### Project 1: platform-admin
- **Root Directory:** `/platform/admin`
- **Framework:** Vite (React)
- **Output:** Static site
- **Auto-generated Domain:** `platform-admin-dev.vercel.app`
- **Custom Domain:** `admin.rocketacademy.com.au`
- **Purpose:** Staff admin interface

### Project 2: platform-portal
- **Root Directory:** `/platform/parent-portal`
- **Framework:** Vite (React)
- **Output:** Static site
- **Auto-generated Domain:** `platform-portal-dev.vercel.app`
- **Custom Domain:** `portal.rocketacademy.com.au` (or `app.rocketacademy.com.au`)
- **Purpose:** Parent portal interface

### Project 3: platform-api
- **Root Directory:** `/platform/api`
- **Framework:** Node.js (Express)
- **Output:** Serverless Functions
- **Auto-generated Domain:** `platform-api-dev.vercel.app`
- **Custom Domain:** `api.rocketacademy.com.au`
- **Purpose:** Backend API with Prisma + Vercel Postgres

All three projects share the same production database (Vercel Postgres) via connection string environment variables.

## Approach Selection

**Chosen Approach:** Three Separate Vercel Projects

**Why this approach:**
- Clean mapping to subdomain requirement
- Independent deployments per app
- Clearest separation of concerns
- Native subdomain support in Vercel
- Easier debugging and isolation

**Alternatives considered:**
- Single monorepo-aware project (rejected: complex routing for subdomains)
- Hybrid approach (rejected: unnecessary complexity)

## Project Configuration

### Admin Project (`platform/admin/vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

**Details:**
- Build produces static files in `dist/`
- Vite automatically detected by Vercel
- Environment variable: `VITE_API_URL` → points to API project domain

### Portal Project (`platform/parent-portal/vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

**Details:**
- Identical to admin (both are Vite apps)
- Environment variable: `VITE_API_URL` → points to API project domain

### API Project (`platform/api/vercel.json`)

```json
{
  "buildCommand": "npx prisma generate && npx prisma migrate deploy",
  "installCommand": "npm install",
  "functions": {
    "src/index.js": {
      "maxDuration": 10
    }
  }
}
```

**Details:**
- Express app converted to serverless functions via Vercel's automatic routing
- Prisma migration runs during build
- Database connection via `DATABASE_URL` environment variable (Vercel Postgres)
- Max function duration: 10 seconds (configurable up to 60s on Pro plan)

## Database Setup & Prisma Migrations

### Provisioning Vercel Postgres

1. Create a Postgres database in the Vercel dashboard (Storage tab)
2. Vercel auto-generates a connection string
3. Link the database to the `platform-api` project
4. This automatically injects `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc. as environment variables

### Prisma Configuration

Existing `platform/api/prisma/schema.prisma` datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // or env("POSTGRES_PRISMA_URL") for Vercel
}
```

### Migration Strategy

1. **Initial deployment:** Run `npx prisma migrate deploy` during build (in buildCommand)
2. **Future schema changes:**
   - Develop locally: `npx prisma migrate dev` (creates migration files)
   - Commit migration files to git
   - Deploy to Vercel: `prisma migrate deploy` runs automatically
   - No need to manually run migrations in production

### Seed Data

- `package.json` has a `prisma.seed` script
- Run manually after first deployment: `vercel env pull` → `npx prisma db seed` locally
- Or create a one-time serverless function to seed

### Connection Pooling

- Vercel Postgres includes built-in connection pooling via `POSTGRES_PRISMA_URL`
- Prisma will use this for serverless function compatibility
- No additional Prisma Data Proxy needed

## Build & Deployment Flow

### Initial Setup (One-time)

1. Connect GitHub repo to Vercel (authorize Vercel GitHub app)
2. Create three Vercel projects via dashboard or CLI:
   - Project 1: Set root directory to `platform/admin`, name: `platform-admin-dev`
   - Project 2: Set root directory to `platform/parent-portal`, name: `platform-portal-dev`
   - Project 3: Set root directory to `platform/api`, name: `platform-api-dev`
3. Provision Vercel Postgres storage and link to API project
4. Configure environment variables

### Deployment Trigger

- Push to `main` branch → all three projects deploy automatically
- Each project independently checks for changes in its root directory
- If no changes detected, deployment is skipped (Vercel's smart detection)

### Build Process per Project

**Admin & Portal:**
1. `npm install` in respective directory
2. `npm run build` → produces `/dist` static files
3. Vercel uploads to CDN
4. Build time: ~30-60 seconds

**API:**
1. `npm install` in `/platform/api`
2. `npx prisma generate` → creates Prisma Client
3. `npx prisma migrate deploy` → applies pending migrations to Vercel Postgres
4. Vercel converts Express routes to serverless functions automatically
5. Build time: ~1-2 minutes (Prisma generation + migrations)

### Rollback

- Vercel keeps deployment history
- One-click rollback to previous deployment via dashboard
- Database migrations are NOT auto-rolled back (handle manually if needed)

## Environment Variables

### API Project (`platform-api`)

```
DATABASE_URL=${POSTGRES_PRISMA_URL}
NODE_ENV=production
```

**Details:**
- `POSTGRES_PRISMA_URL` auto-injected when Vercel Postgres is linked
- Can also use `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` depending on Prisma needs

### Admin Project (`platform-admin`)

```
VITE_API_URL=https://platform-api-dev.vercel.app
```

**Details:**
- Points to the deployed API project URL
- Vite requires `VITE_` prefix for client-side env vars
- Update this after API project is deployed and you have the URL
- Later update to `https://api.rocketacademy.com.au` when custom domain is configured

### Portal Project (`platform-parent-portal`)

```
VITE_API_URL=https://platform-api-dev.vercel.app
```

**Details:**
- Same as admin - points to API
- Both frontends consume the same backend
- Later update to `https://api.rocketacademy.com.au` when custom domain is configured

### Setting Environment Variables

- Via Vercel dashboard: Project Settings → Environment Variables
- Or via CLI: `vercel env add VITE_API_URL production`
- Scope to "Production" environment only
- After adding env vars, trigger a redeploy for changes to take effect

**Note:** Since these are separate projects, shared variables must be manually synchronized.

## DNS & Domains

### Initial Deployment

Start with Vercel auto-generated domains for testing:
- `platform-admin-dev.vercel.app`
- `platform-portal-dev.vercel.app`
- `platform-api-dev.vercel.app`

### Production Custom Domains

Once deployments are verified, add custom subdomains:
- `admin.rocketacademy.com.au` → Admin project
- `portal.rocketacademy.com.au` → Portal project (or `app.rocketacademy.com.au`)
- `api.rocketacademy.com.au` → API project

### DNS Configuration Steps

1. In each Vercel project dashboard → Settings → Domains
2. Add custom domain (e.g., `admin.rocketacademy.com.au`)
3. Vercel provides DNS records (usually CNAME pointing to `cname.vercel-dns.com`)
4. Add these CNAME records in domain registrar's DNS panel
5. Wait for DNS propagation (~5 minutes to 48 hours, usually quick)
6. Vercel auto-provisions SSL certificates
7. Update environment variables:
   - Admin: `VITE_API_URL=https://api.rocketacademy.com.au`
   - Portal: `VITE_API_URL=https://api.rocketacademy.com.au`
8. Redeploy frontend projects to pick up new env vars

### Domain Flow

1. Deploy with `-dev` suffix domains initially for testing
2. Once verified, add custom `*.rocketacademy.com.au` subdomains
3. Both domains will work (auto-generated + custom)
4. Can keep `-dev` URLs for staging/testing purposes

## Implementation Steps & Transition

### Phase 1: Prepare Codebase

1. Add `vercel.json` to each project directory:
   - `platform/admin/vercel.json`
   - `platform/parent-portal/vercel.json`
   - `platform/api/vercel.json`
2. Update Prisma schema to use `DATABASE_URL` env var (verify configuration)
3. Verify all three projects build successfully locally:
   - `cd platform/admin && npm run build`
   - `cd platform/parent-portal && npm run build`
   - `cd platform/api && npm install` (verify no build errors)
4. Commit changes to `main` branch

### Phase 2: Set Up Vercel Projects

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Create three projects (manual via dashboard OR via CLI):
   ```bash
   cd platform/admin && vercel --prod
   cd platform/parent-portal && vercel --prod
   cd platform/api && vercel --prod
   ```
4. Set project names during creation:
   - `platform-admin-dev`
   - `platform-portal-dev`
   - `platform-api-dev`

### Phase 3: Database Setup

1. In Vercel dashboard → API project → Storage → Create Postgres Database
2. Link database to `platform-api` project (auto-injects env vars)
3. First deployment will run migrations automatically via `buildCommand`

### Phase 4: Configure Environment Variables

1. API: Nothing needed (database vars auto-injected)
2. Admin: Add `VITE_API_URL=https://platform-api-dev.vercel.app`
3. Portal: Add `VITE_API_URL=https://platform-api-dev.vercel.app`
4. Trigger redeployment after adding env vars

### Phase 5: Custom Domains (When Ready)

1. Add custom domains to each project via dashboard
2. Configure DNS CNAME records at domain registrar
3. Update `VITE_API_URL` to use `api.rocketacademy.com.au`
4. Redeploy frontends

### Phase 6: Verify & Test

1. Test API health endpoint
2. Test admin frontend → API connectivity
3. Test portal frontend → API connectivity
4. Verify Prisma queries work against Vercel Postgres
5. Test end-to-end user flows

## Trade-offs & Considerations

### Advantages

- Clean separation of concerns with three projects
- Independent deployment cycles
- Native subdomain support
- Straightforward mental model
- Easy to debug per-app issues

### Disadvantages

- Three projects to manage in Vercel dashboard
- Environment variables must be manually synchronized across projects
- Slightly more complex to coordinate full-stack changes
- Three separate deployment pipelines to monitor

### Cost Implications

- Vercel free tier: 100GB bandwidth, unlimited deployments
- Each project counts separately against limits
- Vercel Postgres: Free tier includes 256MB storage, 60 compute hours/month
- May need Pro plan ($20/month) for:
  - Increased function execution time (60s vs 10s)
  - More bandwidth
  - Team collaboration features

### Future Enhancements

- Add staging environment (separate Vercel projects or preview deployments)
- Implement authentication (Firebase Auth, Auth0, Clerk)
- Add monitoring and observability (Vercel Analytics, Sentry)
- Set up CI/CD with GitHub Actions for tests before deployment
- Migrate sync jobs to Vercel Cron (separate effort)
