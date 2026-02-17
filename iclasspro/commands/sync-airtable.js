require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const fs = require("fs");
const path = require("path");
const createLogger = require("../createLogger");
const IClassProAirtableService = require("../services/airtable");

const logger = createLogger();

function getLatestJsonFile() {
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) {
    throw new Error(`Data directory not found: ${dataDir}. Run 'npm run iclasspro' first.`);
  }

  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.startsWith("iclasspro-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(`No iClassPro JSON files found in ${dataDir}. Run 'npm run iclasspro' first.`);
  }

  return path.join(dataDir, files[0]);
}

function formatCount({ succeeded, attempted }) {
  return attempted === succeeded ? String(succeeded) : `${succeeded}/${attempted}`;
}

async function main() {
  const jsonPath = getLatestJsonFile();
  logger.info(`Syncing to Airtable from: ${jsonPath}`);

  const service = new IClassProAirtableService(logger);
  const summary = await service.syncFromJson(jsonPath);

  logger.info(
    `Airtable sync complete: ${formatCount(summary.families)} families, ` +
    `${formatCount(summary.guardians)} guardians, ` +
    `${formatCount(summary.students)} students, ` +
    `${formatCount(summary.classes)} classes, ` +
    `${formatCount(summary.enrollments)} enrollments`
  );
}

main().catch((err) => {
  logger.error("Airtable sync failed:", err);
  process.exit(1);
});
