const squarespaceService = require("./services/squarespace");
const airtableService = require("./services/airtable");
const jsonService = require("./services/json");
const config = require("./config");
const winston = require("winston");
const { expandOrdersByLineItems } = require("./utils/expandOrders");

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

    // Filter orders with order number > orderStart
    let orderStart = 1614;
    filteredOrders = orders.filter(order => Number(order.orderNumber) > orderStart);
    const expandedOrders = expandOrdersByLineItems(filteredOrders);
    logger.info(`Filtered to ${filteredOrders.length} orders with orderNumber > ${orderStart}`);
    logger.info(`Expanded ${filteredOrders.length} orders into ${expandedOrders.length} records (split multi-item orders)`);

    const results = await airtableService.bulkUpsertOrders(expandedOrders);
    // const results = await airtableService.bulkUpsertOrders(filteredOrders);
    // const results = await airtableService.bulkUpsertOrders([orders[0]]);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.info(
      `Sync completed. Successfully synced: ${successful}, Failed: ${failed}`
    );

    if (failed > 0) {
      const failures = results.filter((r) => !r.success);
      logger.error("Failed orders:", { failures });
    }
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
