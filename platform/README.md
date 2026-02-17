# School Management Platform — Local Development

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose v2)
- `git clone` this repo

## First-time setup

```bash
cp platform/.env.example platform/.env
# Edit .env if needed (default values work for local dev)
```

## Running locally

```bash
# Start everything (GCP emulators + API + web)
make -C platform up

# Or: start only the GCP emulators (run API/web natively)
make -C platform infra
```

## Services

| Service | URL | Description |
|---|---|---|
| Web app | http://localhost:5173 | React frontend (hot-reload) |
| API | http://localhost:3001 | Express backend |
| Firebase Emulator UI | http://localhost:4000 | Inspect Firestore data + auth state |
| Firestore emulator | localhost:8080 | Used internally by API |
| Firebase Auth emulator | localhost:9099 | Used internally by API |
| PostgreSQL | localhost:5432 | Connect with any PG client |
| GCS emulator | http://localhost:4443 | GCS JSON API |

## Common commands

```bash
make -C platform up        # Start full stack
make -C platform infra     # Start emulators only
make -C platform down      # Stop everything
make -C platform logs      # Tail all logs
make -C platform db-reset  # Wipe and recreate PostgreSQL data
make -C platform build     # Rebuild Docker images
```
