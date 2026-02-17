require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const path = require("path");
const winston = require("winston");
const SyncService = require("../services/sync");
const IClassProAirtableService = require("../services/airtable");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "..", "..", "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "..", "..", "combined.log"),
    }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

async function main() {
  // Step 1: Fetch from iClassPro API → save JSON
  logger.info("Step 1/2: Fetching from iClassPro API...");
  const syncService = new SyncService(logger);
  const jsonPath = await syncService.run();
  logger.info(`Step 1/2 complete: saved to ${jsonPath}`);

  // Step 2: Sync JSON → Airtable
  logger.info("Step 2/2: Syncing to Airtable...");
  const airtableService = new IClassProAirtableService();
  const summary = await airtableService.syncFromJson(jsonPath);
  logger.info(
    `Step 2/2 complete: ${summary.families} families, ${summary.guardians} guardians, ${summary.students} students, ${summary.classes} classes, ${summary.enrollments} enrollments`
  );
}

main().catch((err) => {
  logger.error("Full sync failed:", err);
  process.exit(1);
});
