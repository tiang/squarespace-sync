# Vercel Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy Rocket Academy platform (API, Admin, Parent Portal) to Vercel with three separate projects, Vercel Postgres database, and custom subdomains.

**Architecture:** Three independent Vercel projects (platform-admin-dev, platform-portal-dev, platform-api-dev) connected to the same GitHub repo. Each project targets a different root directory in the `platform/` folder. API uses Vercel serverless functions with Prisma + Vercel Postgres. Frontends are static Vite builds.

**Tech Stack:** Vercel, Vercel Postgres, Express (serverless), Prisma, React, Vite

---

## Task 1: Prepare Admin Vercel Configuration

**Files:**
- Create: `platform/admin/vercel.json`
- Check: `platform/admin/package.json`

**Step 1: Create vercel.json for admin project**

Create `platform/admin/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

**Step 2: Verify admin builds locally**

Run: `cd platform/admin && npm run build`

Expected: Build completes successfully, produces `dist/` directory with static files

**Step 3: Commit admin vercel config**

```bash
git add platform/admin/vercel.json
git commit -m "feat(platform): add Vercel config for admin frontend"
```

---

## Task 2: Prepare Portal Vercel Configuration

**Files:**
- Create: `platform/parent-portal/vercel.json`
- Check: `platform/parent-portal/package.json`

**Step 1: Create vercel.json for portal project**

Create `platform/parent-portal/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

**Step 2: Verify portal builds locally**

Run: `cd platform/parent-portal && npm run build`

Expected: Build completes successfully, produces `dist/` directory with static files

**Step 3: Commit portal vercel config**

```bash
git add platform/parent-portal/vercel.json
git commit -m "feat(platform): add Vercel config for parent portal frontend"
```

---

## Task 3: Prepare API for Serverless Functions

**Files:**
- Modify: `platform/api/src/index.js:1-8`
- Create: `platform/api/vercel.json`
- Check: `platform/api/prisma/schema.prisma`

**Step 1: Modify index.js to export app for Vercel**

Update `platform/api/src/index.js`:

```javascript
const app = require('./app');

const PORT = process.env.PORT || 3001;

// Only start server if run directly (not when imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
```

**Step 2: Create vercel.json for API project**

Create `platform/api/vercel.json`:

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

**Step 3: Verify Prisma schema uses DATABASE_URL**

Check `platform/api/prisma/schema.prisma` datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Expected: DATABASE_URL is already configured (already present in schema)

**Step 4: Test API starts locally**

Run: `cd platform/api && npm start`

Expected: Server starts on port 3001, no errors

**Step 5: Commit API serverless changes**

```bash
git add platform/api/src/index.js platform/api/vercel.json
git commit -m "feat(platform): configure API for Vercel serverless functions"
```

---

## Task 4: Install and Configure Vercel CLI

**Files:**
- None (global npm package)

**Step 1: Install Vercel CLI globally**

Run: `npm install -g vercel`

Expected: Vercel CLI installed successfully

**Step 2: Login to Vercel**

Run: `vercel login`

Expected: Browser opens for authentication, CLI confirms login success

**Step 3: Verify Vercel CLI access**

Run: `vercel whoami`

Expected: Displays your Vercel username/email

---

## Task 5: Deploy API Project to Vercel

**Files:**
- None (Vercel project creation)

**Step 1: Navigate to API directory**

Run: `cd platform/api`

**Step 2: Initialize Vercel project**

Run: `vercel`

Prompts and responses:
- "Set up and deploy?" → Yes
- "Which scope?" → Select your account
- "Link to existing project?" → No
- "What's your project's name?" → `platform-api-dev`
- "In which directory is your code located?" → `./` (current directory)
- "Want to modify settings?" → No

Expected: Vercel creates project and starts deployment

**Step 3: Wait for deployment to complete**

Expected output:
```
✓  Deployed to production
🔍  Inspect: https://vercel.com/[username]/platform-api-dev/...
🌍  Production: https://platform-api-dev.vercel.app
```

**Step 4: Save the API URL**

Copy the production URL (e.g., `https://platform-api-dev.vercel.app`)

You'll need this for frontend environment variables

**Step 5: Test API health endpoint**

Run: `curl https://platform-api-dev.vercel.app/api/health`

Expected: Error (database not connected yet - this is expected)

---

## Task 6: Provision and Link Vercel Postgres

**Files:**
- None (Vercel dashboard operations)

**Step 1: Open Vercel dashboard for API project**

Navigate to: https://vercel.com/[username]/platform-api-dev

**Step 2: Create Postgres database**

1. Click "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Name: `platform-production-db`
5. Region: Select closest to your users (e.g., `syd1` for Australia)
6. Click "Create"

Expected: Database provisioned in ~1 minute

**Step 3: Link database to API project**

1. In database settings, click "Connect Project"
2. Select `platform-api-dev`
3. Confirm linking

Expected: Environment variables automatically injected into project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

**Step 4: Add DATABASE_URL environment variable**

1. Go to project Settings → Environment Variables
2. Add new variable:
   - Key: `DATABASE_URL`
   - Value: `${POSTGRES_PRISMA_URL}` (reference to injected var)
   - Environment: Production
3. Save

**Step 5: Trigger redeployment**

Run: `vercel --prod`

Expected: Redeploys with database connection, runs Prisma migrations

**Step 6: Test API health endpoint again**

Run: `curl https://platform-api-dev.vercel.app/api/health`

Expected: `{"status":"ok","db":"connected","timestamp":"..."}`

---

## Task 7: Deploy Admin Frontend to Vercel

**Files:**
- None (Vercel project creation)

**Step 1: Navigate to admin directory**

Run: `cd platform/admin`

**Step 2: Initialize Vercel project for admin**

Run: `vercel`

Prompts and responses:
- "Set up and deploy?" → Yes
- "Which scope?" → Select your account
- "Link to existing project?" → No
- "What's your project's name?" → `platform-admin-dev`
- "In which directory is your code located?" → `./`
- "Want to modify settings?" → No

Expected: Deployment completes successfully

**Step 3: Save the admin URL**

Copy production URL (e.g., `https://platform-admin-dev.vercel.app`)

**Step 4: Add API_URL environment variable**

1. In Vercel dashboard → `platform-admin-dev` → Settings → Environment Variables
2. Add new variable:
   - Key: `VITE_API_URL`
   - Value: `https://platform-api-dev.vercel.app`
   - Environment: Production
3. Save

**Step 5: Trigger redeployment with env var**

Run: `vercel --prod`

Expected: Redeploys with environment variable configured

**Step 6: Test admin frontend**

Open browser: `https://platform-admin-dev.vercel.app`

Expected: Admin app loads, can connect to API

---

## Task 8: Deploy Parent Portal to Vercel

**Files:**
- None (Vercel project creation)

**Step 1: Navigate to portal directory**

Run: `cd platform/parent-portal`

**Step 2: Initialize Vercel project for portal**

Run: `vercel`

Prompts and responses:
- "Set up and deploy?" → Yes
- "Which scope?" → Select your account
- "Link to existing project?" → No
- "What's your project's name?" → `platform-portal-dev`
- "In which directory is your code located?" → `./`
- "Want to modify settings?" → No

Expected: Deployment completes successfully

**Step 3: Save the portal URL**

Copy production URL (e.g., `https://platform-portal-dev.vercel.app`)

**Step 4: Add API_URL environment variable**

1. In Vercel dashboard → `platform-portal-dev` → Settings → Environment Variables
2. Add new variable:
   - Key: `VITE_API_URL`
   - Value: `https://platform-api-dev.vercel.app`
   - Environment: Production
3. Save

**Step 5: Trigger redeployment with env var**

Run: `vercel --prod`

Expected: Redeploys with environment variable configured

**Step 6: Test portal frontend**

Open browser: `https://platform-portal-dev.vercel.app`

Expected: Portal app loads, can connect to API

---

## Task 9: Configure CORS for Deployed Origins

**Files:**
- Modify: `platform/api/src/app.js:11-13`

**Step 1: Update CORS_ORIGIN environment variable in API**

In Vercel dashboard → `platform-api-dev` → Settings → Environment Variables:

1. Add or update `CORS_ORIGIN`:
   - Key: `CORS_ORIGIN`
   - Value: `https://platform-admin-dev.vercel.app,https://platform-portal-dev.vercel.app`
   - Environment: Production
2. Save

**Step 2: Trigger API redeployment**

Run: `cd platform/api && vercel --prod`

Expected: API redeploys with updated CORS configuration

**Step 3: Test CORS from admin**

Open browser console at `https://platform-admin-dev.vercel.app`

Run: `fetch('https://platform-api-dev.vercel.app/api/health').then(r => r.json()).then(console.log)`

Expected: Response received without CORS errors

---

## Task 10: Seed Production Database (Optional)

**Files:**
- Check: `platform/api/prisma/seed.js`
- Check: `platform/api/package.json` (prisma.seed script)

**Step 1: Pull Vercel environment variables locally**

Run: `cd platform/api && vercel env pull .env.production`

Expected: Creates `.env.production` with production database URL

**Step 2: Run seed script against production**

Run: `npx dotenv -e .env.production -- npx prisma db seed`

Expected: Seed data inserted into Vercel Postgres database

**Step 3: Verify seed data**

Run: `npx dotenv -e .env.production -- npx prisma studio`

Expected: Prisma Studio opens, shows seeded data in production database

**Step 4: Clean up local env file**

Run: `rm .env.production`

Expected: Local production credentials removed (security)

---

## Task 11: Document Deployment URLs

**Files:**
- Create: `platform/DEPLOYMENT.md`

**Step 1: Create deployment documentation**

Create `platform/DEPLOYMENT.md`:

```markdown
# Platform Deployment

## Production URLs

- **Admin:** https://platform-admin-dev.vercel.app
- **Portal:** https://platform-portal-dev.vercel.app
- **API:** https://platform-api-dev.vercel.app

## Vercel Projects

- Admin: https://vercel.com/[username]/platform-admin-dev
- Portal: https://vercel.com/[username]/platform-portal-dev
- API: https://vercel.com/[username]/platform-api-dev

## Database

- **Type:** Vercel Postgres
- **Name:** platform-production-db
- **Region:** syd1 (Sydney)
- **Dashboard:** https://vercel.com/[username]/stores/postgres/platform-production-db

## Environment Variables

### API Project
- `DATABASE_URL` → `${POSTGRES_PRISMA_URL}`
- `CORS_ORIGIN` → Frontend URLs (comma-separated)
- `NODE_ENV` → `production` (auto-set by Vercel)

### Admin Project
- `VITE_API_URL` → API production URL

### Portal Project
- `VITE_API_URL` → API production URL

## Deployment Workflow

Push to `main` branch → All three projects auto-deploy

## Future: Custom Domains

When ready to add custom domains:

1. Admin: `admin.rocketacademy.com.au`
2. Portal: `portal.rocketacademy.com.au`
3. API: `api.rocketacademy.com.au`

Update DNS CNAME records and environment variables accordingly.
```

**Step 2: Commit deployment documentation**

```bash
git add platform/DEPLOYMENT.md
git commit -m "docs(platform): add deployment URLs and configuration"
```

**Step 3: Push to GitHub**

Run: `git push origin main`

Expected: All three Vercel projects detect changes and redeploy automatically

---

## Task 12: Verify End-to-End Functionality

**Files:**
- None (manual testing)

**Step 1: Test API health endpoint**

Run: `curl https://platform-api-dev.vercel.app/api/health`

Expected: `{"status":"ok","db":"connected","timestamp":"..."}`

**Step 2: Test admin frontend loads**

Open browser: `https://platform-admin-dev.vercel.app`

Expected: Admin interface loads without errors

**Step 3: Test portal frontend loads**

Open browser: `https://platform-portal-dev.vercel.app`

Expected: Portal interface loads without errors

**Step 4: Test admin → API connectivity**

In admin app, perform an action that calls the API (e.g., fetch staff list)

Expected: API request succeeds, data displayed

**Step 5: Test portal → API connectivity**

In portal app, perform an action that calls the API

Expected: API request succeeds, data displayed

**Step 6: Check Vercel deployment logs**

In Vercel dashboard, check logs for all three projects

Expected: No errors in deployment or runtime logs

**Step 7: Document any issues**

If issues found, create GitHub issues or document in DEPLOYMENT.md

Expected: Clear list of any blockers or improvements needed

---

## Verification Checklist

After completing all tasks, verify:

- [ ] All three Vercel projects deployed successfully
- [ ] Vercel Postgres database provisioned and linked to API
- [ ] API health endpoint returns `{"status":"ok","db":"connected"}`
- [ ] Admin frontend loads at `platform-admin-dev.vercel.app`
- [ ] Portal frontend loads at `platform-portal-dev.vercel.app`
- [ ] Both frontends can successfully call API endpoints
- [ ] CORS configured correctly (no CORS errors in browser)
- [ ] Database migrations ran successfully
- [ ] Seed data populated (if applicable)
- [ ] DEPLOYMENT.md created with all URLs and configuration
- [ ] Changes committed and pushed to GitHub
- [ ] Auto-deployment triggered from GitHub push

---

## Future Enhancements (Out of Scope)

These are documented for future work but NOT part of this deployment:

1. **Custom Domains:**
   - Add `admin.rocketacademy.com.au` to admin project
   - Add `portal.rocketacademy.com.au` to portal project
   - Add `api.rocketacademy.com.au` to API project
   - Configure DNS CNAME records
   - Update `VITE_API_URL` environment variables

2. **Staging Environment:**
   - Create separate Vercel projects for staging
   - Use separate database for staging
   - Configure GitHub preview deployments

3. **Monitoring:**
   - Set up Vercel Analytics
   - Configure error tracking (Sentry)
   - Set up uptime monitoring

4. **CI/CD:**
   - Add GitHub Actions for tests before deployment
   - Add deployment preview comments on PRs
   - Add automated smoke tests after deployment

---

## Rollback Procedure

If deployment has issues:

1. In Vercel dashboard → Project → Deployments
2. Find last working deployment
3. Click "..." menu → "Promote to Production"
4. Database migrations are NOT auto-rolled back (handle manually if needed)

---

## Troubleshooting

### Issue: API returns 500 errors
- Check Vercel logs in dashboard
- Verify `DATABASE_URL` environment variable is set correctly
- Verify Postgres database is linked to project

### Issue: Frontend can't reach API
- Check `VITE_API_URL` environment variable
- Verify CORS configuration includes frontend URL
- Check browser console for CORS errors

### Issue: Prisma migrations fail
- Check Prisma schema syntax
- Verify database connection
- Check Vercel build logs for migration errors

### Issue: Build fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Test build locally before deploying
