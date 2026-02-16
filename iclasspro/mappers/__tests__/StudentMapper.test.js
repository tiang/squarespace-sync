const StudentMapper = require("../StudentMapper");

// Helper to build a complete student object for testing
function makeStudent(overrides = {}) {
  return {
    id: 338,
    enrollmentId: 327,
    firstName: "Alice",
    lastName: "Smith",
    age: "7y",
    gender: "F",
    type: "ACTIVE",
    startDate: "2026-02-08",
    dropDate: null,
    familyName: "Smith Family",
    familyId: 254,
    birthDate: "2019-05-15",
    healthConcerns: null,
    flags: {
      medical: false,
      allowImage: true,
      trial: false,
      waitlist: false,
      makeup: false,
    },
    ...overrides,
  };
}

describe("StudentMapper.transform", () => {
  describe("required field validation", () => {
    test("throws when id is missing", () => {
      const rawStudent = makeStudent({ id: undefined });
      expect(() => StudentMapper.transform(rawStudent)).toThrow(
        "Missing required field 'studentId'"
      );
    });

    test("throws when id is null", () => {
      const rawStudent = makeStudent({ id: null });
      expect(() => StudentMapper.transform(rawStudent)).toThrow(
        "Missing required field 'studentId'"
      );
    });

    test("throws when enrollmentId is missing", () => {
      const rawStudent = makeStudent({ enrollmentId: undefined });
      expect(() => StudentMapper.transform(rawStudent)).toThrow(
        "Missing required field 'enrollmentId'"
      );
    });

    test("throws when firstName is missing", () => {
      const rawStudent = makeStudent({ firstName: undefined });
      expect(() => StudentMapper.transform(rawStudent)).toThrow(
        "Missing required field 'firstName'"
      );
    });

    test("throws when firstName is empty string", () => {
      const rawStudent = makeStudent({ firstName: "" });
      expect(() => StudentMapper.transform(rawStudent)).toThrow(
        "Missing required field 'firstName'"
      );
    });

    test("throws when lastName is missing", () => {
      const rawStudent = makeStudent({ lastName: undefined });
      expect(() => StudentMapper.transform(rawStudent)).toThrow(
        "Missing required field 'lastName'"
      );
    });

    test("error message includes student name for context", () => {
      const rawStudent = {
        id: 1,
        enrollmentId: undefined,
        firstName: "Bob",
        lastName: "Jones",
      };
      expect(() => StudentMapper.transform(rawStudent)).toThrow("Bob Jones");
    });
  });

  describe("date validation", () => {
    test("accepts valid ISO date for startDate", () => {
      const rawStudent = makeStudent({ startDate: "2026-01-15" });
      expect(() => StudentMapper.transform(rawStudent)).not.toThrow();
      const result = StudentMapper.transform(rawStudent);
      expect(result.startDate).toBe("2026-01-15");
    });

    test("accepts valid ISO date for birthDate", () => {
      const rawStudent = makeStudent({ birthDate: "2018-03-20" });
      expect(() => StudentMapper.transform(rawStudent)).not.toThrow();
      const result = StudentMapper.transform(rawStudent);
      expect(result.birthDate).toBe("2018-03-20");
    });

    test("throws on invalid date format for startDate", () => {
      const rawStudent = makeStudent({ startDate: "not-a-date" });
      expect(() => StudentMapper.transform(rawStudent)).toThrow(
        "Invalid date format for 'startDate'"
      );
    });

    test("throws on invalid date format for birthDate", () => {
      const rawStudent = makeStudent({ birthDate: "invalid" });
      expect(() => StudentMapper.transform(rawStudent)).toThrow(
        "Invalid date format for 'birthDate'"
      );
    });

    test("accepts null for startDate (optional)", () => {
      const rawStudent = makeStudent({ startDate: null });
      expect(() => StudentMapper.transform(rawStudent)).not.toThrow();
      const result = StudentMapper.transform(rawStudent);
      expect(result.startDate).toBeNull();
    });

    test("accepts null for birthDate (optional)", () => {
      const rawStudent = makeStudent({ birthDate: null });
      expect(() => StudentMapper.transform(rawStudent)).not.toThrow();
      const result = StudentMapper.transform(rawStudent);
      expect(result.birthDate).toBeNull();
    });

    test("accepts empty string for dates (treated as optional)", () => {
      const rawStudent = makeStudent({ startDate: "", birthDate: "" });
      expect(() => StudentMapper.transform(rawStudent)).not.toThrow();
    });

    test("error message specifies which date field is invalid", () => {
      const rawStudent = makeStudent({ birthDate: "bad-date" });
      expect(() => StudentMapper.transform(rawStudent)).toThrow("birthDate");
      expect(() => StudentMapper.transform(rawStudent)).toThrow("bad-date");
    });
  });

  describe("field transformation", () => {
    test("maps id to studentId", () => {
      const rawStudent = makeStudent({ id: 999 });
      const result = StudentMapper.transform(rawStudent);
      expect(result.studentId).toBe(999);
    });

    test("maps all 14 fields correctly", () => {
      const rawStudent = makeStudent();
      const result = StudentMapper.transform(rawStudent);

      expect(result.studentId).toBe(338);
      expect(result.enrollmentId).toBe(327);
      expect(result.firstName).toBe("Alice");
      expect(result.lastName).toBe("Smith");
      expect(result.age).toBe("7y");
      expect(result.gender).toBe("F");
      expect(result.enrollmentType).toBe("ACTIVE");
      expect(result.startDate).toBe("2026-02-08");
      expect(result.dropDate).toBeNull();
      expect(result.familyName).toBe("Smith Family");
      expect(result.familyId).toBe(254);
      expect(result.birthDate).toBe("2019-05-15");
      expect(result.healthConcerns).toBeNull();
      expect(result.flags).toBeDefined();
    });

    test("defaults age to null when missing", () => {
      const rawStudent = makeStudent({ age: undefined });
      const result = StudentMapper.transform(rawStudent);
      expect(result.age).toBeNull();
    });

    test("defaults gender to null when missing", () => {
      const rawStudent = makeStudent({ gender: undefined });
      const result = StudentMapper.transform(rawStudent);
      expect(result.gender).toBeNull();
    });

    test("defaults enrollmentType to null when type missing", () => {
      const rawStudent = makeStudent({ type: undefined });
      const result = StudentMapper.transform(rawStudent);
      expect(result.enrollmentType).toBeNull();
    });

    test("defaults dropDate to null when missing", () => {
      const rawStudent = makeStudent({ dropDate: undefined });
      const result = StudentMapper.transform(rawStudent);
      expect(result.dropDate).toBeNull();
    });

    test("defaults familyName to null when missing", () => {
      const rawStudent = makeStudent({ familyName: undefined });
      const result = StudentMapper.transform(rawStudent);
      expect(result.familyName).toBeNull();
    });

    test("defaults familyId to null when missing", () => {
      const rawStudent = makeStudent({ familyId: undefined });
      const result = StudentMapper.transform(rawStudent);
      expect(result.familyId).toBeNull();
    });

    test("defaults healthConcerns to null when missing", () => {
      const rawStudent = makeStudent({ healthConcerns: undefined });
      const result = StudentMapper.transform(rawStudent);
      expect(result.healthConcerns).toBeNull();
    });

    test("preserves date strings without modification", () => {
      const rawStudent = makeStudent({
        startDate: "2026-02-08",
        birthDate: "2019-05-15",
      });
      const result = StudentMapper.transform(rawStudent);
      expect(result.startDate).toBe("2026-02-08");
      expect(result.birthDate).toBe("2019-05-15");
    });
  });

  describe("flags handling", () => {
    test("maps all 5 flag fields", () => {
      const rawStudent = makeStudent({
        flags: {
          medical: true,
          allowImage: false,
          trial: true,
          waitlist: false,
          makeup: true,
        },
      });
      const result = StudentMapper.transform(rawStudent);
      expect(result.flags.medical).toBe(true);
      expect(result.flags.allowImage).toBe(false);
      expect(result.flags.trial).toBe(true);
      expect(result.flags.waitlist).toBe(false);
      expect(result.flags.makeup).toBe(true);
    });

    test("defaults missing flags to false", () => {
      const rawStudent = makeStudent({
        flags: { medical: true }, // Only medical provided
      });
      const result = StudentMapper.transform(rawStudent);
      expect(result.flags.medical).toBe(true);
      expect(result.flags.allowImage).toBe(false);
      expect(result.flags.trial).toBe(false);
      expect(result.flags.waitlist).toBe(false);
      expect(result.flags.makeup).toBe(false);
    });

    test("handles missing entire flags object", () => {
      const rawStudent = makeStudent({ flags: undefined });
      const result = StudentMapper.transform(rawStudent);
      expect(result.flags).toEqual({
        medical: false,
        allowImage: false,
        trial: false,
        waitlist: false,
        makeup: false,
      });
    });

    test("preserves explicit false values (tests ?? fix)", () => {
      const rawStudent = makeStudent({
        flags: {
          medical: false,
          allowImage: false,
          trial: false,
          waitlist: false,
          makeup: false,
        },
      });
      const result = StudentMapper.transform(rawStudent);
      // These should all be false (explicitly set), not defaulted
      expect(result.flags.medical).toBe(false);
      expect(result.flags.allowImage).toBe(false);
      expect(result.flags.trial).toBe(false);
      expect(result.flags.waitlist).toBe(false);
      expect(result.flags.makeup).toBe(false);
    });
  });
});
