# Squarespace to Airtable Order Sync

This application synchronizes orders from Squarespace to Airtable automatically. It can run as a one-time sync or as a recurring service.

## Prerequisites

- Node.js 14 or higher
- Squarespace API key and store ID
- Airtable API key and base ID

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file template:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and fill in your API keys and configuration:
   - `SQUARESPACE_API_KEY`: Your Squarespace API key
   - `SQUARESPACE_STORE_ID`: Your Squarespace store ID
   - `AIRTABLE_API_KEY`: Your Airtable API key
   - `AIRTABLE_BASE_ID`: Your Airtable base ID
   - `AIRTABLE_TABLE_NAME`: Name of the table to sync to (default: "Orders")
   - `SYNC_INTERVAL_MINUTES`: How often to sync (set to 0 for one-time sync)
   - `INITIAL_SYNC_DAYS`: How many days of historical orders to sync

## Usage

Run the sync process:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Airtable Schema

The sync process will create/update records with the following fields:

- Order ID (Text)
- Order Number (Text)
- Created Date (Date)
- Modified Date (Date)
- Status (Text)
- Customer Email (Text)
- Total (Number)
- Currency (Text)
- Items (Long Text)
- Shipping Address (Long Text)
- Billing Address (Long Text)

## Logging

Logs are written to:

- `error.log`: Error-level logs only
- `combined.log`: All logs
- Console: All logs (when running)
