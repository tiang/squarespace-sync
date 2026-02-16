import { describe, it, expect } from "vitest";
import {
  normalizeOrders,
  countByField,
  revenueByField,
  groupByMonth,
  ageBuckets,
  formatDollars,
  getQuarter,
  extractTermFromSku,
  getTermLabel,
  getTermOptions,
  filterByTerm,
  getCurrentTermLabel,
  getSkuSummary,
  spendByLocation,
  getProgramType,
  filterByProgramType,
  extractLocation,
  groupByClass,
  groupClassesByLocation,
} from "../transform";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeOrder(overrides = {}) {
  return {
    "Product Name": "Intro to Coding - Point Cook",
    SKU: "INTRO-2025-T1",
    "Student Age": 8,
    Total: 200,
    "Created Date": "2025-03-15",
    "Medical Conditions": "",
    "Photo Permission": "Yes",
    "Shipping Address": null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// normalizeOrders
// ---------------------------------------------------------------------------
describe("normalizeOrders", () => {
  it("returns an array of the same length", () => {
    const orders = [makeOrder(), makeOrder()];
    expect(normalizeOrders(orders)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// countByField
// ---------------------------------------------------------------------------
describe("countByField", () => {
  it("counts occurrences and sorts descending", () => {
    const orders = [
      makeOrder({ "Product Name": "A" }),
      makeOrder({ "Product Name": "B" }),
      makeOrder({ "Product Name": "A" }),
    ];
    const result = countByField(orders, "Product Name");
    expect(result[0]).toEqual({ label: "A", count: 2 });
    expect(result[1]).toEqual({ label: "B", count: 1 });
  });

  it("groups missing values as Unknown", () => {
    const orders = [makeOrder({ "Product Name": undefined })];
    const result = countByField(orders, "Product Name");
    expect(result[0].label).toBe("Unknown");
  });
});

// ---------------------------------------------------------------------------
// revenueByField
// ---------------------------------------------------------------------------
describe("revenueByField", () => {
  it("sums revenue by field and sorts descending", () => {
    const orders = [
      makeOrder({ "Product Name": "A", Total: 100 }),
      makeOrder({ "Product Name": "B", Total: 300 }),
      makeOrder({ "Product Name": "A", Total: 150 }),
    ];
    const result = revenueByField(orders, "Product Name");
    expect(result[0]).toEqual({ label: "B", total: 300 });
    expect(result[1]).toEqual({ label: "A", total: 250 });
  });

  it("treats missing Total as 0", () => {
    const orders = [makeOrder({ Total: undefined })];
    const result = revenueByField(orders, "Product Name");
    expect(result[0].total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// groupByMonth
// ---------------------------------------------------------------------------
describe("groupByMonth", () => {
  it("groups orders by YYYY-MM and returns sorted", () => {
    const orders = [
      makeOrder({ "Created Date": "2025-01-10", Total: 100 }),
      makeOrder({ "Created Date": "2025-01-20", Total: 200 }),
      makeOrder({ "Created Date": "2025-03-05", Total: 50 }),
    ];
    const result = groupByMonth(orders);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ month: "2025-01", count: 2, revenue: 300 });
    expect(result[1]).toEqual({ month: "2025-03", count: 1, revenue: 50 });
  });

  it("skips orders with no Created Date", () => {
    const orders = [makeOrder({ "Created Date": undefined })];
    expect(groupByMonth(orders)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// ageBuckets
// ---------------------------------------------------------------------------
describe("ageBuckets", () => {
  it("buckets students into the correct age groups", () => {
    const orders = [
      makeOrder({ "Student Age": 6 }),
      makeOrder({ "Student Age": 9 }),
      makeOrder({ "Student Age": 12 }),
      makeOrder({ "Student Age": 15 }),
    ];
    const result = ageBuckets(orders);
    const map = Object.fromEntries(result.map((r) => [r.label, r.count]));
    expect(map["5-7"]).toBe(1);
    expect(map["8-10"]).toBe(1);
    expect(map["11-13"]).toBe(1);
    expect(map["14+"]).toBe(1);
  });

  it("categorises missing age as Unknown", () => {
    const orders = [makeOrder({ "Student Age": null })];
    const result = ageBuckets(orders);
    expect(result.find((r) => r.label === "Unknown").count).toBe(1);
  });

  it("omits buckets with zero count", () => {
    const orders = [makeOrder({ "Student Age": 6 })];
    const result = ageBuckets(orders);
    expect(result.find((r) => r.label === "14+")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// formatDollars
// ---------------------------------------------------------------------------
describe("formatDollars", () => {
  it("formats a whole number", () => {
    expect(formatDollars(1500)).toBe("$1,500");
  });

  it("returns $0 for null", () => {
    expect(formatDollars(null)).toBe("$0");
  });

  it("returns $0 for undefined", () => {
    expect(formatDollars(undefined)).toBe("$0");
  });
});

// ---------------------------------------------------------------------------
// getQuarter
// ---------------------------------------------------------------------------
describe("getQuarter", () => {
  it("returns year and quarter for a date in Q1", () => {
    expect(getQuarter("2025-02-15")).toEqual({ year: 2025, quarter: 1 });
  });

  it("returns quarter 4 for December", () => {
    expect(getQuarter("2025-12-01")).toEqual({ year: 2025, quarter: 4 });
  });

  it("returns null for falsy input", () => {
    expect(getQuarter(null)).toBeNull();
    expect(getQuarter("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// extractTermFromSku
// ---------------------------------------------------------------------------
describe("extractTermFromSku", () => {
  it("extracts year and term from a valid SKU", () => {
    expect(extractTermFromSku("INTRO-2025-T1")).toEqual({ year: 2025, term: 1 });
  });

  it("is case-insensitive", () => {
    expect(extractTermFromSku("intro-2025-t2")).toEqual({ year: 2025, term: 2 });
  });

  it("returns null when no term pattern is found", () => {
    expect(extractTermFromSku("HP-HOLIDAY-2025")).toBeNull();
  });

  it("returns null for falsy input", () => {
    expect(extractTermFromSku(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getTermLabel
// ---------------------------------------------------------------------------
describe("getTermLabel", () => {
  it("returns term label from SKU when available", () => {
    const order = makeOrder({ SKU: "INTRO-2025-T1" });
    expect(getTermLabel(order)).toBe("T1 2025");
  });

  it("falls back to quarter from Created Date", () => {
    const order = makeOrder({ SKU: "HP-SUMMER", "Created Date": "2025-07-10" });
    expect(getTermLabel(order)).toBe("Q3 2025");
  });

  it("returns Unknown when no SKU or date", () => {
    const order = makeOrder({ SKU: undefined, "Created Date": undefined });
    expect(getTermLabel(order)).toBe("Unknown");
  });
});

// ---------------------------------------------------------------------------
// getTermOptions
// ---------------------------------------------------------------------------
describe("getTermOptions", () => {
  it("returns sorted unique term labels", () => {
    const orders = [
      makeOrder({ SKU: "INTRO-2025-T2" }),
      makeOrder({ SKU: "INTRO-2025-T1" }),
      makeOrder({ SKU: "INTRO-2025-T1" }),
    ];
    expect(getTermOptions(orders)).toEqual(["T1 2025", "T2 2025"]);
  });
});

// ---------------------------------------------------------------------------
// filterByTerm
// ---------------------------------------------------------------------------
describe("filterByTerm", () => {
  it("filters orders matching the given term label", () => {
    const orders = [
      makeOrder({ SKU: "INTRO-2025-T1" }),
      makeOrder({ SKU: "INTRO-2025-T2" }),
    ];
    expect(filterByTerm(orders, "T1 2025")).toHaveLength(1);
  });

  it("returns all orders when termLabel is falsy", () => {
    const orders = [makeOrder(), makeOrder()];
    expect(filterByTerm(orders, null)).toHaveLength(2);
    expect(filterByTerm(orders, "")).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getCurrentTermLabel
// ---------------------------------------------------------------------------
describe("getCurrentTermLabel", () => {
  it("returns a string matching Q<n> <year> format", () => {
    const label = getCurrentTermLabel();
    expect(label).toMatch(/^Q[1-4] \d{4}$/);
  });
});

// ---------------------------------------------------------------------------
// getSkuSummary
// ---------------------------------------------------------------------------
describe("getSkuSummary", () => {
  it("aggregates SKU/Product Name combinations with counts", () => {
    const orders = [
      makeOrder({ SKU: "A", "Product Name": "Alpha" }),
      makeOrder({ SKU: "A", "Product Name": "Alpha" }),
      makeOrder({ SKU: "B", "Product Name": "Beta" }),
    ];
    const result = getSkuSummary(orders);
    expect(result).toHaveLength(2);
    expect(result[0].count).toBe(2); // most common first
  });

  it("uses _rawSku when present", () => {
    const orders = [makeOrder({ _rawSku: "OLD-SKU", SKU: "NEW-SKU" })];
    const result = getSkuSummary(orders);
    expect(result[0].rawSku).toBe("OLD-SKU");
    expect(result[0].normalizedSku).toBe("NEW-SKU");
  });
});

// ---------------------------------------------------------------------------
// spendByLocation
// ---------------------------------------------------------------------------
describe("spendByLocation", () => {
  it("parses JSON address and groups by city, state", () => {
    const orders = [
      makeOrder({
        "Shipping Address": JSON.stringify({ city: "Melbourne", state: "VIC" }),
        Total: 100,
      }),
      makeOrder({
        "Shipping Address": JSON.stringify({ city: "Melbourne", state: "VIC" }),
        Total: 200,
      }),
      makeOrder({
        "Shipping Address": JSON.stringify({ city: "Sydney", state: "NSW" }),
        Total: 50,
      }),
    ];
    const result = spendByLocation(orders);
    expect(result[0]).toEqual({ location: "Melbourne, VIC", total: 300, count: 2 });
    expect(result[1]).toEqual({ location: "Sydney, NSW", total: 50, count: 1 });
  });

  it("accepts pre-parsed address objects", () => {
    const orders = [
      makeOrder({
        "Shipping Address": { city: "Perth", region: "WA" },
        Total: 75,
      }),
    ];
    const result = spendByLocation(orders);
    expect(result[0].location).toBe("Perth, WA");
  });

  it("skips orders with invalid JSON address", () => {
    const orders = [makeOrder({ "Shipping Address": "not-json" })];
    expect(spendByLocation(orders)).toHaveLength(0);
  });

  it("skips orders with no address", () => {
    const orders = [makeOrder({ "Shipping Address": null })];
    expect(spendByLocation(orders)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getProgramType / filterByProgramType
// ---------------------------------------------------------------------------
describe("getProgramType", () => {
  it("returns holiday when SKU contains HP-", () => {
    expect(getProgramType(makeOrder({ SKU: "HP-SUMMER-2025" }))).toBe("holiday");
  });

  it("returns term for a regular SKU", () => {
    expect(getProgramType(makeOrder({ SKU: "INTRO-2025-T1" }))).toBe("term");
  });

  it("returns term when SKU is empty", () => {
    expect(getProgramType(makeOrder({ SKU: "" }))).toBe("term");
  });
});

describe("filterByProgramType", () => {
  it("filters correctly by program type", () => {
    const orders = [
      makeOrder({ SKU: "INTRO-2025-T1" }),
      makeOrder({ SKU: "HP-WINTER-2025" }),
      makeOrder({ SKU: "ADV-2025-T2" }),
    ];
    expect(filterByProgramType(orders, "term")).toHaveLength(2);
    expect(filterByProgramType(orders, "holiday")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// extractLocation
// ---------------------------------------------------------------------------
describe("extractLocation", () => {
  it("extracts known location from product name", () => {
    expect(extractLocation("Intro to Coding - Point Cook")).toBe("Point Cook");
    expect(extractLocation("Advanced - Camberwell")).toBe("Camberwell");
    expect(extractLocation("Robotics Hawthorn")).toBe("Hawthorn");
  });

  it("is case-insensitive", () => {
    expect(extractLocation("intro - point cook")).toBe("Point Cook");
  });

  it("returns Other for unrecognised locations", () => {
    expect(extractLocation("Online Class")).toBe("Other");
  });

  it("returns Other for falsy input", () => {
    expect(extractLocation(null)).toBe("Other");
    expect(extractLocation("")).toBe("Other");
  });
});

// ---------------------------------------------------------------------------
// groupByClass
// ---------------------------------------------------------------------------
describe("groupByClass", () => {
  it("groups orders by Product Name with student counts", () => {
    const orders = [
      makeOrder({ "Product Name": "ClassA" }),
      makeOrder({ "Product Name": "ClassA" }),
      makeOrder({ "Product Name": "ClassB" }),
    ];
    const result = groupByClass(orders);
    expect(result).toHaveLength(2);
    expect(result[0].className).toBe("ClassA");
    expect(result[0].students).toHaveLength(2);
  });

  it("counts medical conditions and photo permissions", () => {
    const orders = [
      makeOrder({ "Product Name": "X", "Medical Conditions": "Asthma", "Photo Permission": "Yes" }),
      makeOrder({ "Product Name": "X", "Medical Conditions": "", "Photo Permission": "No" }),
    ];
    const result = groupByClass(orders);
    expect(result[0].medicalCount).toBe(1);
    expect(result[0].photoYes).toBe(1);
    expect(result[0].photoNo).toBe(1);
  });

  it("sorts by student count descending", () => {
    const orders = [
      makeOrder({ "Product Name": "Small" }),
      makeOrder({ "Product Name": "Big" }),
      makeOrder({ "Product Name": "Big" }),
    ];
    const result = groupByClass(orders);
    expect(result[0].className).toBe("Big");
  });
});

// ---------------------------------------------------------------------------
// groupClassesByLocation
// ---------------------------------------------------------------------------
describe("groupClassesByLocation", () => {
  it("groups classes by location, known locations first", () => {
    const classes = [
      { className: "ClassA", location: "Camberwell", students: [1, 2] },
      { className: "ClassB", location: "Point Cook", students: [3] },
      { className: "ClassC", location: "Other", students: [4] },
    ];
    const result = groupClassesByLocation(classes);
    expect(result[0].location).toBe("Point Cook");
    expect(result[1].location).toBe("Camberwell");
    expect(result[result.length - 1].location).toBe("Other");
  });

  it("computes totalStudents per location", () => {
    const classes = [
      { className: "A", location: "Hawthorn", students: [1, 2, 3] },
      { className: "B", location: "Hawthorn", students: [4] },
    ];
    const result = groupClassesByLocation(classes);
    expect(result[0].totalStudents).toBe(4);
  });
});
