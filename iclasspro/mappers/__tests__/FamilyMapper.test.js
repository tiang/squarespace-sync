const FamilyMapper = require("../FamilyMapper");
const FamilyDTO = require("../../dto/FamilyDTO");
const fs = require("fs");
const path = require("path");

describe("FamilyMapper", () => {
  let sampleFamilyResponse;
  let sampleFamily;

  beforeAll(() => {
    // Load the actual API response saved in Task 1
    const samplePath = path.join(__dirname, "../../data/family-sample.json");
    sampleFamilyResponse = JSON.parse(fs.readFileSync(samplePath, "utf8"));
    sampleFamily = sampleFamilyResponse.data; // Extract data from wrapper
  });

  describe("transform", () => {
    it("should transform raw family data to FamilyDTO", () => {
      const result = FamilyMapper.transform(sampleFamily);

      expect(result).toBeInstanceOf(FamilyDTO);
      expect(result.familyId).toBe(664);
      expect(result.familyName).toBeTruthy();
      expect(result.guardians).toBeInstanceOf(Array);
    });

    it("should throw error if familyId is missing", () => {
      const invalidFamily = { ...sampleFamily };
      delete invalidFamily.id;

      expect(() => FamilyMapper.transform(invalidFamily)).toThrow(
        /Missing required field.*familyId/
      );
    });

    it("should handle missing optional fields gracefully", () => {
      const minimalFamily = {
        id: 999,
        guardians: [],
        emails: [],
        phones: [],
        addresses: [],
      };

      const result = FamilyMapper.transform(minimalFamily);

      expect(result.familyId).toBe(999);
      expect(result.primaryEmail).toBeNull();
      expect(result.guardians).toEqual([]);
    });
  });
});
