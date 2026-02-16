const winston = require("winston");
const path = require("path");
const SyncService = require("./services/sync");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "..", "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "..", "combined.log"),
    }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

const syncService = new SyncService(logger);

syncService
  .run()
  .then((file) => logger.info(`Sync complete: ${file}`))
  .catch((err) => {
    logger.error("Sync failed:", err);
    process.exit(1);
  });
