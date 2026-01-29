# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Squarespace-to-Airtable order sync for Rocket Academy. Fetches orders from Squarespace's commerce API, transforms them (expanding multi-item orders into individual records), and upserts into Airtable. Designed for tracking course enrollments with custom student data (name, age, parent info, medical conditions, etc.).

## Commands

```bash
npm start        # Run sync (one-time or recurring based on SYNC_INTERVAL_MINUTES)
npm run dev      # Run with nodemon auto-reload
```

No test framework or linter is configured.

## Architecture

**Service Layer + DTO pattern**, all plain JavaScript (no TypeScript, no build step).

- **`src/index.js`** — Entry point. Sets up Winston logger, orchestrates the sync workflow: fetch → backup to JSON → filter → expand multi-item orders → upsert to Airtable. Handles recurring sync scheduling.
- **`src/config.js`** — Loads and validates env vars via dotenv. Throws on missing required keys.
- **`src/dto/OrderDTO.js`** — Transforms between Squarespace order format and Airtable fields. Contains `CUSTOM_FIELD_MAPPING` for normalizing form field labels, plus field-specific logic (phone formatting as `XXXX XXX XXX`, age extraction, photo permission normalization).
- **`src/services/squarespace.js`** — Axios-based client for Squarespace Commerce API v1.0. Handles cursor-based pagination and date range filtering.
- **`src/services/airtable.js`** — Airtable client with upsert logic (find by Order ID, then create or update). Chunks requests into batches of 10 to respect rate limits.
- **`src/services/json.js`** — Saves order data as timestamped JSON files in `data/` for backup/audit.

## Key Details

- Orders with `orderNumber <= 1614` are filtered out (hardcoded threshold in index.js).
- Multi-item orders are expanded: one Airtable record per line item, with Order ID suffixed (e.g., `order-123-0`, `order-123-1`).
- Logs written to `error.log`, `combined.log`, and console via Winston.

## Environment Variables

Required: `SQUARESPACE_API_KEY`, `SQUARESPACE_STORE_ID`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`
Optional: `AIRTABLE_TABLE_NAME` (default: "Orders"), `SYNC_INTERVAL_MINUTES` (default: 60, 0 = one-time), `INITIAL_SYNC_DAYS` (default: 30)

Copy `.env.example` to `.env` to configure.
