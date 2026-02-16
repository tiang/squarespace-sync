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
});
