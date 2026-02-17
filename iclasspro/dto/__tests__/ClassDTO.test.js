const ClassDTO = require("../ClassDTO");

describe("ClassDTO", () => {
  const cls = new ClassDTO(
    31,
    "Camberwell - Junior Engineers",
    { schedules: ["149500"], durations: [4500] },
    { "1-149500": "Sun 1:45 PM-3:00 PM" },
    "Camberwell Community Centre",
    ["Cronin, Ryan", "Cannell, Sophie"],
    { active: 7, max: 14, openings: 7, seatsFilled: 7, waitlist: 0 }
  );

  describe("toAirtableFields", () => {
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
  });
});
