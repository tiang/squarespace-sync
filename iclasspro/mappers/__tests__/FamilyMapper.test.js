const FamilyMapper = require("../FamilyMapper");
const FamilyDTO = require("../../dto/FamilyDTO");

// Helper to build a complete family object for testing
function makeFamilyMock(overrides = {}) {
  return {
    id: 664,
    guardians: [
      {
        id: 1234,
        firstName: "John",
        lastName: "Smith",
        isPrimary: true,
        relationshipId: 1,
      },
      {
        id: 1235,
        firstName: "Jane",
        lastName: "Smith",
        isPrimary: false,
        relationshipId: 2,
      },
    ],
    emails: [
      {
        email: "john.smith@example.com",
        isPrimary: true,
        guardianId: 1234,
      },
      {
        email: "jane.smith@example.com",
        isPrimary: false,
        guardianId: 1235,
      },
    ],
    phones: [
      {
        phoneSearch: "1234567890",
        isPrimary: true,
        guardianId: 1234,
      },
      {
        phoneSearch: "0987654321",
        isPrimary: false,
        guardianId: 1235,
      },
    ],
    addresses: [
      {
        street1: "123 Main St",
        street2: "Apt 4B",
        city: "Singapore",
        state: "SG",
        zip: "123456",
        isPrimary: true,
      },
    ],
    ...overrides,
  };
}

describe("FamilyMapper", () => {
  let sampleFamily;

  beforeEach(() => {
    sampleFamily = makeFamilyMock();
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
