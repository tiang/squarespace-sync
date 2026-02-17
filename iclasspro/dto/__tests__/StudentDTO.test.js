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
});
