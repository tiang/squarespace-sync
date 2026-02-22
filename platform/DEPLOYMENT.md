# Platform Deployment Guide

This document contains all deployment URLs, configuration details, and deployment workflows for the Rocket Academy Platform.

## Live Deployments

### Production URLs

| Service | URL | Description |
|---------|-----|-------------|
| API | https://platform-api-dev.vercel.app | NestJS backend API |
| Admin Dashboard | https://platform-rust-two.vercel.app | Staff/instructor dashboard (Vite + React) |
| Parent Portal | https://platform-portal-dev.vercel.app | Parent portal (Vite + React) |

### Vercel Projects

All applications are deployed on Vercel under separate projects:

- **API**: [platform-api](https://vercel.com/rocket-academys-projects/platform-api)
- **Admin**: [platform-admin](https://vercel.com/rocket-academys-projects/platform-rust)
- **Portal**: [platform-portal](https://vercel.com/rocket-academys-projects/platform-portal)

## Database

**Provider**: Supabase
**Database**: PostgreSQL
**Connection**: Direct connection via environment variables

Connection details are stored in Vercel environment variables and GitHub Secrets.

## Environment Variables

### API (`platform/api`)

Required environment variables configured in Vercel:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
NODE_ENV=production
```

### Admin Dashboard (`platform/admin`)

Required environment variables configured in Vercel:

```bash
VITE_API_URL=https://platform-api-dev.vercel.app
```

### Parent Portal (`platform/portal`)

Required environment variables configured in Vercel:

```bash
VITE_API_URL=https://platform-api-dev.vercel.app
```

## Deployment Workflow

### Automatic Deployments

All three applications are configured with GitHub Actions for continuous deployment:

1. **On Push to `main`**: Triggers production deployment
2. **On Pull Request**: Creates preview deployment
3. **Build Process**:
   - API: Runs migrations, then builds NestJS
   - Admin/Portal: Vite build with environment variable substitution

### Manual Deployment

To manually trigger a deployment:

```bash
# From the repository root
cd platform/api      # or admin, or portal
vercel --prod       # Deploy to production
```

### GitHub Actions

Each application has a deployment workflow in `.github/workflows/`:

- `deploy-api.yml` - API deployment
- `deploy-admin.yml` - Admin dashboard deployment
- `deploy-portal.yml` - Parent portal deployment

Workflows are triggered on:
- Push to `main` branch (when files in respective directories change)
- Manual workflow dispatch

## Database Migrations

Database migrations are automatically run during API deployment:

1. Vercel build runs `npm run build`
2. Build script includes `npx prisma migrate deploy`
3. Migrations apply before app starts

To manually run migrations:

```bash
cd platform/api
npx prisma migrate deploy
```

## Environment Setup

### Adding Environment Variables

**In Vercel Dashboard**:
1. Navigate to project settings
2. Go to "Environment Variables"
3. Add variable for Production, Preview, and Development environments
4. Redeploy for changes to take effect

**In GitHub Secrets** (for CI/CD):
1. Go to repository Settings > Secrets and variables > Actions
2. Add secrets matching the required environment variables
3. Secrets are automatically injected during GitHub Actions workflows

### Local Development

Copy environment variables from `.env.example` to `.env`:

```bash
cd platform/api
cp .env.example .env
# Edit .env with your local database URL
```

## Custom Domains (Future)

Currently using Vercel default domains. To add custom domains:

1. **Purchase domains** for:
   - `api.rocketacademy.co` (API)
   - `admin.rocketacademy.co` (Admin Dashboard)
   - `portal.rocketacademy.co` (Parent Portal)

2. **Configure in Vercel**:
   - Go to project Settings > Domains
   - Add custom domain
   - Follow DNS configuration instructions

3. **Update environment variables**:
   - Update `VITE_API_URL` in Admin and Portal projects
   - Redeploy all applications

## Monitoring & Logs

### Vercel Logs

Access deployment and runtime logs:
- Vercel Dashboard > Project > Deployments > Select deployment > Logs

### Database Logs

Access database logs:
- Supabase Dashboard > Project > Database > Logs

## Troubleshooting

### API Deployment Fails

1. Check build logs in Vercel
2. Verify `DATABASE_URL` is correctly set
3. Ensure migrations are compatible
4. Check Node.js version matches package.json

### Frontend Fails to Connect to API

1. Verify `VITE_API_URL` is set correctly
2. Check CORS configuration in API
3. Verify API is deployed and healthy

### Database Connection Issues

1. Check Supabase connection pooler status
2. Verify `DATABASE_URL` format
3. Check IP allowlist in Supabase (if configured)
4. Test connection string locally

## Health Checks

Verify deployments are healthy:

```bash
# API health check
curl https://platform-api-dev.vercel.app/health

# Admin dashboard (should return HTML)
curl https://platform-rust-two.vercel.app

# Parent portal (should return HTML)
curl https://platform-portal-dev.vercel.app
```

## Support

For deployment issues:
- Check Vercel deployment logs
- Review GitHub Actions workflow runs
- Contact Rocket Academy DevOps team

---

**Last Updated**: 2026-02-22
**Maintained By**: Rocket Academy Engineering Team
