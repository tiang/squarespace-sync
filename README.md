# Squarespace to Airtable Order Sync

Monorepo containing two services:
1. **Sync Service** - Synchronizes orders from Squarespace to Airtable
2. **Dashboard** - React-based analytics dashboard for visualizing order data

## Prerequisites

- Node.js 14 or higher
- Squarespace API key and store ID
- Airtable API key and base ID

## Setup

1. Clone this repository
2. Install dependencies for both services:
   ```bash
   npm run install:all
   ```
3. Copy the environment file template:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and fill in your API keys and configuration:

   **Required:**
   - `SQUARESPACE_API_KEY`: Your Squarespace API key
   - `SQUARESPACE_STORE_ID`: Your Squarespace store ID
   - `AIRTABLE_API_KEY`: Your Airtable API key
   - `AIRTABLE_BASE_ID`: Your Airtable base ID

   **Optional:**
   - `AIRTABLE_TABLE_NAME`: Name of the table to sync to (default: "Orders")
   - `SYNC_INTERVAL_MINUTES`: How often to sync (default: 60, set to 0 for one-time sync)
   - `INITIAL_SYNC_DAYS`: How many days of historical orders to sync (default: 30)
   - `DASHBOARD_PORT`: Port for dashboard server (default: 3001)
   - `CACHE_TTL_MINUTES`: Dashboard data cache duration (default: 5)

## Usage

### Sync Service

Run the sync process:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

### Dashboard

Start both dashboard server and frontend:

```bash
npm run dashboard:dev
```

Or start server only (after building):

```bash
npm run dashboard:build
npm run dashboard:start
```

Run dashboard tests:

```bash
cd dashboard && npm test
```

## Project Structure

```
squarespace-sync/
├── sync/              # Sync service (Squarespace → Airtable)
│   ├── src/
│   │   ├── services/  # API clients (Squarespace, Airtable, JSON backup)
│   │   ├── dto/       # Data transformation layer
│   │   └── utils/     # Helper utilities
│   └── __tests__/     # Jest test suite
├── dashboard/         # Analytics dashboard
│   ├── src/           # React frontend
│   │   ├── components/  # UI components (enrollment, finance, operational)
│   │   ├── hooks/       # Custom React hooks
│   │   └── utils/       # Data transformation utilities
│   └── server/        # Express API server
└── .env              # Shared environment configuration
```

## Airtable Schema

The sync process creates/updates records with these fields:

**Core Fields:**
- Order ID (Text)
- Order Number (Text)
- Created Date (Date)
- Modified Date (Date)
- Status (Text)
- Customer Email (Text)
- Total (Number)
- Currency (Text)

**Product Fields:**
- Product Name (Text)
- SKU (Text)
- Quantity (Number)

**Student Information (from custom form fields):**
- Student Name (Text)
- Age (Number)
- Parent Name (Text)
- Parent Phone (Text)
- Medical Conditions (Text)
- Photo Permission (Text)

**Address Information:**
- Shipping Address (Long Text)
- Billing Address (Long Text)

## Dashboard Features

The dashboard provides three main sections:

1. **Enrollment Section**
   - Total student counts
   - Enrollment trends over time
   - Age demographics
   - Student directory with filtering

2. **Operational Section**
   - Class rosters by location
   - Term vs. holiday program filtering
   - Medical conditions tracking
   - SKU normalization audit tool

3. **Finance Section**
   - Revenue overview and trends
   - Geographic spend analysis
   - Detailed order history

## Logging

**Sync Service:**
- `error.log`: Error-level logs only
- `combined.log`: All logs
- Console output

**Dashboard:**
- Server console logs for API requests and errors
