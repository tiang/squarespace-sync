const squarespaceService = require("./services/squarespace");
const airtableService = require("./services/airtable");
const jsonService = require("./services/json");
const googleSheetsService = require("./services/googleSheets");
const config = require("./config");
const winston = require("winston");

// Configure logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

async function syncOrders() {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - config.sync.initialSyncDays);

    logger.info(
      `Starting order sync from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const orders = await squarespaceService.getAllOrders(startDate, endDate);
    logger.info(`Retrieved ${orders.length} orders from Squarespace`);

    // Save orders to JSON file for backup/debugging
    const savedFilename = jsonService.saveToJson(orders, "orders");
    logger.info(`Saved ${orders.length} orders to ${savedFilename}`);

    // Save orders to Google Sheets
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME;

    const sheetData = [["Order ID", "Customer Email", "Total", "Status"]]; // Header row
    const order = orders
    // orders.forEach((order) => {
      sheetData.push([
        order.id,
        order.customerEmail,
      ]);
    // });

    await googleSheetsService.writeData(spreadsheetId, sheetName, sheetData);
    logger.info(`Saved ${orders.length} orders to Google Sheets`);

    // const results = await airtableService.bulkUpsertOrders(orders);

    // const successful = results.filter((r) => r.success).length;
    // const failed = results.filter((r) => !r.success).length;

    // logger.info(
    //   `Sync completed. Successfully synced: ${successful}, Failed: ${failed}`
    // );

    // if (failed > 0) {
    //   const failures = results.filter((r) => !r.success);
    //   logger.error("Failed orders:", { failures });
    // }
  } catch (error) {
    logger.error("Sync failed:", error);
    throw error;
  }
}

// Run initial sync
syncOrders()
  .then(() => {
    // Set up recurring sync if SYNC_INTERVAL_MINUTES is greater than 0
    if (config.sync.intervalMinutes > 0) {
      logger.info(
        `Setting up recurring sync every ${config.sync.intervalMinutes} minutes`
      );
      setInterval(syncOrders, config.sync.intervalMinutes * 60 * 1000);
    }
  })
  .catch((error) => {
    logger.error("Fatal error:", error);
    process.exit(1);
  });
