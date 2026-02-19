require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const config = {
  iclasspro: {
    account: process.env.ICLASSPRO_ACCOUNT || "rocketacademy",
    username: process.env.ICLASSPRO_USERNAME,
    password: process.env.ICLASSPRO_PASSWORD,
  },
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    familiesTable: process.env.ICLASSPRO_AIRTABLE_FAMILIES_TABLE || "ICP_Families",
    guardiansTable: process.env.ICLASSPRO_AIRTABLE_GUARDIANS_TABLE || "ICP_Guardians",
    studentsTable: process.env.ICLASSPRO_AIRTABLE_STUDENTS_TABLE || "ICP_Students",
    classesTable: process.env.ICLASSPRO_AIRTABLE_CLASSES_TABLE || "ICP_Classes",
    enrollmentsTable: process.env.ICLASSPRO_AIRTABLE_ENROLLMENTS_TABLE || "ICP_Enrollments",
    rosterTable: process.env.ICLASSPRO_AIRTABLE_ROSTER_TABLE || "ICP_Roster",
  },
};

const requiredEnvVars = [
  "ICLASSPRO_USERNAME",
  "ICLASSPRO_PASSWORD",
  "AIRTABLE_API_KEY",
  "AIRTABLE_BASE_ID",
];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

module.exports = config;
