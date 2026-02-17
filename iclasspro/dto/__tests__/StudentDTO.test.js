/**
 * StudentDTO Tests
 *
 * Tests for the StudentDTO data transfer object.
 * Tests organized by concern:
 * - Constructor field assignment (all 14 fields)
 * - Null value handling for optional fields
 * - Flags object reference preservation (no deep copying)
 */
const StudentDTO = require("../StudentDTO");

describe("StudentDTO", () => {
  test("constructor assigns all 14 fields correctly", () => {
    const flags = {
      medical: false,
      allowImage: true,
      trial: false,
      waitlist: false,
      makeup: false,
    };

    const dto = new StudentDTO(
      338,
      327,
      "Alice",
      "Smith",
      "7y",
      "F",
      "ACTIVE",
      "2026-02-08",
      null,
      "Smith Family",
      254,
      "2019-05-15",
      null,
      flags
    );

    expect(dto.studentId).toBe(338);
    expect(dto.enrollmentId).toBe(327);
    expect(dto.firstName).toBe("Alice");
    expect(dto.lastName).toBe("Smith");
    expect(dto.age).toBe("7y");
    expect(dto.gender).toBe("F");
    expect(dto.enrollmentType).toBe("ACTIVE");
    expect(dto.startDate).toBe("2026-02-08");
    expect(dto.dropDate).toBeNull();
    expect(dto.familyName).toBe("Smith Family");
    expect(dto.familyId).toBe(254);
    expect(dto.birthDate).toBe("2019-05-15");
    expect(dto.healthConcerns).toBeNull();
    expect(dto.flags).toEqual(flags);
  });

  test("handles null values for optional fields", () => {
    const dto = new StudentDTO(
      1,
      2,
      "Bob",
      "Jones",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      { medical: false, allowImage: false, trial: false, waitlist: false, makeup: false }
    );

    expect(dto.age).toBeNull();
    expect(dto.gender).toBeNull();
    expect(dto.enrollmentType).toBeNull();
    expect(dto.startDate).toBeNull();
    expect(dto.dropDate).toBeNull();
    expect(dto.familyName).toBeNull();
    expect(dto.familyId).toBeNull();
    expect(dto.birthDate).toBeNull();
    expect(dto.healthConcerns).toBeNull();
  });

  test("preserves flags object structure without copying", () => {
    const flags = { medical: true, allowImage: false, trial: false, waitlist: false, makeup: false };
    const dto = new StudentDTO(
      1,
      2,
      "Test",
      "Student",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      flags
    );

    expect(dto.flags).toBe(flags); // Same reference
    expect(dto.flags.medical).toBe(true);
  });

  const student = new StudentDTO(
    338,           // studentId
    327,           // enrollmentId
    "Cullen",      // firstName
    "Tan",         // lastName
    "7y",          // age
    "M",           // gender
    "ACTIVE",      // enrollmentType
    "2026-02-08",  // startDate
    null,          // dropDate
    "Tan Xiaotian", // familyName
    254,           // familyId
    "2019-01-01",  // birthDate
    null,          // healthConcerns
    { medical: false, allowImage: true, trial: false, waitlist: false, makeup: false }
  );

  describe("toStudentAirtableFields", () => {
    it("maps student fields to Airtable field names with family link", () => {
      const fields = StudentDTO.toStudentAirtableFields(student, "recFAM123");

      expect(fields["Student ID"]).toBe("338");
      expect(fields["First Name"]).toBe("Cullen");
      expect(fields["Last Name"]).toBe("Tan");
      expect(fields["Birth Date"]).toBe("2019-01-01");
      expect(fields["Gender"]).toBe("M");
      expect(fields["Health Concerns"]).toBe("");
      expect(fields["Family"]).toEqual(["recFAM123"]);
    });

    it("omits Family link when no airtable record ID provided", () => {
      const fields = StudentDTO.toStudentAirtableFields(student, null);
      expect(fields["Family"]).toEqual([]);
    });
  });

  describe("toEnrollmentAirtableFields", () => {
    it("maps enrollment fields to Airtable field names with student and class links", () => {
      const fields = StudentDTO.toEnrollmentAirtableFields(
        student,
        "recSTU456",
        "recCLS789"
      );

      expect(fields["Enrollment ID"]).toBe("327");
      expect(fields["Enrollment Type"]).toBe("ACTIVE");
      expect(fields["Start Date"]).toBe("2026-02-08");
      expect(fields["Drop Date"]).toBe("");
      expect(fields["Medical"]).toBe(false);
      expect(fields["Allow Image"]).toBe(true);
      expect(fields["Trial"]).toBe(false);
      expect(fields["Waitlist"]).toBe(false);
      expect(fields["Student"]).toEqual(["recSTU456"]);
      expect(fields["Class"]).toEqual(["recCLS789"]);
    });

    it("omits links when no airtable record IDs provided", () => {
      const fields = StudentDTO.toEnrollmentAirtableFields(student, null, null);
      expect(fields["Student"]).toEqual([]);
      expect(fields["Class"]).toEqual([]);
    });
  });
});
