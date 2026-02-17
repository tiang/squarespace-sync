/**
 * ClassDTO Tests
 *
 * Tests for the ClassDTO data transfer object.
 * Tests organized by concern:
 * - Constructor field assignment (all 7 fields)
 * - Empty/null value handling
 * - Object reference preservation (no deep copying)
 * - toAirtableFields mapping
 */
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

  describe("toAirtableFields", () => {
    const cls = new ClassDTO(
      31,
      "Camberwell - Junior Engineers",
      { schedules: ["149500"], durations: [4500] },
      { "1-149500": "Sun 1:45 PM-3:00 PM" },
      "Camberwell Community Centre",
      ["Cronin, Ryan", "Cannell, Sophie"],
      { active: 7, max: 14, openings: 7, seatsFilled: 7, waitlist: 0 }
    );

    it("maps all class fields to Airtable field names", () => {
      const fields = ClassDTO.toAirtableFields(cls);

      expect(fields["Class ID"]).toBe("31");
      expect(fields["Class Name"]).toBe("Camberwell - Junior Engineers");
      expect(fields["Schedule"]).toBe("Sun 1:45 PM-3:00 PM");
      expect(fields["Room"]).toBe("Camberwell Community Centre");
      expect(fields["Instructors"]).toBe("Cronin, Ryan, Cannell, Sophie");
      expect(fields["Max Capacity"]).toBe(14);
    });

    it("handles empty instructors and durationSchedule gracefully", () => {
      const minimalCls = new ClassDTO(1, "Test", {}, {}, "", [], { max: 0 });
      const fields = ClassDTO.toAirtableFields(minimalCls);

      expect(fields["Instructors"]).toBe("");
      expect(fields["Schedule"]).toBe("");
    });

    it("includes ICP_Students when studentAirtableRecordIds are provided", () => {
      const fields = ClassDTO.toAirtableFields(cls, ["recAAA", "recBBB"]);

      expect(fields["ICP_Students"]).toEqual(["recAAA", "recBBB"]);
    });

    it("omits ICP_Students when no student record IDs are provided", () => {
      const fields = ClassDTO.toAirtableFields(cls);
      expect(fields["ICP_Students"]).toBeUndefined();

      const fieldsEmpty = ClassDTO.toAirtableFields(cls, []);
      expect(fieldsEmpty["ICP_Students"]).toBeUndefined();
    });
  });
});
