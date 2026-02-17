const RosterDTO = require("../RosterDTO");

describe("RosterDTO", () => {
  const student = {
    enrollmentId: 327,
    enrollmentType: "ACTIVE",
    startDate: "2026-02-08",
    dropDate: null,
    studentId: 338,
    firstName: "Cullen",
    lastName: "Tan",
    age: "7y",
    gender: "M",
    birthDate: "2019-01-01",
    healthConcerns: "Asthma",
    flags: {
      medical: false,
      allowImage: true,
      trial: false,
      waitlist: false,
      makeup: false,
    },
    family: {
      familyId: 254,
      familyName: "Xiaotian Tan",
      primaryEmail: "tan@example.com",
      primaryPhone: "0430402619",
      guardians: [
        {
          guardianId: 66,
          firstName: "Xiaotian",
          lastName: "Tan",
          email: "tan@example.com",
          phone: "0430402619",
          relationship: "Mother",
          isPrimary: true,
        },
        {
          guardianId: 67,
          firstName: "Second",
          lastName: "Guardian",
          email: "second@example.com",
          phone: "0000000000",
          relationship: "Father",
          isPrimary: false,
        },
      ],
      address: {
        street: "49 Durham Road",
        city: "Surrey Hills",
        state: "VIC_AUSTRALIA",
        zip: "3127",
      },
    },
  };

  const cls = {
    id: 31,
    name: "Camberwell - Junior Engineers",
    durationSchedule: { "1-149500": "Sun 1:45 PM-3:00 PM" },
    room: "Camberwell Community Centre",
    instructors: ["Cronin, Ryan", "Cannell, Sophie"],
    occupancy: {
      active: 7,
      max: 14,
      openings: 7,
      seatsFilled: 7,
      waitlist: 0,
    },
  };

  it("maps all enrollment fields", () => {
    const fields = RosterDTO.toAirtableFields(student, cls);

    expect(fields["Enrollment ID"]).toBe("327");
    expect(fields["Enrollment Type"]).toBe("ACTIVE");
    expect(fields["Start Date"]).toBe("2026-02-08");
    expect(fields["Drop Date"]).toBeNull();
    expect(fields["Trial"]).toBe(false);
    expect(fields["Waitlist"]).toBe(false);
    expect(fields["Makeup"]).toBe(false);
    expect(fields["Medical"]).toBe(false);
    expect(fields["Allow Image"]).toBe(true);
  });

  it("maps all student fields", () => {
    const fields = RosterDTO.toAirtableFields(student, cls);

    expect(fields["Student ID"]).toBe("338");
    expect(fields["Student First Name"]).toBe("Cullen");
    expect(fields["Student Last Name"]).toBe("Tan");
    expect(fields["Student Age"]).toBe("7y");
    expect(fields["Student Gender"]).toBe("M");
    expect(fields["Birth Date"]).toBe("2019-01-01");
    expect(fields["Health Concerns"]).toBe("Asthma");
  });

  it("maps all class fields", () => {
    const fields = RosterDTO.toAirtableFields(student, cls);

    expect(fields["Class ID"]).toBe("31");
    expect(fields["Class Name"]).toBe("Camberwell - Junior Engineers");
    expect(fields["Schedule"]).toBe("Sun 1:45 PM-3:00 PM");
    expect(fields["Room"]).toBe("Camberwell Community Centre");
    expect(fields["Instructors"]).toBe("Cronin, Ryan, Cannell, Sophie");
    expect(fields["Max Capacity"]).toBe(14);
    expect(fields["Active Enrollments"]).toBe(7);
    expect(fields["Openings"]).toBe(7);
    expect(fields["Seats Filled"]).toBe(7);
    expect(fields["Waitlist Count"]).toBe(0);
  });

  it("maps family and address fields", () => {
    const fields = RosterDTO.toAirtableFields(student, cls);

    expect(fields["Family ID"]).toBe("254");
    expect(fields["Family Name"]).toBe("Xiaotian Tan");
    expect(fields["Primary Email"]).toBe("tan@example.com");
    expect(fields["Primary Phone"]).toBe("0430402619");
    expect(fields["Street"]).toBe("49 Durham Road");
    expect(fields["City"]).toBe("Surrey Hills");
    expect(fields["State"]).toBe("VIC_AUSTRALIA");
    expect(fields["Zip"]).toBe("3127");
  });

  it("picks first guardian only even when multiple exist", () => {
    const fields = RosterDTO.toAirtableFields(student, cls);

    expect(fields["Guardian Name"]).toBe("Xiaotian Tan");
    expect(fields["Guardian Email"]).toBe("tan@example.com");
    expect(fields["Guardian Phone"]).toBe("0430402619");
    expect(fields["Guardian Relationship"]).toBe("Mother");
  });

  it("handles missing family gracefully", () => {
    const noFamily = { ...student, family: null };
    const fields = RosterDTO.toAirtableFields(noFamily, cls);

    expect(fields["Family ID"]).toBe("");
    expect(fields["Family Name"]).toBe("");
    expect(fields["Primary Email"]).toBe("");
    expect(fields["Primary Phone"]).toBe("");
    expect(fields["Street"]).toBe("");
    expect(fields["Guardian Name"]).toBe("");
    expect(fields["Guardian Email"]).toBe("");
  });

  it("handles missing guardians array gracefully", () => {
    const noGuardians = {
      ...student,
      family: { ...student.family, guardians: [] },
    };
    const fields = RosterDTO.toAirtableFields(noGuardians, cls);

    expect(fields["Guardian Name"]).toBe("");
    expect(fields["Guardian Email"]).toBe("");
    expect(fields["Guardian Phone"]).toBe("");
    expect(fields["Guardian Relationship"]).toBe("");
  });

  it("handles missing occupancy gracefully", () => {
    const noOccupancy = { ...cls, occupancy: undefined };
    const fields = RosterDTO.toAirtableFields(student, noOccupancy);

    expect(fields["Max Capacity"]).toBe(0);
    expect(fields["Active Enrollments"]).toBe(0);
    expect(fields["Openings"]).toBe(0);
    expect(fields["Seats Filled"]).toBe(0);
    expect(fields["Waitlist Count"]).toBe(0);
  });
});
