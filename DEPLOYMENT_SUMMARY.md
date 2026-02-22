# Platform Deployment Summary

## Live Services

| Service | Vercel Project | Production URL |
|---|---|---|
| API | `rocket-api` | https://rocket-api-omega.vercel.app |
| Admin | `admin` | https://admin-coral-theta.vercel.app |
| Parent Portal | `platform-portal-dev` | https://platform-portal-dev.vercel.app |

## Architecture

Three separate Vercel projects, each self-contained in its own subfolder:

```
platform/
  api/             → rocket-api project
  admin/           → admin project (includes admin/ui/)
  parent-portal/   → platform-portal-dev project (includes parent-portal/ui/)
```

Each frontend bundles its own copy of the shared `ui/` library so each Vercel
project deploys from its own subdirectory without requiring parent directory access.

## Environment Variables

### API (`platform/api/`)
| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase Postgres (non-pooling, port 5432) |
| `CORS_ORIGIN` | `https://admin-coral-theta.vercel.app,https://platform-portal-dev.vercel.app` |

### Admin (`platform/admin/`)
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://rocket-api-omega.vercel.app` |

### Parent Portal (`platform/parent-portal/`)
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://rocket-api-omega.vercel.app` |

## Deploying

Each project deploys independently from its own subfolder using the Vercel CLI:

```bash
# API
cd platform/api && vercel --prod

# Admin
cd platform/admin && vercel --prod

# Parent Portal
cd platform/parent-portal && vercel --prod
```

## Database

**Provider:** Supabase Postgres (ap-southeast-2)

```bash
# Run migrations (runs automatically on API deploy via vercel.json buildCommand)
cd platform/api && npx prisma migrate deploy

# Re-seed production data
cd platform/api && npm run db:seed:prod
```

The `db:seed:prod` script pulls production env vars from Vercel, runs the seed,
then deletes the local credentials file automatically.

## Health Check

```bash
curl https://rocket-api-omega.vercel.app/api/health
# → {"status":"ok","db":"connected","timestamp":"..."}
```
