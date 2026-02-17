# Platform Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the platform with a working local Docker stack — Express + Prisma API, React + Vite admin frontend, and existing GCP emulator infrastructure — culminating in a Hello World that proves all containers start and interconnect.

**Architecture:** Modular monolith scaffold inside `platform/`. Full stack compose (`docker-compose.yml`) uses the Compose `include` directive to pull in the existing `docker-compose.infra.yml` (Firebase, PostgreSQL, GCS), then adds `api` and `admin` services on top. Express app is split into `app.js` (testable) and `index.js` (server entry) so supertest can import the app without starting the server.

**Tech Stack:** Node.js 20, Express 4, Prisma 5, React 18, Vite 6, PostgreSQL 16, Docker Compose v2 (include directive)

---

## Task 1: API — project files

**Files:**
- Create: `platform/api/package.json`
- Create: `platform/api/Dockerfile`
- Create: `platform/api/.gitignore`

**Step 1: Create `platform/api/package.json`**

```json
{
  "name": "platform-api",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "jest": {
    "testEnvironment": "node"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.9",
    "prisma": "^5.22.0",
    "supertest": "^7.0.0"
  }
}
```

**Step 2: Create `platform/api/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm install --omit=dev
COPY . .
RUN npx prisma generate
CMD ["npm", "start"]
```

**Step 3: Create `platform/api/.gitignore`**

```
node_modules/
```

**Step 4: Commit**

```bash
git add platform/api/
git commit -m "chore(platform): add api project scaffold"
```

---

## Task 2: API — Prisma schema + DB client

**Files:**
- Create: `platform/api/prisma/schema.prisma`
- Create: `platform/api/src/db.js`

**Step 1: Create `platform/api/prisma/schema.prisma`**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

No models yet. The datasource + generator is all Prisma needs to connect and generate a client.

**Step 2: Create `platform/api/src/db.js`**

```js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
```

**Step 3: Commit**

```bash
git add platform/api/prisma/ platform/api/src/db.js
git commit -m "chore(platform): add Prisma schema and DB client"
```

---

## Task 3: API — health endpoint (TDD)

**Files:**
- Create: `platform/api/src/__tests__/health.test.js`
- Create: `platform/api/src/app.js`
- Create: `platform/api/src/index.js`

**Step 1: Write the failing tests**

Create `platform/api/src/__tests__/health.test.js`:

```js
const request = require('supertest');

jest.mock('../db', () => ({
  $connect: jest.fn().mockResolvedValue(undefined),
}));

const app = require('../app');

describe('GET /api/health', () => {
  it('returns 200 with status ok when DB connects', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 503 when DB connection fails', async () => {
    const prisma = require('../db');
    prisma.$connect.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.db).toBe('disconnected');
  });
});
```

**Step 2: Run tests — expect FAIL**

Run from repo root:
```bash
cd platform/api && npm install && npm test
```

Expected: FAIL — `Cannot find module '../app'`

**Step 3: Create `platform/api/src/app.js`**

```js
const express = require('express');
const prisma = require('./db');

const app = express();

app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      error: err.message,
    });
  }
});

module.exports = app;
```

**Step 4: Create `platform/api/src/index.js`**

```js
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
```

**Step 5: Run tests — expect PASS**

```bash
npm test
```

Expected:
```
PASS src/__tests__/health.test.js
  GET /api/health
    ✓ returns 200 with status ok when DB connects
    ✓ returns 503 when DB connection fails
```

**Step 6: Commit**

```bash
git add platform/api/src/
git commit -m "feat(platform): add API health endpoint"
```

---

## Task 4: Admin — project files

**Files:**
- Create: `platform/admin/package.json`
- Create: `platform/admin/Dockerfile`
- Create: `platform/admin/vite.config.js`
- Create: `platform/admin/index.html`
- Create: `platform/admin/.gitignore`

**Step 1: Create `platform/admin/package.json`**

```json
{
  "name": "platform-admin",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.11"
  }
}
```

**Step 2: Create `platform/admin/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
```

**Step 3: Create `platform/admin/vite.config.js`**

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

**Step 4: Create `platform/admin/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rocket Academy Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 5: Create `platform/admin/.gitignore`**

```
node_modules/
dist/
```

**Step 6: Commit**

```bash
git add platform/admin/
git commit -m "chore(platform): add admin project scaffold"
```

---

## Task 5: Admin — React Hello World

**Files:**
- Create: `platform/admin/src/main.jsx`
- Create: `platform/admin/src/App.jsx`

**Step 1: Create `platform/admin/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 2: Create `platform/admin/src/App.jsx`**

```jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem' }}>
      <h1>Rocket Academy Platform</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {health && (
        <ul>
          <li>Status: {health.status} {health.status === 'ok' ? '✓' : '✗'}</li>
          <li>DB: {health.db} {health.db === 'connected' ? '✓' : '✗'}</li>
          <li>Timestamp: {health.timestamp}</li>
        </ul>
      )}
      {!health && !error && <p>Loading...</p>}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add platform/admin/src/
git commit -m "feat(platform): add admin Hello World React app"
```

---

## Task 6: docker-compose.yml (full stack)

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
      - ./api:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD:-localdev}@postgres:5432/${POSTGRES_DB:-platform}
      FIRESTORE_EMULATOR_HOST: firebase:8080
      FIREBASE_AUTH_EMULATOR_HOST: firebase:9099
      GCS_API_ENDPOINT: http://gcs:4443
    depends_on:
      postgres:
        condition: service_healthy
      firebase:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  admin:
    build:
      context: ./admin
      target: dev
    ports:
      - "5173:5173"
    volumes:
      - ./admin:/app
      - /app/node_modules
    environment:
      VITE_API_URL: http://localhost:3001
    depends_on:
      - api
```

**Why `include` instead of `-f` chaining:** The `include` directive keeps the full stack definition in a single file. Running `docker compose -f docker-compose.yml up` starts everything — no need to remember multiple `-f` flags.

**The `/app/node_modules` anonymous volume trick:** The bind mount `./api:/app` would overwrite the container's `node_modules` (built during Docker image build) with the host's `node_modules` (empty or missing). The anonymous volume `/app/node_modules` takes precedence for that path, preserving the container's `node_modules` including the generated Prisma client.

**Step 2: Commit**

```bash
git add platform/docker-compose.yml
git commit -m "chore(platform): add full stack docker-compose.yml"
```

---

## Task 7: Update Makefile

**Files:**
- Modify: `platform/Makefile`

**Step 1: Replace `platform/Makefile` with**

```makefile
.PHONY: infra up down logs db-reset

ENV_FILE := .env

# Start GCP emulators only (firebase, postgres, gcs)
infra:
	docker compose -f docker-compose.infra.yml --env-file $(ENV_FILE) up -d

# Start full stack (infra + api + admin)
up:
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) up -d

# Stop all containers (keep volumes)
down:
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) down

# Tail logs for all services
logs:
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) logs -f

# Drop postgres data volume and recreate (schema reset)
db-reset:
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) stop postgres
	docker volume rm platform_postgres_data || true
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) up -d postgres
```

Note: `make infra` still exists to start only the GCP emulators (useful when developing the API natively without Docker).

**Step 2: Commit**

```bash
git add platform/Makefile
git commit -m "chore(platform): update Makefile for full stack"
```

---

## Task 8: Smoke test — run the full stack

**Step 1: Start the full stack**

```bash
make -C platform up
```

Docker will build both images on first run (takes 2-3 minutes). Watch for all services to become healthy:

```bash
make -C platform logs
```

Expected (all services healthy):
```
firebase   | ✔  All emulators ready!
postgres   | database system is ready to accept connections
api        | API listening on port 3001
admin      | VITE v6.x.x  ready in xxx ms
admin      | ➜  Local:   http://localhost:5173/
```

**Step 2: Verify the API health endpoint**

```bash
curl http://localhost:3001/api/health
```

Expected:
```json
{"status":"ok","db":"connected","timestamp":"2026-02-17T..."}
```

**Step 3: Verify the admin UI**

Open `http://localhost:5173` in a browser.

Expected:
```
Rocket Academy Platform
• Status: ok ✓
• DB: connected ✓
• Timestamp: 2026-02-17T...
```

**Step 4: If any containers fail to start**

Check logs for the failing service:
```bash
docker compose -f platform/docker-compose.yml logs api
docker compose -f platform/docker-compose.yml logs admin
```

Common issues:
- `prisma generate` fails → check `prisma/schema.prisma` is present in the image (ensure `COPY . .` is after `npm install` in Dockerfile)
- Port conflict → check nothing else is using 3001 or 5173 with `lsof -i :3001`
- Firebase healthcheck timeout → Firebase emulator is slow on first start; increase `start_period` to 60s if needed

**Step 5: Commit any fixes, then final commit**

```bash
git add -A
git commit -m "chore(platform): smoke test full stack - all services healthy"
```

---

## Done

All containers running locally:

| Service | URL |
|---|---|
| Admin (React/Vite) | http://localhost:5173 |
| API (Express) | http://localhost:3001 |
| Firebase UI | http://localhost:4000 |
| PostgreSQL | localhost:5432 |
| GCS emulator | http://localhost:4443 |

Next: implement auth (JWT + bcrypt), then the first feature module.
