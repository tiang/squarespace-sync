const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

// Validate required environment variables
const requiredEnvVars = ['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

module.exports = {
  PORT: process.env.DASHBOARD_PORT || 3001,
  CACHE_TTL_MINUTES: parseInt(process.env.CACHE_TTL_MINUTES || '5', 10),
};
