// Prevent dotenv from loading .env during tests
jest.mock("dotenv", () => ({ config: jest.fn() }));

describe("config", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    // Clear all required vars to start clean
    delete process.env.SQUARESPACE_API_KEY;
    delete process.env.SQUARESPACE_STORE_ID;
    delete process.env.AIRTABLE_API_KEY;
    delete process.env.AIRTABLE_BASE_ID;
    delete process.env.AIRTABLE_TABLE_NAME;
    delete process.env.SYNC_INTERVAL_MINUTES;
    delete process.env.INITIAL_SYNC_DAYS;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function setAllRequiredEnvVars() {
    process.env.SQUARESPACE_API_KEY = "test-sq-key";
    process.env.SQUARESPACE_STORE_ID = "test-store-id";
    process.env.AIRTABLE_API_KEY = "test-at-key";
    process.env.AIRTABLE_BASE_ID = "test-base-id";
  }

  test("throws when SQUARESPACE_API_KEY is missing", () => {
    process.env.SQUARESPACE_STORE_ID = "x";
    process.env.AIRTABLE_API_KEY = "x";
    process.env.AIRTABLE_BASE_ID = "x";
    expect(() => require("../config")).toThrow("SQUARESPACE_API_KEY");
  });

  test("throws listing all missing vars when none are set", () => {
    try {
      require("../config");
      throw new Error("Should have thrown");
    } catch (e) {
      expect(e.message).toContain("SQUARESPACE_API_KEY");
      expect(e.message).toContain("SQUARESPACE_STORE_ID");
      expect(e.message).toContain("AIRTABLE_API_KEY");
      expect(e.message).toContain("AIRTABLE_BASE_ID");
    }
  });

  test("loads successfully when all required vars are set", () => {
    setAllRequiredEnvVars();
    const config = require("../config");
    expect(config.squarespace.apiKey).toBe("test-sq-key");
    expect(config.squarespace.storeId).toBe("test-store-id");
    expect(config.airtable.apiKey).toBe("test-at-key");
    expect(config.airtable.baseId).toBe("test-base-id");
  });

  test('defaults tableName to "Orders"', () => {
    setAllRequiredEnvVars();
    const config = require("../config");
    expect(config.airtable.tableName).toBe("Orders");
  });

  test("reads custom tableName from env", () => {
    setAllRequiredEnvVars();
    process.env.AIRTABLE_TABLE_NAME = "CustomTable";
    const config = require("../config");
    expect(config.airtable.tableName).toBe("CustomTable");
  });

  test("defaults intervalMinutes to 60", () => {
    setAllRequiredEnvVars();
    const config = require("../config");
    expect(config.sync.intervalMinutes).toBe(60);
  });

  test("parses SYNC_INTERVAL_MINUTES as integer", () => {
    setAllRequiredEnvVars();
    process.env.SYNC_INTERVAL_MINUTES = "15";
    const config = require("../config");
    expect(config.sync.intervalMinutes).toBe(15);
  });

  test("defaults initialSyncDays to 30", () => {
    setAllRequiredEnvVars();
    const config = require("../config");
    expect(config.sync.initialSyncDays).toBe(30);
  });

  test("parses INITIAL_SYNC_DAYS as integer", () => {
    setAllRequiredEnvVars();
    process.env.INITIAL_SYNC_DAYS = "7";
    const config = require("../config");
    expect(config.sync.initialSyncDays).toBe(7);
  });
});
