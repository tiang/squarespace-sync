require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const axios = require("axios");
const createLogger = require("../createLogger");

const logger = createLogger();

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!API_KEY || !BASE_ID) {
  logger.error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env");
  process.exit(1);
}

const TABLE_NAMES = {
  families: process.env.ICLASSPRO_AIRTABLE_FAMILIES_TABLE || "ICP_Families",
  guardians: process.env.ICLASSPRO_AIRTABLE_GUARDIANS_TABLE || "ICP_Guardians",
  students: process.env.ICLASSPRO_AIRTABLE_STUDENTS_TABLE || "ICP_Students",
  classes: process.env.ICLASSPRO_AIRTABLE_CLASSES_TABLE || "ICP_Classes",
  enrollments: process.env.ICLASSPRO_AIRTABLE_ENROLLMENTS_TABLE || "ICP_Enrollments",
};

const api = axios.create({
  baseURL: "https://api.airtable.com/v0/meta",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

async function getExistingTables() {
  const { data } = await api.get(`/bases/${BASE_ID}/tables`);
  return data.tables;
}

async function createTable(name, fields) {
  const { data } = await api.post(`/bases/${BASE_ID}/tables`, { name, fields });
  return data;
}

// ── Field definitions (primary field must be first) ──────────────────────────

function familiesFields() {
  return [
    { name: "Family ID", type: "singleLineText" },
    { name: "Family Name", type: "singleLineText" },
    { name: "Primary Email", type: "email" },
    { name: "Primary Phone", type: "phoneNumber" },
    { name: "Street", type: "singleLineText" },
    { name: "City", type: "singleLineText" },
    { name: "State", type: "singleLineText" },
    { name: "Zip", type: "singleLineText" },
  ];
}

function classesFields() {
  return [
    { name: "Class ID", type: "singleLineText" },
    { name: "Class Name", type: "singleLineText" },
    { name: "Schedule", type: "multilineText" },
    { name: "Room", type: "singleLineText" },
    { name: "Instructors", type: "singleLineText" },
    { name: "Max Capacity", type: "number", options: { precision: 0 } },
  ];
}

function guardiansFields(familiesTableId) {
  return [
    { name: "Guardian ID", type: "singleLineText" },
    { name: "First Name", type: "singleLineText" },
    { name: "Last Name", type: "singleLineText" },
    { name: "Email", type: "email" },
    { name: "Phone", type: "phoneNumber" },
    { name: "Relationship", type: "singleLineText" },
    { name: "Is Primary", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Family", type: "multipleRecordLinks", options: { linkedTableId: familiesTableId } },
  ];
}

function studentsFields(familiesTableId) {
  return [
    { name: "Student ID", type: "singleLineText" },
    { name: "First Name", type: "singleLineText" },
    { name: "Last Name", type: "singleLineText" },
    { name: "Birth Date", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Gender", type: "singleLineText" },
    { name: "Health Concerns", type: "multilineText" },
    { name: "Family", type: "multipleRecordLinks", options: { linkedTableId: familiesTableId } },
  ];
}

function enrollmentsFields(studentsTableId, classesTableId) {
  return [
    { name: "Enrollment ID", type: "singleLineText" },
    { name: "Enrollment Type", type: "singleLineText" },
    { name: "Start Date", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Drop Date", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Medical", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Allow Image", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Trial", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Waitlist", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Student", type: "multipleRecordLinks", options: { linkedTableId: studentsTableId } },
    { name: "Class", type: "multipleRecordLinks", options: { linkedTableId: classesTableId } },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureTable(existingByName, name, fieldsBuilder) {
  if (existingByName.has(name)) {
    logger.info(`  SKIP     ${name} (already exists, id=${existingByName.get(name).id})`);
    return existingByName.get(name).id;
  }
  const table = await createTable(name, fieldsBuilder());
  logger.info(`  CREATED  ${name} → ${table.id}`);
  return table.id;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  logger.info(`Setting up iClassPro tables in base ${BASE_ID}...`);

  const existing = await getExistingTables();
  const existingByName = new Map(existing.map((t) => [t.name, t]));
  logger.info(`Found ${existing.length} existing table(s) in base`);

  // Step 1: Tables with no linked-record fields
  logger.info("Step 1/3: Base tables (no links)");
  const familiesId = await ensureTable(existingByName, TABLE_NAMES.families, familiesFields);
  const classesId = await ensureTable(existingByName, TABLE_NAMES.classes, classesFields);

  // Step 2: Tables that link to ICP_Families
  logger.info("Step 2/3: Tables linked to Families");
  await ensureTable(existingByName, TABLE_NAMES.guardians, () => guardiansFields(familiesId));
  const studentsId = await ensureTable(existingByName, TABLE_NAMES.students, () => studentsFields(familiesId));

  // Step 3: Enrollments links to both ICP_Students and ICP_Classes
  logger.info("Step 3/3: Enrollments (links to Students + Classes)");
  await ensureTable(existingByName, TABLE_NAMES.enrollments, () => enrollmentsFields(studentsId, classesId));

  logger.info("Done. All 5 tables are ready.");
}

main().catch((err) => {
  const detail = err.response?.data ?? err.message;
  logger.error("Table setup failed:", detail);
  process.exit(1);
});
