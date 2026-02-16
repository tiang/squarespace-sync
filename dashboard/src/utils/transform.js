import { normalizeOrder } from "./skuMap";
import {
  LOCATIONS,
  AGE_BUCKETS,
  HOLIDAY_SKU_IDENTIFIER,
  SKU_TERM_REGEX,
} from "../constants";

// Apply SKU normalization to all orders
export function normalizeOrders(orders) {
  return orders.map(normalizeOrder);
}

// Group and count by a field value
export function countByField(orders, field) {
  const counts = {};
  orders.forEach((order) => {
    const value = order[field] || "Unknown";
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

// Group and sum revenue by a field value
export function revenueByField(orders, field) {
  const totals = {};
  orders.forEach((order) => {
    const value = order[field] || "Unknown";
    totals[value] = (totals[value] || 0) + (order["Total"] || 0);
  });
  return Object.entries(totals)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

// Group orders by month, returning enrollment count and revenue
export function groupByMonth(orders) {
  const months = {};
  orders.forEach((order) => {
    const date = order["Created Date"];
    if (!date) return;
    const month = date.slice(0, 7); // 'YYYY-MM'
    if (!months[month]) months[month] = { month, count: 0, revenue: 0 };
    months[month].count += 1;
    months[month].revenue += order["Total"] || 0;
  });
  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
}

// Bucket students by age group
export function ageBuckets(orders) {
  const buckets = {};
  AGE_BUCKETS.forEach((b) => { buckets[b.label] = 0; });
  buckets["Unknown"] = 0;

  orders.forEach((order) => {
    const age = order["Student Age"];
    if (age == null || age === "") {
      buckets["Unknown"] += 1;
    } else {
      const bucket = AGE_BUCKETS.find((b) => age <= b.max);
      if (bucket) buckets[bucket.label] += 1;
    }
  });
  return Object.entries(buckets)
    .filter(([, count]) => count > 0)
    .map(([label, count]) => ({ label, count }));
}

// Format dollar amount to display string
export function formatDollars(amount) {
  if (amount == null) return "$0";
  return `$${Number(amount).toLocaleString()}`;
}

// Get quarter from ISO date string
export function getQuarter(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return { year, quarter };
}

// Attempt to extract term info from SKU (e.g. 'INTRO-2025-T1')
export function extractTermFromSku(sku) {
  if (!sku) return null;
  const match = sku.match(SKU_TERM_REGEX);
  if (match) return { year: parseInt(match[1]), term: parseInt(match[2]) };
  return null;
}

// Get a display label for the term of an order
export function getTermLabel(order) {
  const skuTerm = extractTermFromSku(order["SKU"]);
  if (skuTerm) return `T${skuTerm.term} ${skuTerm.year}`;
  const q = getQuarter(order["Created Date"]);
  if (q) return `Q${q.quarter} ${q.year}`;
  return "Unknown";
}

// Get available term options from orders
export function getTermOptions(orders) {
  const terms = new Set();
  orders.forEach((order) => terms.add(getTermLabel(order)));
  return Array.from(terms).sort();
}

// Filter orders by term label
export function filterByTerm(orders, termLabel) {
  if (!termLabel) return orders;
  return orders.filter((order) => getTermLabel(order) === termLabel);
}

// Get current quarter's term label
export function getCurrentTermLabel() {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${quarter} ${now.getFullYear()}`;
}

// List all unique SKU + Product Name combinations with counts
export function getSkuSummary(orders) {
  const skus = {};
  orders.forEach((order) => {
    const rawSku = order._rawSku || order["SKU"] || "(empty)";
    const normalizedSku = order["SKU"] || "(empty)";
    const productName = order["Product Name"] || "(empty)";
    const key = rawSku;
    if (!skus[key]) {
      skus[key] = { rawSku, normalizedSku, productName, count: 0 };
    }
    skus[key].count += 1;
  });
  return Object.values(skus).sort((a, b) => b.count - a.count);
}

// Parse shipping address JSON and group revenue by location
export function spendByLocation(orders) {
  const locations = {};
  orders.forEach((order) => {
    let address = order["Shipping Address"];
    if (typeof address === "string") {
      try {
        address = JSON.parse(address);
      } catch {
        return;
      }
    }
    if (!address) return;
    const location =
      [address.city, address.state || address.region].filter(Boolean).join(", ") ||
      address.countryCode ||
      "Unknown";
    if (!locations[location]) locations[location] = { location, total: 0, count: 0 };
    locations[location].total += order["Total"] || 0;
    locations[location].count += 1;
  });
  return Object.values(locations).sort((a, b) => b.total - a.total);
}

// Determine program type from SKU: 'holiday' if SKU contains HP identifier, otherwise 'term'
export function getProgramType(order) {
  const sku = order["SKU"] || "";
  return sku.toUpperCase().includes(HOLIDAY_SKU_IDENTIFIER) ? "holiday" : "term";
}

// Filter orders by program type
export function filterByProgramType(orders, type) {
  return orders.filter((order) => getProgramType(order) === type);
}

// Extract location from Product Name by matching known location names
export function extractLocation(productName) {
  if (!productName) return "Other";
  const lower = productName.toLowerCase();
  for (const loc of LOCATIONS) {
    if (lower.includes(loc.toLowerCase())) return loc;
  }
  return "Other";
}

// Group orders by class (Product Name) for operational view
export function groupByClass(orders) {
  const classes = {};
  orders.forEach((order) => {
    const className = order["Product Name"] || "Unknown";
    if (!classes[className]) {
      classes[className] = {
        className,
        location: extractLocation(className),
        students: [],
        medicalCount: 0,
        photoYes: 0,
        photoNo: 0,
      };
    }
    classes[className].students.push(order);
    if (order["Medical Conditions"]) classes[className].medicalCount += 1;
    if (order["Photo Permission"] === "Yes") classes[className].photoYes += 1;
    if (order["Photo Permission"] === "No") classes[className].photoNo += 1;
  });
  return Object.values(classes).sort((a, b) => b.students.length - a.students.length);
}

// Group classes by location
export function groupClassesByLocation(classes) {
  const byLocation = {};
  classes.forEach((cls) => {
    const loc = cls.location;
    if (!byLocation[loc]) byLocation[loc] = [];
    byLocation[loc].push(cls);
  });
  // Sort locations: known locations first (in order), then "Other"
  const sortedKeys = LOCATIONS.filter((l) => byLocation[l]);
  if (byLocation["Other"]) sortedKeys.push("Other");
  return sortedKeys.map((location) => ({
    location,
    classes: byLocation[location],
    totalStudents: byLocation[location].reduce((s, c) => s + c.students.length, 0),
  }));
}
