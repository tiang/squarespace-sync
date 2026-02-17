const IClassProAirtableService = require("../airtable");

// Mock the airtable module
jest.mock("airtable");

// Mock config to avoid env var requirements
jest.mock("../../config", () => ({
  airtable: {
    apiKey: "test-key",
    baseId: "test-base",
    familiesTable: "ICP_Families",
    guardiansTable: "ICP_Guardians",
    studentsTable: "ICP_Students",
    classesTable: "ICP_Classes",
    enrollmentsTable: "ICP_Enrollments",
  },
}));

describe("IClassProAirtableService", () => {
  let service;
  let mockTable;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IClassProAirtableService();

    // Set up mock table
    mockTable = {
      create: jest.fn().mockResolvedValue({ id: "recNEW123", fields: {} }),
      update: jest.fn().mockResolvedValue({ id: "recEXIST456", fields: {} }),
      select: jest.fn().mockReturnValue({
        firstPage: jest.fn().mockResolvedValue([]),
      }),
    };
    service.base = jest.fn().mockReturnValue(mockTable);
  });

  describe("findRecord", () => {
    it("returns null when no record found", async () => {
      const result = await service.findRecord("ICP_Families", "Family ID", "999");
      expect(result).toBeNull();
    });

    it("returns the first record when found", async () => {
      const existingRecord = { id: "recABC", fields: { "Family ID": "254" } };
      mockTable.select.mockReturnValue({
        firstPage: jest.fn().mockResolvedValue([existingRecord]),
      });

      const result = await service.findRecord("ICP_Families", "Family ID", "254");
      expect(result).toEqual(existingRecord);
    });
  });

  describe("upsertRecord", () => {
    it("creates a new record when none exists", async () => {
      mockTable.select.mockReturnValue({
        firstPage: jest.fn().mockResolvedValue([]),
      });

      const result = await service.upsertRecord(
        "ICP_Families", "Family ID", "254", { "Family ID": "254", "Family Name": "Test" }
      );

      expect(mockTable.create).toHaveBeenCalledWith({ "Family ID": "254", "Family Name": "Test" });
      expect(result.id).toBe("recNEW123");
    });

    it("updates an existing record when found", async () => {
      const existingRecord = { id: "recEXIST456", fields: {} };
      mockTable.select.mockReturnValue({
        firstPage: jest.fn().mockResolvedValue([existingRecord]),
      });

      await service.upsertRecord(
        "ICP_Families", "Family ID", "254", { "Family Name": "Updated" }
      );

      expect(mockTable.update).toHaveBeenCalledWith("recEXIST456", { "Family Name": "Updated" });
    });
  });

  describe("syncFromJson", () => {
    it("throws if JSON file does not exist", async () => {
      await expect(
        service.syncFromJson("/nonexistent/path.json")
      ).rejects.toThrow("JSON file not found");
    });
  });
});
