require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const createLogger = require("../createLogger");
const SyncService = require("../services/sync");
const IClassProAirtableService = require("../services/airtable");

const logger = createLogger();

function formatCount({ succeeded, attempted }) {
  return attempted === succeeded ? String(succeeded) : `${succeeded}/${attempted}`;
}

async function main() {
  // Step 1: Fetch from iClassPro API → save JSON
  logger.info("Step 1/2: Fetching from iClassPro API...");
  const syncService = new SyncService(logger);
  const jsonPath = await syncService.run();
  logger.info(`Step 1/2 complete: saved to ${jsonPath}`);

  // Step 2: Sync JSON → Airtable
  logger.info("Step 2/2: Syncing to Airtable...");
  const airtableService = new IClassProAirtableService(logger);
  const summary = await airtableService.syncFromJson(jsonPath);
  logger.info(
    `Step 2/2 complete: ${formatCount(summary.families)} families, ` +
    `${formatCount(summary.guardians)} guardians, ` +
    `${formatCount(summary.students)} students, ` +
    `${formatCount(summary.classes)} classes, ` +
    `${formatCount(summary.enrollments)} enrollments`
  );
}

main().catch((err) => {
  logger.error("Full sync failed:", err);
  process.exit(1);
});
