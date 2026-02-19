# Docker Infrastructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a split-compose Docker infrastructure for local development of the school management platform, emulating Firestore, Firebase Auth, PostgreSQL, and GCS locally.

**Architecture:** `docker-compose.infra.yml` defines the three GCP emulator services (Firebase Emulator Suite, PostgreSQL, fake-gcs-server). `docker-compose.yml` uses Docker Compose `include` to pull in the infra services and adds the `api` and `web` application services. A `Makefile` provides `make infra` and `make up` shortcuts. Minimal stub apps let both app containers build and start successfully from day one.

**Tech Stack:** Docker Compose v2, Firebase Emulator Suite (google-cloud-cli image), postgres:16-alpine, fsouza/fake-gcs-server, Node.js 20 + Express (api), Node.js 20 + Vite + React (web)

---

### Task 1: Platform directory skeleton + .env.example

**Files:**
- Create: `platform/.env.example`
- Create: `platform/.gitignore`

**Step 1: Create `platform/.env.example`**

```
# PostgreSQL
POSTGRES_DB=platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=localdev

# GCP Project (used by emulators)
GCLOUD_PROJECT=rocket-academy-local

# These are set in compose files directly (not secrets):
# FIRESTORE_EMULATOR_HOST=firebase:8080
# FIREBASE_AUTH_EMULATOR_HOST=firebase:9099
# GCS_API_ENDPOINT=http://gcs:4443
# DATABASE_URL=postgres://postgres:localdev@postgres:5432/platform
```

**Step 2: Create `platform/.gitignore`**

```
.env
```

**Step 3: Commit**

```bash
git add platform/.env.example platform/.gitignore
git commit -m "chore(platform): add directory skeleton and .env.example"
```

---

### Task 2: Firebase Emulator configuration files

The Firebase Emulator Suite container needs a `firebase.json` config file to know which emulators to start, and a `.firebaserc` for project binding.

**Files:**
- Create: `platform/firebase.json`
- Create: `platform/.firebaserc`

**Step 1: Create `platform/firebase.json`**

```json
{
  "emulators": {
    "auth": {
      "host": "0.0.0.0",
      "port": 9099
    },
    "firestore": {
      "host": "0.0.0.0",
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

**Step 2: Create `platform/.firebaserc`**

```json
{
  "projects": {
    "default": "rocket-academy-local"
  }
}
```

**Step 3: Commit**

```bash
git add platform/firebase.json platform/.firebaserc
git commit -m "chore(platform): add Firebase Emulator Suite configuration"
```

---

### Task 3: `docker-compose.infra.yml` — GCP emulator services

**Files:**
- Create: `platform/docker-compose.infra.yml`

**Step 1: Create `platform/docker-compose.infra.yml`**

```yaml
services:
  firebase:
    image: gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators
    command: >
      bash -c "
        gcloud emulators firestore start --host-port=0.0.0.0:8080 &
        firebase emulators:start --only auth,firestore,ui
          --project rocket-academy-local
      "
    ports:
      - "4000:4000"   # Emulator UI
      - "8080:8080"   # Firestore
      - "9099:9099"   # Auth
    volumes:
      - ./firebase.json:/root/firebase.json:ro
      - ./.firebaserc:/root/.firebaserc:ro
      - firebase_data:/root/.config/firebase/emulators
    working_dir: /root
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000"]
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 30s

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-platform}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-localdev}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-platform}"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

  gcs:
    image: fsouza/fake-gcs-server:latest
    command: ["-scheme", "http", "-port", "4443", "-external-url", "http://localhost:4443"]
    ports:
      - "4443:4443"
    volumes:
      - gcs_data:/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4443/storage/v1/b"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 5s

volumes:
  firebase_data:
  postgres_data:
  gcs_data:
```

**Step 2: Copy .env.example and test infra starts**

```bash
cp platform/.env.example platform/.env
docker compose -f platform/docker-compose.infra.yml --env-file platform/.env up -d
```

Expected: all three services start. Check health:

```bash
docker compose -f platform/docker-compose.infra.yml ps
```

Expected output shows `STATUS` as `healthy` for `firebase`, `postgres`, `gcs` (firebase may take up to 60s).

Verify Firestore emulator UI is reachable:
```bash
curl -s http://localhost:4000 | head -5
```
Expected: HTML response (the emulator UI).

Verify PostgreSQL is ready:
```bash
docker compose -f platform/docker-compose.infra.yml exec postgres pg_isready -U postgres
```
Expected: `localhost:5432 - accepting connections`

Verify GCS emulator:
```bash
curl -s http://localhost:4443/storage/v1/b
```
Expected: `{"kind":"storage#buckets","items":[]}`

**Step 3: Tear down**

```bash
docker compose -f platform/docker-compose.infra.yml down
```

**Step 4: Commit**

```bash
git add platform/docker-compose.infra.yml
git commit -m "feat(platform): add docker-compose.infra.yml with Firebase, PostgreSQL, GCS emulators"
```

---

### Task 4: Minimal Express API stub + Dockerfile

This gives `docker-compose.yml` a real image to build. The API stub returns a health endpoint — it will be replaced with real application code later.

**Files:**
- Create: `platform/api/package.json`
- Create: `platform/api/src/index.js`
- Create: `platform/api/Dockerfile`
- Create: `platform/api/.dockerignore`

**Step 1: Create `platform/api/package.json`**

```json
{
  "name": "platform-api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.19.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

**Step 2: Create `platform/api/src/index.js`**

```js
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'platform-api' });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
```

**Step 3: Create `platform/api/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm install --omit=dev
COPY . .
CMD ["npm", "start"]
```

**Step 4: Create `platform/api/.dockerignore`**

```
node_modules
npm-debug.log
```

**Step 5: Verify the image builds locally**

```bash
docker build --target dev -t platform-api:dev platform/api/
```

Expected: build succeeds, no errors.

**Step 6: Commit**

```bash
git add platform/api/
git commit -m "feat(platform): add minimal Express API stub with multi-stage Dockerfile"
```

---

### Task 5: Minimal React/Vite web stub + Dockerfile

**Files:**
- Create: `platform/web/package.json`
- Create: `platform/web/index.html`
- Create: `platform/web/src/main.jsx`
- Create: `platform/web/src/App.jsx`
- Create: `platform/web/vite.config.js`
- Create: `platform/web/Dockerfile`
- Create: `platform/web/.dockerignore`

**Step 1: Create `platform/web/package.json`**

```json
{
  "name": "platform-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0"
  }
}
```

**Step 2: Create `platform/web/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
```

**Step 3: Create `platform/web/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rocket Academy Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 4: Create `platform/web/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 5: Create `platform/web/src/App.jsx`**

```jsx
export default function App() {
  return <h1>Rocket Academy Platform</h1>;
}
```

**Step 6: Create `platform/web/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS prod-build
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=prod-build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Step 7: Create `platform/web/.dockerignore`**

```
node_modules
dist
npm-debug.log
```

**Step 8: Verify the image builds**

```bash
docker build --target dev -t platform-web:dev platform/web/
```

Expected: build succeeds.

**Step 9: Commit**

```bash
git add platform/web/
git commit -m "feat(platform): add minimal React/Vite web stub with multi-stage Dockerfile"
```

---

### Task 6: `docker-compose.yml` — full application stack

**Files:**
- Create: `platform/docker-compose.yml`

**Step 1: Create `platform/docker-compose.yml`**

```yaml
include:
  - docker-compose.infra.yml

services:
  api:
    build:
      context: ./api
      target: dev
    ports:
      - "3001:3001"
    volumes:
      - ./api/src:/app/src
    environment:
      PORT: 3001
      DATABASE_URL: postgres://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-localdev}@postgres:5432/${POSTGRES_DB:-platform}
      FIRESTORE_EMULATOR_HOST: firebase:8080
      FIREBASE_AUTH_EMULATOR_HOST: firebase:9099
      GCS_API_ENDPOINT: http://gcs:4443
      GCLOUD_PROJECT: ${GCLOUD_PROJECT:-rocket-academy-local}
    depends_on:
      firebase:
        condition: service_healthy
      postgres:
        condition: service_healthy
      gcs:
        condition: service_healthy

  web:
    build:
      context: ./web
      target: dev
    ports:
      - "5173:5173"
    volumes:
      - ./web/src:/app/src
      - ./web/index.html:/app/index.html
    environment:
      VITE_API_URL: http://localhost:3001
    depends_on:
      - api
```

**Step 2: Verify the full stack starts**

From the `platform/` directory:

```bash
docker compose --env-file .env up -d
```

Expected: 5 services start — `firebase`, `postgres`, `gcs`, `api`, `web`.

Check all are running:

```bash
docker compose --env-file .env ps
```

Check API health endpoint:
```bash
curl -s http://localhost:3001/health
```
Expected: `{"status":"ok","service":"platform-api"}`

Check web app loads:
```bash
curl -s http://localhost:5173 | grep "Rocket Academy"
```
Expected: HTML containing "Rocket Academy Platform"

**Step 3: Tear down**

```bash
docker compose --env-file .env down
```

**Step 4: Commit**

```bash
git add platform/docker-compose.yml
git commit -m "feat(platform): add docker-compose.yml for full application stack"
```

---

### Task 7: Makefile

**Files:**
- Create: `platform/Makefile`

**Step 1: Create `platform/Makefile`**

```makefile
.PHONY: infra up down logs db-reset build

ENV_FILE := .env

# Start GCP emulators only (firebase, postgres, gcs)
infra:
	docker compose -f docker-compose.infra.yml --env-file $(ENV_FILE) up -d

# Start full stack (infra + api + web)
up:
	docker compose --env-file $(ENV_FILE) up -d

# Stop all containers (keep volumes)
down:
	docker compose --env-file $(ENV_FILE) down

# Tail logs for all services
logs:
	docker compose --env-file $(ENV_FILE) logs -f

# Drop postgres data volume and recreate (schema reset)
db-reset:
	docker compose --env-file $(ENV_FILE) stop postgres
	docker volume rm platform_postgres_data || true
	docker compose --env-file $(ENV_FILE) up -d postgres

# Rebuild all images (after Dockerfile changes)
build:
	docker compose --env-file $(ENV_FILE) build
```

**Step 2: Verify Makefile shortcuts work**

```bash
cd platform && make up
```
Expected: 5 services start.

```bash
cd platform && make down
```
Expected: all containers stop.

```bash
cd platform && make infra
```
Expected: only `firebase`, `postgres`, `gcs` start.

```bash
cd platform && make down
```

**Step 3: Commit**

```bash
git add platform/Makefile
git commit -m "chore(platform): add Makefile with infra/up/down/logs/db-reset shortcuts"
```

---

### Task 8: README for platform/

**Files:**
- Create: `platform/README.md`

**Step 1: Create `platform/README.md`**

```markdown
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
```

**Step 2: Commit**

```bash
git add platform/README.md
git commit -m "docs(platform): add local development README"
```

---

### Task 9: Final end-to-end smoke test

**Step 1: Clean start from scratch**

```bash
cd platform
make down
docker volume prune -f    # Remove any stale volumes
make up
```

**Step 2: Wait for all services to be healthy**

```bash
docker compose --env-file .env ps
```

Expected: all 5 services show `healthy` or `running`.

**Step 3: Verify each service**

```bash
# API health
curl -s http://localhost:3001/health
# Expected: {"status":"ok","service":"platform-api"}

# Web app
curl -s http://localhost:5173 | grep -c "Rocket Academy"
# Expected: 1

# Firebase Emulator UI
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000
# Expected: 200

# GCS emulator
curl -s http://localhost:4443/storage/v1/b
# Expected: {"kind":"storage#buckets","items":[]}

# PostgreSQL
docker compose --env-file .env exec postgres pg_isready -U postgres
# Expected: localhost:5432 - accepting connections
```

**Step 4: Final commit**

If any tweaks were needed during smoke test, commit them:

```bash
git add -A
git commit -m "chore(platform): smoke test fixes"
```
