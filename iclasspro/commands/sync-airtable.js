require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const fs = require("fs");
const path = require("path");
const winston = require("winston");
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

async function main() {
  const jsonPath = getLatestJsonFile();
  logger.info(`Syncing to Airtable from: ${jsonPath}`);

  const service = new IClassProAirtableService();
  const summary = await service.syncFromJson(jsonPath);

  logger.info(
    `Airtable sync complete: ${summary.families} families, ${summary.guardians} guardians, ${summary.students} students, ${summary.classes} classes, ${summary.enrollments} enrollments`
  );
}

main().catch((err) => {
  logger.error("Airtable sync failed:", err);
  process.exit(1);
});
