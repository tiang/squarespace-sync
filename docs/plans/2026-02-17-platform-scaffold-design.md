# Platform Scaffold Design

**Date:** 2026-02-17
**Status:** Approved

## Goal

Bootstrap the classroom management platform with a working local Docker stack: Express + Prisma API, React + Vite admin frontend, and the existing GCP emulator infrastructure (Firebase, PostgreSQL, GCS). A Hello World deploy proves all containers start, interconnect, and are ready for feature development.

## Folder Structure

```
platform/
├── api/
│   ├── Dockerfile             # Multi-stage: dev + prod targets
│   ├── package.json
│   ├── src/
│   │   └── index.js           # Express app, GET /api/health
│   └── prisma/
│       └── schema.prisma      # Minimal datasource + generator, no models yet
├── admin/
│   ├── Dockerfile             # Multi-stage: dev + prod targets
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       └── App.jsx            # Fetches /api/health, renders status
├── docker-compose.infra.yml   # Existing: firebase + postgres + gcs
├── docker-compose.yml         # NEW: include infra + adds api + admin
├── Makefile                   # Updated: make up = full stack
├── .env.example               # Unchanged
└── .env                       # Local secrets (gitignored)
```

## Docker Compose

`docker-compose.yml` uses the Compose `include` directive to pull in `docker-compose.infra.yml`, then declares `api` and `admin` on top. No duplication of infra service definitions.

### New Services

| Service | Port | Depends on |
|---|---|---|
| `api` | 3001 | `postgres` (service_healthy), `firebase` (service_healthy) |
| `admin` | 5173 | `api` |

### Environment Variables (injected by compose, not `.env`)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgres://postgres:<password>@postgres:5432/platform` |
| `FIRESTORE_EMULATOR_HOST` | `firebase:8080` |
| `FIREBASE_AUTH_EMULATOR_HOST` | `firebase:9099` |
| `GCS_API_ENDPOINT` | `http://gcs:4443` |
| `NODE_ENV` | `development` |

### Bind Mounts

Both `api` and `admin` bind-mount their source directories for hot reload. `node_modules` is excluded via an anonymous volume so host and container modules don't conflict.

## Makefile Changes

| Target | Before | After |
|---|---|---|
| `make infra` | Start infra only | Unchanged |
| `make up` | Alias for infra | Start full stack (docker-compose.yml) |
| `make down` | Stop infra | Stop full stack |
| `make logs` | Tail infra logs | Tail all services |
| `make db-reset` | Reset postgres via infra compose | Updated to use docker-compose.yml |

## API

**Tech:** Node.js 20 + Express + Prisma Client

**Single endpoint for Hello World:**

```
GET /api/health
200 → { "status": "ok", "db": "connected", "timestamp": "<ISO>" }
503 → { "status": "error", "db": "disconnected", "error": "<message>" }
```

**Prisma schema** (`prisma/schema.prisma`):
- `datasource db` — PostgreSQL, reads `DATABASE_URL` from env
- `generator client` — `prisma-client-js`
- No models yet — added when first feature is built

**Dockerfile:**
- `dev` stage: `node:20-alpine`, `npm install`, `nodemon src/index.js`
- `prod` stage: prune dev deps, `node src/index.js`

## Admin

**Tech:** React 18 + Vite + plain CSS (no UI library yet)

**Hello World behavior:**
- On mount, fetch `http://localhost:3001/api/health`
- Render status: `Status: ok ✓` / `DB: connected ✓` (or error state)

**Port:** 5173 (exposed by Docker; browser talks directly to `localhost:3001` for API)

**Dockerfile:**
- `dev` stage: `node:20-alpine`, `npm install`, `vite --host` (exposes Vite outside container)
- `prod` stage: `vite build`, serve with `nginx:alpine`

## Decisions

- **`include` over `-f` chaining** — avoids duplicating infra service definitions in `docker-compose.yml`; single source of truth for infra
- **No Redis in scaffold** — added when auth (JWT sessions) is implemented
- **No models in Prisma schema** — keeps the schema minimal until the first feature is designed; `$connect()` in the health endpoint is sufficient to validate DB connectivity
- **`admin` not `web`** — reflects that this portal is staff/admin-facing; parent portal will be a separate app later
