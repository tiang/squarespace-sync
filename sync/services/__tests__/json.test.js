jest.mock("fs");
const fs = require("fs");
const path = require("path");

// Must require AFTER mocking fs so the constructor's
// ensureDataDirectoryExists() uses the mock
fs.existsSync.mockReturnValue(false);
fs.mkdirSync.mockImplementation(() => {});
const jsonService = require("../json");

describe("JsonService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateTimestampedFilename", () => {
    test("includes prefix in filename", () => {
      const filename = jsonService.generateTimestampedFilename("orders");
      expect(path.basename(filename)).toMatch(/^orders-/);
    });

    test("ends with .json extension", () => {
      const filename = jsonService.generateTimestampedFilename("test");
      expect(filename).toMatch(/\.json$/);
    });

    test("replaces colons and dots in timestamp", () => {
      const filename = jsonService.generateTimestampedFilename("test");
      const basename = path.basename(filename, ".json");
      // The timestamp portion (without .json) should have no colons or dots
      expect(basename).not.toMatch(/[:.]/);
    });
  });

  describe("saveToJson", () => {
    test("writes JSON with 2-space indent", () => {
      fs.writeFileSync.mockImplementation(() => {});

      const data = [{ id: 1 }];
      jsonService.saveToJson(data, "orders");

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      const [, content] = fs.writeFileSync.mock.calls[0];
      expect(content).toBe(JSON.stringify(data, null, 2));
    });

    test("returns the filename path", () => {
      fs.writeFileSync.mockImplementation(() => {});

      const filename = jsonService.saveToJson({ x: 1 }, "orders");
      expect(filename).toMatch(/orders-.*\.json$/);
    });

    test('uses "data" as default prefix', () => {
      fs.writeFileSync.mockImplementation(() => {});

      const filename = jsonService.saveToJson({ x: 1 });
      expect(path.basename(filename)).toMatch(/^data-/);
    });
  });

  describe("readFromJson", () => {
    test("reads and parses JSON file", () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{"key":"value"}');

      const result = jsonService.readFromJson("test.json");
      expect(result).toEqual({ key: "value" });
    });

    test("throws when file does not exist", () => {
      fs.existsSync.mockReturnValue(false);

      expect(() => jsonService.readFromJson("missing.json")).toThrow(
        "File not found"
      );
    });

    test("reads file as utf8", () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue("[]");

      jsonService.readFromJson("test.json");
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.any(String),
        "utf8"
      );
    });
  });

  describe("ensureDataDirectoryExists", () => {
    test("creates directory when it does not exist", () => {
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});

      jsonService.ensureDataDirectoryExists();

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
    });

    test("does not create directory when it exists", () => {
      fs.existsSync.mockReturnValue(true);

      jsonService.ensureDataDirectoryExists();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });
});
