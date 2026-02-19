# ICP_Roster Denormalized Table Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a flat `ICP_Roster` Airtable table that denormalizes all enrollment data into one row per enrollment for admin overview.

**Architecture:** New `RosterDTO` handles field mapping, `upsertRoster` in the Airtable service does the sync, table schema added to setup script. No linked record fields — purely flat data.

**Tech Stack:** Node.js, Airtable REST API, Jest

---

### Task 1: Add roster table config

**Files:**
- Modify: `iclasspro/config.js`

**Step 1: Read current config to understand pattern**

Run: Read `iclasspro/config.js`

**Step 2: Add `rosterTable` to config**

Add `rosterTable` to the airtable config object, following the same pattern as the other table names:

```js
rosterTable: process.env.ICLASSPRO_AIRTABLE_ROSTER_TABLE || "ICP_Roster",
```

**Step 3: Commit**

```bash
git add iclasspro/config.js
git commit -m "feat(iclasspro): add ICP_Roster table config"
```

---

### Task 2: Create RosterDTO with tests (TDD)

**Files:**
- Create: `iclasspro/dto/RosterDTO.js`
- Create: `iclasspro/dto/__tests__/RosterDTO.test.js`

**Step 1: Write the failing tests**

Create `iclasspro/dto/__tests__/RosterDTO.test.js`:

```js
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
```

**Step 2: Run tests to verify they fail**

Run: `cd iclasspro && npx jest dto/__tests__/RosterDTO.test.js`
Expected: FAIL — cannot find module `../RosterDTO`

**Step 3: Implement RosterDTO**

Create `iclasspro/dto/RosterDTO.js`:

```js
class RosterDTO {
  /**
   * Flatten student enrollment + class + family data into one Airtable row.
   * @param {Object} student - Student/enrollment object from roster
   * @param {Object} cls - Class object
   * @returns {Object} Airtable fields object
   */
  static toAirtableFields(student, cls) {
    const family = student.family || {};
    const address = family.address || {};
    const guardian = (family.guardians || [])[0] || {};
    const occupancy = cls.occupancy || {};

    return {
      // Enrollment
      "Enrollment ID": String(student.enrollmentId),
      "Enrollment Type": student.enrollmentType || "",
      "Start Date": student.startDate || null,
      "Drop Date": student.dropDate || null,
      "Trial": student.flags?.trial || false,
      "Waitlist": student.flags?.waitlist || false,
      "Makeup": student.flags?.makeup || false,
      "Medical": student.flags?.medical || false,
      "Allow Image": student.flags?.allowImage || false,

      // Student
      "Student ID": String(student.studentId),
      "Student First Name": student.firstName || "",
      "Student Last Name": student.lastName || "",
      "Student Age": student.age || "",
      "Student Gender": student.gender || "",
      "Birth Date": student.birthDate || null,
      "Health Concerns": student.healthConcerns || "",

      // Class
      "Class ID": String(cls.id),
      "Class Name": cls.name || "",
      "Schedule": cls.durationSchedule
        ? Object.values(cls.durationSchedule).join(", ")
        : "",
      "Room": cls.room || "",
      "Instructors": cls.instructors ? cls.instructors.join(", ") : "",
      "Max Capacity": occupancy.max ?? 0,
      "Active Enrollments": occupancy.active ?? 0,
      "Openings": occupancy.openings ?? 0,
      "Seats Filled": occupancy.seatsFilled ?? 0,
      "Waitlist Count": occupancy.waitlist ?? 0,

      // Family
      "Family ID": family.familyId ? String(family.familyId) : "",
      "Family Name": family.familyName || "",
      "Primary Email": family.primaryEmail || "",
      "Primary Phone": family.primaryPhone || "",
      "Street": address.street || "",
      "City": address.city || "",
      "State": address.state || "",
      "Zip": address.zip || "",

      // First guardian
      "Guardian Name": guardian.firstName
        ? `${guardian.firstName} ${guardian.lastName || ""}`.trim()
        : "",
      "Guardian Email": guardian.email || "",
      "Guardian Phone": guardian.phone || "",
      "Guardian Relationship": guardian.relationship
        ? String(guardian.relationship)
        : "",
    };
  }
}

module.exports = RosterDTO;
```

**Step 4: Run tests to verify they pass**

Run: `cd iclasspro && npx jest dto/__tests__/RosterDTO.test.js`
Expected: all 8 tests PASS

**Step 5: Commit**

```bash
git add iclasspro/dto/RosterDTO.js iclasspro/dto/__tests__/RosterDTO.test.js
git commit -m "feat(iclasspro): add RosterDTO with full test coverage"
```

---

### Task 3: Add upsertRoster and wire into syncFromJson

**Files:**
- Modify: `iclasspro/services/airtable.js`

**Step 1: Add `RosterDTO` require at top of file**

Add after the existing DTO requires (line ~6):

```js
const RosterDTO = require("../dto/RosterDTO");
```

**Step 2: Add `upsertRoster` method**

Add after `upsertEnrollments` method (~line 224):

```js
  /**
   * Upsert denormalized roster rows (one per enrollment). Returns { idMap, failed }.
   */
  async upsertRoster(classes) {
    const uniqueEnrollments = new Map();
    for (const cls of classes) {
      for (const student of cls.roster) {
        if (!uniqueEnrollments.has(student.enrollmentId)) {
          uniqueEnrollments.set(student.enrollmentId, { student, cls });
        }
      }
    }

    return this.bulkUpsert(
      config.airtable.rosterTable,
      [...uniqueEnrollments.values()],
      ({ student, cls }) => ({
        keyField: "Enrollment ID",
        keyValue: String(student.enrollmentId),
        fields: RosterDTO.toAirtableFields(student, cls),
      }),
      ({ student }) => student.enrollmentId
    );
  }
```

**Step 3: Wire into syncFromJson**

After the `enrollmentResult` line (~line 247), add:

```js
    const rosterResult = await this.upsertRoster(classes);
```

Add `roster: tally(rosterResult)` to the return object.

**Step 4: Run all tests**

Run: `cd iclasspro && npx jest`
Expected: all tests PASS (existing syncFromJson tests still work since the mock handles extra calls)

**Step 5: Commit**

```bash
git add iclasspro/services/airtable.js
git commit -m "feat(iclasspro): add upsertRoster to Airtable sync pipeline"
```

---

### Task 4: Add roster table to create-airtable-tables.js

**Files:**
- Modify: `iclasspro/commands/create-airtable-tables.js`

**Step 1: Add `rosterFields` function**

Add after the `enrollmentsFields` function:

```js
function rosterFields() {
  return [
    { name: "Enrollment ID", type: "singleLineText" },
    { name: "Enrollment Type", type: "singleLineText" },
    { name: "Start Date", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Drop Date", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Trial", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Waitlist", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Makeup", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Medical", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Allow Image", type: "checkbox", options: { icon: "check", color: "greenBright" } },
    { name: "Student ID", type: "singleLineText" },
    { name: "Student First Name", type: "singleLineText" },
    { name: "Student Last Name", type: "singleLineText" },
    { name: "Student Age", type: "singleLineText" },
    { name: "Student Gender", type: "singleLineText" },
    { name: "Birth Date", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Health Concerns", type: "multilineText" },
    { name: "Class ID", type: "singleLineText" },
    { name: "Class Name", type: "singleLineText" },
    { name: "Schedule", type: "singleLineText" },
    { name: "Room", type: "singleLineText" },
    { name: "Instructors", type: "singleLineText" },
    { name: "Max Capacity", type: "number", options: { precision: 0 } },
    { name: "Active Enrollments", type: "number", options: { precision: 0 } },
    { name: "Openings", type: "number", options: { precision: 0 } },
    { name: "Seats Filled", type: "number", options: { precision: 0 } },
    { name: "Waitlist Count", type: "number", options: { precision: 0 } },
    { name: "Family ID", type: "singleLineText" },
    { name: "Family Name", type: "singleLineText" },
    { name: "Primary Email", type: "email" },
    { name: "Primary Phone", type: "phoneNumber" },
    { name: "Street", type: "singleLineText" },
    { name: "City", type: "singleLineText" },
    { name: "State", type: "singleLineText" },
    { name: "Zip", type: "singleLineText" },
    { name: "Guardian Name", type: "singleLineText" },
    { name: "Guardian Email", type: "email" },
    { name: "Guardian Phone", type: "phoneNumber" },
    { name: "Guardian Relationship", type: "singleLineText" },
  ];
}
```

**Step 2: Add `roster` to TABLE_NAMES**

```js
roster: process.env.ICLASSPRO_AIRTABLE_ROSTER_TABLE || "ICP_Roster",
```

**Step 3: Add roster table creation to main()**

After the enrollments step, add a new step:

```js
  // Step 4: Denormalized roster table (no links)
  logger.info("Step 4/4: Roster (denormalized, no links)");
  await ensureTable(existingByName, TABLE_NAMES.roster, rosterFields);
```

Update step labels from "Step 1/3" → "Step 1/4", "Step 2/3" → "Step 2/4", "Step 3/3" → "Step 3/4".

**Step 4: Commit**

```bash
git add iclasspro/commands/create-airtable-tables.js
git commit -m "feat(iclasspro): add ICP_Roster table to Airtable setup script"
```

---

### Task 5: Update airtable service tests for roster

**Files:**
- Modify: `iclasspro/services/__tests__/airtable.test.js`

**Step 1: Add `rosterTable` to mock config**

In the `jest.mock("../../config")` block, add:

```js
rosterTable: "ICP_Roster",
```

**Step 2: Update syncFromJson test assertions**

In the "returns { succeeded, attempted } per table on successful sync" test, add:

```js
expect(summary.roster).toEqual({ succeeded: 1, attempted: 1 });
```

In the deduplication test, add:

```js
expect(summary.roster).toEqual({ succeeded: 1, attempted: 1 });
```

**Step 3: Run all tests**

Run: `cd iclasspro && npx jest`
Expected: all tests PASS

**Step 4: Commit**

```bash
git add iclasspro/services/__tests__/airtable.test.js
git commit -m "test(iclasspro): add roster table coverage to airtable service tests"
```

---

### Task 6: Final verification and squash commit

**Step 1: Run full test suite**

Run: `cd iclasspro && npx jest`
Expected: all tests PASS

**Step 2: Review all changes**

Run: `git diff main --stat` to verify only expected files changed.

**Step 3: Create PR, review, squash merge** (same flow as the class-student-links fix)
