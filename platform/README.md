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
# Start GCP emulators
make -C platform up
```

## Services

| Service | URL | Description |
|---|---|---|
| Firebase Emulator UI | http://localhost:4000 | Inspect Firestore data + auth state |
| Firestore emulator | localhost:8080 | Firestore emulator |
| Firebase Auth emulator | localhost:9099 | Auth emulator |
| PostgreSQL | localhost:5432 | Connect with any PG client |
| GCS emulator | http://localhost:4443 | GCS JSON API |

## Common commands

```bash
make -C platform up        # Start emulators
make -C platform down      # Stop everything
make -C platform logs      # Tail all logs
make -C platform db-reset  # Wipe and recreate PostgreSQL data
```
