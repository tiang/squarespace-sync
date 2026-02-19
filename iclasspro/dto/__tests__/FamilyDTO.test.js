const FamilyDTO = require("../FamilyDTO");

describe("FamilyDTO", () => {
  const family = new FamilyDTO(
    664,
    "John Smith",
    "john@example.com",
    "0412345678",
    [
      {
        guardianId: 1234,
        firstName: "John",
        lastName: "Smith",
        email: "john@example.com",
        phone: "0412345678",
        relationship: 1,
        isPrimary: true,
      },
    ],
    { street: "123 Main St", city: "Melbourne", state: "VIC", zip: "3000" },
    []
  );

  describe("toAirtableFields", () => {
    it("maps all family fields to Airtable field names", () => {
      const fields = FamilyDTO.toAirtableFields(family);

      expect(fields["Family ID"]).toBe("664");
      expect(fields["Family Name"]).toBe("John Smith");
      expect(fields["Primary Email"]).toBe("john@example.com");
      expect(fields["Primary Phone"]).toBe("0412345678");
      expect(fields["Street"]).toBe("123 Main St");
      expect(fields["City"]).toBe("Melbourne");
      expect(fields["State"]).toBe("VIC");
      expect(fields["Zip"]).toBe("3000");
    });

    it("handles null address gracefully", () => {
      const familyNoAddress = new FamilyDTO(1, null, null, null, [], null, []);
      const fields = FamilyDTO.toAirtableFields(familyNoAddress);

      expect(fields["Street"]).toBe("");
      expect(fields["City"]).toBe("");
    });
  });

  describe("toGuardianAirtableFields", () => {
    it("maps guardian fields to Airtable field names with family link", () => {
      const guardian = family.guardians[0];
      const fields = FamilyDTO.toGuardianAirtableFields(guardian, "recABC123");

      expect(fields["Guardian ID"]).toBe("1234");
      expect(fields["First Name"]).toBe("John");
      expect(fields["Last Name"]).toBe("Smith");
      expect(fields["Email"]).toBe("john@example.com");
      expect(fields["Phone"]).toBe("0412345678");
      expect(fields["Is Primary"]).toBe(true);
      expect(fields["Family"]).toEqual(["recABC123"]);
    });

    it("omits Family link when no airtable record ID provided", () => {
      const guardian = family.guardians[0];
      const fields = FamilyDTO.toGuardianAirtableFields(guardian, null);

      expect(fields["Family"]).toEqual([]);
    });
  });
});
