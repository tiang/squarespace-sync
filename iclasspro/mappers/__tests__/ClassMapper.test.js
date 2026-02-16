const ClassMapper = require("../ClassMapper");

// Helper to build a complete class object for testing
function makeClass(overrides = {}) {
  return {
    value: 31,
    name: "Test Class",
    schedule: {
      schedules: ["149500"],
      durations: [4500],
    },
    durationSchedule: {
      "1-149500": "Sun 1:45 PM-3:00 PM",
    },
    room: "Room A",
    instructor: ["John Doe", "Jane Smith"],
    occupancy: {
      active: 7,
      max: 14,
      openings: 7,
      seatsFilled: 7,
      waitlist: 0,
    },
    ...overrides,
  };
}

describe("ClassMapper.transform", () => {
  describe("validation", () => {
    test("throws when id (value) is undefined", () => {
      const rawClass = makeClass({ value: undefined });
      expect(() => ClassMapper.transform(rawClass)).toThrow(
        "Missing required field 'id'"
      );
    });

    test("throws when id (value) is null", () => {
      const rawClass = makeClass({ value: null });
      expect(() => ClassMapper.transform(rawClass)).toThrow(
        "Missing required field 'id'"
      );
    });

    test("accepts id value of 0 (critical edge case)", () => {
      const rawClass = makeClass({ value: 0 });
      expect(() => ClassMapper.transform(rawClass)).not.toThrow();
      const result = ClassMapper.transform(rawClass);
      expect(result.id).toBe(0);
    });

    test("throws when name is missing", () => {
      const rawClass = makeClass({ name: undefined });
      expect(() => ClassMapper.transform(rawClass)).toThrow(
        "Missing required field 'name'"
      );
    });

    test("throws when name is empty string", () => {
      const rawClass = makeClass({ name: "" });
      expect(() => ClassMapper.transform(rawClass)).toThrow(
        "Missing required field 'name'"
      );
    });

    test("error message includes class name when value missing", () => {
      const rawClass = { name: "Math Class", value: undefined };
      expect(() => ClassMapper.transform(rawClass)).toThrow("Math Class");
    });

    test("error message includes id when name missing", () => {
      const rawClass = { value: 42, name: "" };
      expect(() => ClassMapper.transform(rawClass)).toThrow("42");
    });
  });
});
