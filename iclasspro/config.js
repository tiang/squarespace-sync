require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const config = {
  iclasspro: {
    username: process.env.ICLASSPRO_USERNAME,
    password: process.env.ICLASSPRO_PASSWORD,
    account: process.env.ICLASSPRO_ACCOUNT || "rocketacademy",
  },
};

const required = ["ICLASSPRO_USERNAME", "ICLASSPRO_PASSWORD"];
const missing = required.filter((v) => !process.env[v]);
if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

module.exports = config;
