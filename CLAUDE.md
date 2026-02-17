# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo for Rocket Academy data integrations. Contains two main modules:

- **Squarespace sync** (`sync/`) — Fetches orders from Squarespace's commerce API, transforms them (expanding multi-item orders into individual records), and upserts into Airtable. Designed for tracking course enrollments.
- **iClassPro sync** (`iclasspro/`) — Fetches class/student/enrollment data from the iClassPro API and syncs into 5 normalized Airtable tables (families, guardians, students, classes, enrollments). Part of a migration off iClassPro onto a new student management platform.

## Commands

```bash
# Squarespace sync
npm start                   # Run Squarespace sync (one-time or recurring)
npm run dev                 # Run with nodemon auto-reload

# iClassPro sync
npm run iclasspro           # Fetch from iClassPro API → save timestamped JSON to iclasspro/data/
npm run iclasspro:airtable  # Sync latest saved JSON → Airtable (5 tables)
npm run iclasspro:full      # Fetch from API + sync to Airtable in one step

# Testing (Jest, iclasspro module only)
cd iclasspro && npx jest
```

## Architecture

**Service Layer + DTO pattern**, all plain JavaScript (no TypeScript, no build step).

### Squarespace sync (`sync/`)

- **`sync/src/index.js`** — Entry point. Orchestrates: fetch → backup JSON → filter → expand multi-item orders → upsert to Airtable.
- **`sync/src/config.js`** — Loads and validates env vars via dotenv. Throws on missing required keys.
- **`sync/src/dto/OrderDTO.js`** — Transforms Squarespace order format to Airtable fields. Contains `CUSTOM_FIELD_MAPPING` for normalizing form field labels.
- **`sync/src/services/squarespace.js`** — Axios client for Squarespace Commerce API v1.0. Handles cursor-based pagination and date range filtering.
- **`sync/src/services/airtable.js`** — Airtable client with upsert logic. Chunks requests into batches of 10.
- **`sync/src/services/json.js`** — Saves order data as timestamped JSON files in `data/` for backup/audit.

### iClassPro sync (`iclasspro/`)

- **`iclasspro/index.js`** — Entry point for API fetch. Calls iClassPro API → saves timestamped JSON to `iclasspro/data/`.
- **`iclasspro/config.js`** — Loads iClassPro and Airtable env vars.
- **`iclasspro/createLogger.js`** — Shared Winston logger factory used by all commands.
- **`iclasspro/dto/`** — DTOs for each entity: `FamilyDTO`, `GuardianDTO`, `StudentDTO`, `ClassDTO`. Each DTO includes static methods for mapping to Airtable fields.
- **`iclasspro/mapper/IClassProMapper.js`** — Transforms raw iClassPro API response into an array of `StudentDTO` objects (one per roster entry per class).
- **`iclasspro/services/airtable.js`** — `IClassProAirtableService` with `findRecord`, `upsertRecord`, `bulkUpsert`, and `syncFromJson`. Supports logger injection via constructor (`logger = console` default).
- **`iclasspro/services/sync.js`** — `SyncService` that calls the iClassPro API and saves JSON.
- **`iclasspro/commands/sync-airtable.js`** — CLI for JSON → Airtable step only.
- **`iclasspro/commands/sync-full.js`** — CLI for full API fetch + Airtable sync.

## Key Details

### Squarespace sync
- Orders with `orderNumber <= 1614` are filtered out (hardcoded threshold).
- Multi-item orders are expanded: one Airtable record per line item, with Order ID suffixed (e.g., `order-123-0`, `order-123-1`).

### iClassPro sync
- `syncFromJson` returns `{ families, guardians, students, classes, enrollments }` each as `{ succeeded, attempted }`.
- Enrollments are deduplicated by `enrollmentId` before upserting (a student appearing in multiple classes' rosters with the same enrollment is only synced once).
- `bulkUpsert` swallows per-record errors (logs via `this.logger.warn`) so one failure doesn't abort the batch; returns `{ idMap, failed }`.
- Logs written to `error.log`, `combined.log`, and console via Winston.

## Environment Variables

### Squarespace sync
Required: `SQUARESPACE_API_KEY`, `SQUARESPACE_STORE_ID`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`
Optional: `AIRTABLE_TABLE_NAME` (default: "Orders"), `SYNC_INTERVAL_MINUTES` (default: 60, 0 = one-time), `INITIAL_SYNC_DAYS` (default: 30)

### iClassPro sync
Required: `ICLASSPRO_API_KEY`, `ICLASSPRO_BASE_URL`, `ICLASSPRO_USERNAME`, `ICLASSPRO_PASSWORD`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`
Optional (table names): `ICLASSPRO_AIRTABLE_FAMILIES_TABLE`, `ICLASSPRO_AIRTABLE_GUARDIANS_TABLE`, `ICLASSPRO_AIRTABLE_STUDENTS_TABLE`, `ICLASSPRO_AIRTABLE_CLASSES_TABLE`, `ICLASSPRO_AIRTABLE_ENROLLMENTS_TABLE`

Copy `.env.example` to `.env` to configure.

## Workflow Preferences

**Implementation Execution:** Always use **subagent-driven execution** (superpowers:subagent-driven-development) when executing implementation plans. Stay in the current session with fresh subagent per task and code review between tasks for fast iteration and quality gates.
