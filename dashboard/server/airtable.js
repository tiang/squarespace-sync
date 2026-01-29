const Airtable = require("airtable");

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let table;
let cache = null;
let cacheTimestamp = 0;

function getTable() {
  if (!table) {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );
    table = base(process.env.AIRTABLE_TABLE_NAME || "Orders");
  }
  return table;
}

async function getAllRecords({ skipCache = false } = {}) {
  const now = Date.now();
  if (!skipCache && cache && now - cacheTimestamp < CACHE_TTL_MS) {
    return cache;
  }

  const records = await getTable().select().all();
  cache = records.map((record) => ({
    id: record.id,
    ...record.fields,
  }));
  cacheTimestamp = now;
  return cache;
}

function clearCache() {
  cache = null;
  cacheTimestamp = 0;
}

module.exports = { getAllRecords, clearCache };
