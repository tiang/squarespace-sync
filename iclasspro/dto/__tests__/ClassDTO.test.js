const ClassDTO = require("../ClassDTO");

describe("ClassDTO", () => {
  test("constructor assigns all 7 fields correctly", () => {
    const dto = new ClassDTO(
      31,
      "Test Class",
      { schedules: ["123"], durations: [3600] },
      { "1-123": "Mon 10:00 AM" },
      "Room A",
      ["John Doe"],
      { active: 5, max: 10, openings: 5, seatsFilled: 5, waitlist: 0 }
    );

    expect(dto.id).toBe(31);
    expect(dto.name).toBe("Test Class");
    expect(dto.schedule).toEqual({ schedules: ["123"], durations: [3600] });
    expect(dto.durationSchedule).toEqual({ "1-123": "Mon 10:00 AM" });
    expect(dto.room).toBe("Room A");
    expect(dto.instructors).toEqual(["John Doe"]);
    expect(dto.occupancy).toEqual({
      active: 5,
      max: 10,
      openings: 5,
      seatsFilled: 5,
      waitlist: 0,
    });
  });

  test("handles empty/null values gracefully", () => {
    const dto = new ClassDTO(0, "Minimal", {}, {}, "", [], {
      active: 0,
      max: 0,
      openings: 0,
      seatsFilled: 0,
      waitlist: 0,
    });

    expect(dto.id).toBe(0);
    expect(dto.name).toBe("Minimal");
    expect(dto.schedule).toEqual({});
    expect(dto.durationSchedule).toEqual({});
    expect(dto.room).toBe("");
    expect(dto.instructors).toEqual([]);
  });

  test("preserves nested objects without copying", () => {
    const schedule = { schedules: ["456"] };
    const occupancy = { active: 1, max: 1, openings: 0, seatsFilled: 1, waitlist: 0 };
    const dto = new ClassDTO(1, "Test", schedule, {}, "", [], occupancy);

    expect(dto.schedule).toBe(schedule); // Same reference
    expect(dto.occupancy).toBe(occupancy); // Same reference
  });
});
