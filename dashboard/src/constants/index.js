// Class locations — add new locations here as needed
export const LOCATIONS = ["Point Cook", "Camberwell", "Hawthorn"];

// Age group buckets for enrollment charts
export const AGE_BUCKETS = [
  { label: "5-7", max: 7 },
  { label: "8-10", max: 10 },
  { label: "11-13", max: 13 },
  { label: "14+", max: Infinity },
];

// SKU pattern for holiday programs
export const HOLIDAY_SKU_IDENTIFIER = "HP-";

// Regex to extract term info from SKU (e.g. 'INTRO-2025-T1')
export const SKU_TERM_REGEX = /(\d{4})-T(\d)/i;

// Dashboard navigation tabs
export const DASHBOARD_TABS = [
  { key: "enrollment", label: "Enrollment" },
  { key: "operational", label: "Operational" },
  { key: "finance", label: "Finance" },
];

// Operational sub-tabs
export const PROGRAM_TABS = [
  { key: "term", label: "Term Programs" },
  { key: "holiday", label: "Holiday Programs" },
];

// Chart color palette
export const COLORS = {
  primary: "#4361ee",
  purple: "#7209b7",
  pink: "#f72585",
  teal: "#2ec4b6",
  orange: "#e76f51",
};

// Geographic spend display limit
export const TOP_LOCATIONS_LIMIT = 15;
