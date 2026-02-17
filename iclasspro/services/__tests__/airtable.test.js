const fs = require("fs");
const os = require("os");
const path = require("path");
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
    rosterTable: "ICP_Roster",
  },
}));

function makeStudent(overrides = {}) {
  return {
    studentId: 10,
    enrollmentId: 99,
    firstName: "Alice",
    lastName: "Test",
    age: "7y",
    gender: "F",
    enrollmentType: "ACTIVE",
    startDate: "2026-01-01",
    dropDate: null,
    familyName: "Test Family",
    familyId: 1,
    birthDate: "2019-01-01",
    healthConcerns: null,
    flags: { medical: false, allowImage: true, trial: false, waitlist: false, makeup: false },
    family: {
      familyId: 1,
      familyName: "Test Family",
      primaryEmail: "test@example.com",
      primaryPhone: "0412345678",
      guardians: [],
      address: null,
    },
    ...overrides,
  };
}

function makeFixture(classes) {
  return {
    syncedAt: "2026-02-17T00:00:00.000Z",
    classes: classes || [
      {
        id: 31,
        name: "Test Class",
        durationSchedule: {},
        room: "",
        instructors: [],
        occupancy: { max: 10 },
        roster: [makeStudent()],
      },
    ],
  };
}

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

    it("escapes single quotes in the filter formula", async () => {
      await service.findRecord("ICP_Families", "Family Name", "O'Brien");

      expect(mockTable.select).toHaveBeenCalledWith(
        expect.objectContaining({
          filterByFormula: "{Family Name} = 'O\\'Brien'",
        })
      );
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

  describe("bulkUpsert", () => {
    it("calls logger.warn and counts failures when an upsert throws", async () => {
      const mockLogger = { warn: jest.fn() };
      const serviceWithLogger = new IClassProAirtableService(mockLogger);
      serviceWithLogger.base = jest.fn().mockReturnValue(mockTable);

      // First item fails, second succeeds
      mockTable.create
        .mockRejectedValueOnce(new Error("API limit exceeded"))
        .mockResolvedValue({ id: "recOK", fields: {} });

      const result = await serviceWithLogger.bulkUpsert(
        "ICP_Families",
        [{ id: 1 }, { id: 2 }],
        (item) => ({ keyField: "ID", keyValue: String(item.id), fields: { ID: String(item.id) } }),
        (item) => item.id
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to upsert record in ICP_Families")
      );
      expect(result.idMap.size).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe("syncFromJson", () => {
    let tmpFile;

    beforeEach(() => {
      tmpFile = path.join(os.tmpdir(), `iclasspro-test-${Date.now()}.json`);
    });

    afterEach(() => {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    it("throws if JSON file does not exist", async () => {
      await expect(
        service.syncFromJson("/nonexistent/path.json")
      ).rejects.toThrow("JSON file not found");
    });

    it("returns { succeeded, attempted } per table on successful sync", async () => {
      fs.writeFileSync(tmpFile, JSON.stringify(makeFixture()));

      const summary = await service.syncFromJson(tmpFile);

      expect(summary.families).toEqual({ succeeded: 1, attempted: 1 });
      expect(summary.students).toEqual({ succeeded: 1, attempted: 1 });
      expect(summary.classes).toEqual({ succeeded: 1, attempted: 1 });
      expect(summary.enrollments).toEqual({ succeeded: 1, attempted: 1 });
      expect(summary.roster).toEqual({ succeeded: 1, attempted: 1 });
    });

    it("counts failed upserts in attempted but not succeeded", async () => {
      fs.writeFileSync(tmpFile, JSON.stringify(makeFixture()));

      // First create (family) fails; all others succeed
      mockTable.create
        .mockRejectedValueOnce(new Error("Quota exceeded"))
        .mockResolvedValue({ id: "recOK", fields: {} });

      const summary = await service.syncFromJson(tmpFile);

      expect(summary.families).toEqual({ succeeded: 0, attempted: 1 });
      expect(summary.students.succeeded).toBe(1); // student still upserts
    });

    it("deduplicates enrollments when the same enrollmentId appears across classes", async () => {
      const student = makeStudent();
      const fixture = makeFixture([
        { id: 31, name: "Class A", durationSchedule: {}, room: "", instructors: [], occupancy: { max: 10 }, roster: [student] },
        { id: 32, name: "Class B", durationSchedule: {}, room: "", instructors: [], occupancy: { max: 10 }, roster: [student] },
      ]);
      fs.writeFileSync(tmpFile, JSON.stringify(fixture));

      const summary = await service.syncFromJson(tmpFile);

      // 1 family, 1 student, 2 classes, 1 enrollment (deduped from 2 roster entries)
      expect(summary.families).toEqual({ succeeded: 1, attempted: 1 });
      expect(summary.classes).toEqual({ succeeded: 2, attempted: 2 });
      expect(summary.enrollments).toEqual({ succeeded: 1, attempted: 1 });
      expect(summary.roster).toEqual({ succeeded: 1, attempted: 1 });
    });
  });
});
