require("dotenv").config();

const config = {
  squarespace: {
    apiKey: process.env.SQUARESPACE_API_KEY,
    storeId: process.env.SQUARESPACE_STORE_ID,
  },
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    tableName: process.env.AIRTABLE_TABLE_NAME || "Orders",
  },
  sync: {
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || "60", 10),
    initialSyncDays: parseInt(process.env.INITIAL_SYNC_DAYS || "30", 10),
  },
};

// Validate required configuration
const requiredEnvVars = [
  "SQUARESPACE_API_KEY",
  "SQUARESPACE_STORE_ID",
  "AIRTABLE_API_KEY",
  "AIRTABLE_BASE_ID",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

module.exports = config;
