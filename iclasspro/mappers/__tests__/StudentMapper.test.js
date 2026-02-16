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
});
