require("dotenv").config();

const config = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    familiesTable: process.env.ICLASSPRO_AIRTABLE_FAMILIES_TABLE || "ICP_Families",
    guardiansTable: process.env.ICLASSPRO_AIRTABLE_GUARDIANS_TABLE || "ICP_Guardians",
    studentsTable: process.env.ICLASSPRO_AIRTABLE_STUDENTS_TABLE || "ICP_Students",
    classesTable: process.env.ICLASSPRO_AIRTABLE_CLASSES_TABLE || "ICP_Classes",
    enrollmentsTable: process.env.ICLASSPRO_AIRTABLE_ENROLLMENTS_TABLE || "ICP_Enrollments",
  },
};

const requiredEnvVars = ["AIRTABLE_API_KEY", "AIRTABLE_BASE_ID"];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

module.exports = config;
