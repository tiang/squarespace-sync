# Docker Infrastructure Design — School Management Platform

**Date:** 2026-02-17
**Status:** Approved

## Overview

Set up Docker infrastructure for the new school management platform, enabling full local development without live GCP credentials. Uses split compose files (Approach C): `docker-compose.infra.yml` for GCP service emulators, and `docker-compose.yml` for the full application stack.

## GCP Services

| GCP Service | Purpose | Local Emulator |
|---|---|---|
| Firestore | Real-time/user data (sessions, notifications) | Firebase Emulator Suite |
| Firebase Auth | Authentication | Firebase Emulator Suite |
| Cloud SQL (PostgreSQL) | Structured records (students, enrollments, classes) | `postgres:16-alpine` |
| Cloud Storage (GCS) | File storage (exports, uploads, documents) | `fsouza/fake-gcs-server` |

## Repository Structure

```
squarespace-sync/
├── platform/
│   ├── docker-compose.infra.yml     # GCP emulators only
│   ├── docker-compose.yml           # Full stack (includes infra)
│   ├── Makefile                     # Developer shortcuts
│   ├── .env.example                 # All env vars documented
│   ├── .env                         # Local secrets (gitignored)
│   ├── api/
│   │   ├── Dockerfile               # Multi-stage: dev + prod
│   │   └── (Express backend source)
│   └── web/
│       ├── Dockerfile               # Multi-stage: dev + prod
│       └── (React frontend source)
├── iclasspro/
├── sync/
└── ...
```

## Infrastructure Services (`docker-compose.infra.yml`)

| Service | Image | Local Port(s) | Emulates |
|---|---|---|---|
| `firebase` | Firebase Emulator Suite (google-cloud-cli) | 8080 (Firestore), 9099 (Auth), 4000 (UI) | Firestore + Firebase Auth |
| `postgres` | `postgres:16-alpine` | 5432 | Cloud SQL (PostgreSQL) |
| `gcs` | `fsouza/fake-gcs-server` | 4443 | Cloud Storage (GCS) |

- Each service has a healthcheck so dependent app containers wait until ready.
- Named Docker volumes persist data across restarts.
- Firebase Emulator UI at `http://localhost:4000` for inspecting Firestore data and auth state.

## Application Services (`docker-compose.yml`)

| Service | Build context | Port | Notes |
|---|---|---|---|
| `api` | `platform/api/` | 3001 | Express backend, hot-reload via nodemon |
| `web` | `platform/web/` | 5173 | React (Vite) dev server, hot-reload via bind mount |

- Both services `depends_on` infra services with `condition: service_healthy`.
- Emulator connection strings injected as env vars (hardcoded in compose, never in `.env`):
  - `FIRESTORE_EMULATOR_HOST=firebase:8080`
  - `FIREBASE_AUTH_EMULATOR_HOST=firebase:9099`
  - `GCS_API_ENDPOINT=http://gcs:4443`
  - `DATABASE_URL=postgres://postgres:<password>@postgres:5432/platform`
- Source directories bind-mounted for hot reload without image rebuilds.
- Dockerfiles are multi-stage (`dev` target used locally, `prod` target for Cloud Run).

## Developer Workflow

```bash
# First-time setup
cp platform/.env.example platform/.env
# edit .env with local secrets (postgres password, etc.)

# Start emulators only (for native Node development)
make infra

# Start full stack
make up

# Other commands
make down        # Stop all containers
make logs        # Tail all logs
make db-reset    # Drop and recreate postgres schema
```

## Decisions & Rationale

- **Split compose files over profiles** — explicit separation makes it unambiguous what you're running; no risk of forgetting a flag.
- **Firebase Emulator Suite for Firestore + Auth** — single container handles both, includes a useful local UI.
- **fake-gcs-server for GCS** — speaks the full GCS JSON API; compatible with `@google-cloud/storage` SDK via endpoint override.
- **Multi-stage Dockerfiles** — same Dockerfile works for local dev and production Cloud Run deployment; no separate prod Dockerfiles to maintain.
- **Makefile shortcuts** — removes need to remember `-f docker-compose.infra.yml` flags for new contributors.
