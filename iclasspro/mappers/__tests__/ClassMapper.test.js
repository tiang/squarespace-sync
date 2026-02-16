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

  describe("field mapping", () => {
    test("maps value field to id", () => {
      const rawClass = makeClass({ value: 99 });
      const result = ClassMapper.transform(rawClass);
      expect(result.id).toBe(99);
    });

    test("preserves name field", () => {
      const rawClass = makeClass({ name: "Advanced Math" });
      const result = ClassMapper.transform(rawClass);
      expect(result.name).toBe("Advanced Math");
    });

    test("preserves schedule object with schedules array", () => {
      const rawClass = makeClass({
        schedule: { schedules: ["123", "456"], durations: [3600, 7200] },
      });
      const result = ClassMapper.transform(rawClass);
      expect(result.schedule.schedules).toEqual(["123", "456"]);
      expect(result.schedule.durations).toEqual([3600, 7200]);
    });

    test("preserves durationSchedule object", () => {
      const rawClass = makeClass({
        durationSchedule: { "2-100": "Mon 10:00 AM-11:00 AM" },
      });
      const result = ClassMapper.transform(rawClass);
      expect(result.durationSchedule).toEqual({
        "2-100": "Mon 10:00 AM-11:00 AM",
      });
    });

    test("preserves room field", () => {
      const rawClass = makeClass({ room: "Studio B" });
      const result = ClassMapper.transform(rawClass);
      expect(result.room).toBe("Studio B");
    });

    test("maps instructor (singular) to instructors (plural)", () => {
      const rawClass = makeClass({ instructor: ["Alice", "Bob"] });
      const result = ClassMapper.transform(rawClass);
      expect(result.instructors).toEqual(["Alice", "Bob"]);
    });
  });

  describe("defaults", () => {
    test("defaults schedule to empty object when missing", () => {
      const rawClass = makeClass({ schedule: undefined });
      const result = ClassMapper.transform(rawClass);
      expect(result.schedule).toEqual({});
    });

    test("defaults durationSchedule to empty object when missing", () => {
      const rawClass = makeClass({ durationSchedule: undefined });
      const result = ClassMapper.transform(rawClass);
      expect(result.durationSchedule).toEqual({});
    });

    test("defaults room to empty string when missing", () => {
      const rawClass = makeClass({ room: undefined });
      const result = ClassMapper.transform(rawClass);
      expect(result.room).toBe("");
    });

    test("defaults instructors to empty array when missing", () => {
      const rawClass = makeClass({ instructor: undefined });
      const result = ClassMapper.transform(rawClass);
      expect(result.instructors).toEqual([]);
    });
  });
});
