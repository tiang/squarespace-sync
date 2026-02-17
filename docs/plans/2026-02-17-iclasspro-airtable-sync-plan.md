# iClassPro → Airtable Sync — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Sync iClassPro data to 5 normalized Airtable tables (ICP_Families, ICP_Guardians, ICP_Students, ICP_Classes, ICP_Enrollments) via three commands: `iclasspro` (API→JSON, unchanged), `iclasspro:airtable` (JSON→Airtable), `iclasspro:full` (both).

**Architecture:** Follows the existing DTO/Mapper/Service pattern. DTOs gain `toAirtableFields()` static methods. A new `IClassProAirtableService` handles all 5 tables in dependency order, resolving Airtable linked record IDs at each step. FamilyMapper is fixed to preserve `guardianId` (currently dropped).

**Tech Stack:** Node.js, Airtable npm package (`^0.12.2`, already in `sync/package.json`), Jest for tests. Tests run via `npm test` (→ `cd sync && npx jest`, picks up `iclasspro/` via `sync/jest.config.js` roots).

---

## Context

Read these files before starting any task:
- `iclasspro/mappers/FamilyMapper.js` — FamilyMapper (Task 1 fix)
- `iclasspro/dto/FamilyDTO.js` — FamilyDTO shape
- `iclasspro/dto/ClassDTO.js` — ClassDTO shape
- `iclasspro/dto/StudentDTO.js` — StudentDTO shape
- `sync/services/airtable.js` — Squarespace Airtable pattern to follow
- `sync/jest.config.js` — test roots config
- `package.json` — root scripts and dependencies

**Key pattern:** `sync/services/airtable.js` uses `findOrderById` → upsert pattern. Follow the same approach.

**Key constraint:** Airtable linked records require the Airtable record's `.id` (like `recXXXXXXX`), not our own IDs. The upsert order is: Families → Guardians → Students → Classes → Enrollments.

---

## Task 1: Fix FamilyMapper to preserve guardianId

**Why:** `guardian.id` is used to join emails/phones but then dropped. Airtable needs it as the unique key for ICP_Guardians.

**Files:**
- Modify: `iclasspro/mappers/FamilyMapper.js:47-54`
- Modify: `iclasspro/mappers/__tests__/FamilyMapper.test.js`

**Step 1: Add a failing test assertion**

In `FamilyMapper.test.js`, inside the existing `"should transform raw family data to FamilyDTO"` test, add:

```js
it("should transform raw family data to FamilyDTO", () => {
  const result = FamilyMapper.transform(sampleFamily);

  expect(result).toBeInstanceOf(FamilyDTO);
  expect(result.familyId).toBe(664);
  expect(result.familyName).toBeTruthy();
  expect(result.guardians).toBeInstanceOf(Array);
  // ADD THIS:
  expect(result.guardians[0].guardianId).toBe(1234);
  expect(result.guardians[1].guardianId).toBe(1235);
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="FamilyMapper"
```

Expected: FAIL — `expect(received).toBe(expected)` — `guardianId` is `undefined`.

**Step 3: Add guardianId to the returned guardian object in FamilyMapper.js**

In `FamilyMapper.js`, in the `transformedGuardians` map (lines 43-55), add `guardianId` as the first field:

```js
const transformedGuardians = guardians.map((guardian) => {
  const guardianEmail = emails.find((e) => e.guardianId === guardian.id);
  const guardianPhone = phones.find((p) => p.guardianId === guardian.id);

  return {
    guardianId: guardian.id,         // ADD THIS LINE
    firstName: guardian.firstName || null,
    lastName: guardian.lastName || null,
    email: guardianEmail ? guardianEmail.email : null,
    phone: guardianPhone ? guardianPhone.phoneSearch : null,
    relationship: guardian.relationshipId || null,
    isPrimary: guardian.isPrimary || false,
  };
});
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="FamilyMapper"
```

Expected: PASS — 3 tests pass.

**Step 5: Commit**

```bash
git add iclasspro/mappers/FamilyMapper.js iclasspro/mappers/__tests__/FamilyMapper.test.js
git commit -m "fix(iclasspro): preserve guardianId in FamilyMapper output"
```

---

## Task 2: Create iclasspro/config.js

**Why:** The iClassPro Airtable service needs to know the API key, base ID, and table names. The Squarespace sync uses `sync/config.js` — we need an equivalent for the iClassPro module.

**Files:**
- Create: `iclasspro/config.js`
- Modify: `.env.example` (add new vars at bottom)

**Step 1: Create `iclasspro/config.js`**

```js
require("dotenv").config();

const config = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    familiesTable: process.env.ICLASSPRO_AIRTABLE_FAMILIES_TABLE || "ICP_Families",
    guardiansTable: process.env.ICLASSPRO_AIRTABLE_GUARDIANS_TABLE || "ICP_Guardians",
    studentsTable: process.env.ICLASSPRO_AIRTABLE_STUDENTS_TABLE || "ICP_Students",
    classesTable: process.env.ICLASSPRO_AIRTABLE_CLASSES_TABLE || "ICP_Classes",
    enrollmentsTable: process.env.ICLASSPRO_AIRTABLE_ENROLLMENTS_TABLE || "ICP_Enrollments",
  },
};

const requiredEnvVars = ["AIRTABLE_API_KEY", "AIRTABLE_BASE_ID"];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

module.exports = config;
```

**Step 2: Add new vars to `.env.example`**

At the bottom of `.env.example`, add:

```
# iClassPro Airtable table names (defaults shown)
ICLASSPRO_AIRTABLE_FAMILIES_TABLE=ICP_Families
ICLASSPRO_AIRTABLE_GUARDIANS_TABLE=ICP_Guardians
ICLASSPRO_AIRTABLE_STUDENTS_TABLE=ICP_Students
ICLASSPRO_AIRTABLE_CLASSES_TABLE=ICP_Classes
ICLASSPRO_AIRTABLE_ENROLLMENTS_TABLE=ICP_Enrollments
```

**Step 3: Commit**

```bash
git add iclasspro/config.js .env.example
git commit -m "feat(iclasspro): add config.js with Airtable table name settings"
```

---

## Task 3: Add Airtable field methods to FamilyDTO

**Why:** FamilyDTO and its nested guardian objects need to map to Airtable field names. Two static methods: one for family records, one for guardian records.

**Files:**
- Modify: `iclasspro/dto/FamilyDTO.js`
- Create: `iclasspro/dto/__tests__/FamilyDTO.test.js`

**Step 1: Write the failing tests**

Create `iclasspro/dto/__tests__/FamilyDTO.test.js`:

```js
const FamilyDTO = require("../FamilyDTO");

describe("FamilyDTO", () => {
  const family = new FamilyDTO(
    664,
    "John Smith",
    "john@example.com",
    "0412345678",
    [
      {
        guardianId: 1234,
        firstName: "John",
        lastName: "Smith",
        email: "john@example.com",
        phone: "0412345678",
        relationship: 1,
        isPrimary: true,
      },
    ],
    { street: "123 Main St", city: "Melbourne", state: "VIC", zip: "3000" },
    []
  );

  describe("toAirtableFields", () => {
    it("maps all family fields to Airtable field names", () => {
      const fields = FamilyDTO.toAirtableFields(family);

      expect(fields["Family ID"]).toBe("664");
      expect(fields["Family Name"]).toBe("John Smith");
      expect(fields["Primary Email"]).toBe("john@example.com");
      expect(fields["Primary Phone"]).toBe("0412345678");
      expect(fields["Street"]).toBe("123 Main St");
      expect(fields["City"]).toBe("Melbourne");
      expect(fields["State"]).toBe("VIC");
      expect(fields["Zip"]).toBe("3000");
    });

    it("handles null address gracefully", () => {
      const familyNoAddress = new FamilyDTO(1, null, null, null, [], null, []);
      const fields = FamilyDTO.toAirtableFields(familyNoAddress);

      expect(fields["Street"]).toBe("");
      expect(fields["City"]).toBe("");
    });
  });

  describe("toGuardianAirtableFields", () => {
    it("maps guardian fields to Airtable field names with family link", () => {
      const guardian = family.guardians[0];
      const fields = FamilyDTO.toGuardianAirtableFields(guardian, "recABC123");

      expect(fields["Guardian ID"]).toBe("1234");
      expect(fields["First Name"]).toBe("John");
      expect(fields["Last Name"]).toBe("Smith");
      expect(fields["Email"]).toBe("john@example.com");
      expect(fields["Phone"]).toBe("0412345678");
      expect(fields["Is Primary"]).toBe(true);
      expect(fields["Family"]).toEqual(["recABC123"]);
    });

    it("omits Family link when no airtable record ID provided", () => {
      const guardian = family.guardians[0];
      const fields = FamilyDTO.toGuardianAirtableFields(guardian, null);

      expect(fields["Family"]).toEqual([]);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="FamilyDTO"
```

Expected: FAIL — `FamilyDTO.toAirtableFields is not a function`.

**Step 3: Add static methods to `iclasspro/dto/FamilyDTO.js`**

Add after the constructor's closing `}`, before `module.exports`:

```js
  /**
   * Map a FamilyDTO to Airtable field names for ICP_Families table
   * @param {FamilyDTO} family
   * @returns {Object} Airtable fields object
   */
  static toAirtableFields(family) {
    return {
      "Family ID": String(family.familyId),
      "Family Name": family.familyName || "",
      "Primary Email": family.primaryEmail || "",
      "Primary Phone": family.primaryPhone || "",
      "Street": family.address?.street || "",
      "City": family.address?.city || "",
      "State": family.address?.state || "",
      "Zip": family.address?.zip || "",
    };
  }

  /**
   * Map a guardian object to Airtable field names for ICP_Guardians table
   * @param {Object} guardian - Guardian object from FamilyDTO.guardians[]
   * @param {string|null} familyAirtableRecordId - Airtable record ID of the parent Family
   * @returns {Object} Airtable fields object
   */
  static toGuardianAirtableFields(guardian, familyAirtableRecordId) {
    return {
      "Guardian ID": String(guardian.guardianId),
      "First Name": guardian.firstName || "",
      "Last Name": guardian.lastName || "",
      "Email": guardian.email || "",
      "Phone": guardian.phone || "",
      "Relationship": guardian.relationship ? String(guardian.relationship) : "",
      "Is Primary": guardian.isPrimary || false,
      "Family": familyAirtableRecordId ? [familyAirtableRecordId] : [],
    };
  }
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="FamilyDTO"
```

Expected: PASS — 4 tests pass.

**Step 5: Commit**

```bash
git add iclasspro/dto/FamilyDTO.js iclasspro/dto/__tests__/FamilyDTO.test.js
git commit -m "feat(iclasspro): add toAirtableFields and toGuardianAirtableFields to FamilyDTO"
```

---

## Task 4: Add toAirtableFields() to ClassDTO

**Files:**
- Modify: `iclasspro/dto/ClassDTO.js`
- Create: `iclasspro/dto/__tests__/ClassDTO.test.js`

**Step 1: Write the failing test**

Create `iclasspro/dto/__tests__/ClassDTO.test.js`:

```js
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
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="ClassDTO"
```

Expected: FAIL — `ClassDTO.toAirtableFields is not a function`.

**Step 3: Add static method to `iclasspro/dto/ClassDTO.js`**

Add after the constructor's closing `}`, before `module.exports`:

```js
  /**
   * Map a ClassDTO to Airtable field names for ICP_Classes table
   * @param {ClassDTO} cls
   * @returns {Object} Airtable fields object
   */
  static toAirtableFields(cls) {
    return {
      "Class ID": String(cls.id),
      "Class Name": cls.name || "",
      "Schedule": cls.durationSchedule
        ? Object.values(cls.durationSchedule).join(", ")
        : "",
      "Room": cls.room || "",
      "Instructors": cls.instructors ? cls.instructors.join(", ") : "",
      "Max Capacity": cls.occupancy?.max || 0,
    };
  }
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="ClassDTO"
```

Expected: PASS — 2 tests pass.

**Step 5: Commit**

```bash
git add iclasspro/dto/ClassDTO.js iclasspro/dto/__tests__/ClassDTO.test.js
git commit -m "feat(iclasspro): add toAirtableFields to ClassDTO"
```

---

## Task 5: Add Airtable field methods to StudentDTO

**Why:** StudentDTO holds both student data (person) and enrollment data (the class registration). Airtable has separate tables for each, so we need two mapping methods.

**Files:**
- Modify: `iclasspro/dto/StudentDTO.js`
- Create: `iclasspro/dto/__tests__/StudentDTO.test.js`

**Step 1: Write the failing tests**

Create `iclasspro/dto/__tests__/StudentDTO.test.js`:

```js
const StudentDTO = require("../StudentDTO");

describe("StudentDTO", () => {
  const student = new StudentDTO(
    338,           // studentId
    327,           // enrollmentId
    "Cullen",      // firstName
    "Tan",         // lastName
    "7y",          // age
    "M",           // gender
    "ACTIVE",      // enrollmentType
    "2026-02-08",  // startDate
    null,          // dropDate
    "Tan Xiaotian", // familyName
    254,           // familyId
    "2019-01-01",  // birthDate
    null,          // healthConcerns
    { medical: false, allowImage: true, trial: false, waitlist: false, makeup: false }
  );

  describe("toStudentAirtableFields", () => {
    it("maps student fields to Airtable field names with family link", () => {
      const fields = StudentDTO.toStudentAirtableFields(student, "recFAM123");

      expect(fields["Student ID"]).toBe("338");
      expect(fields["First Name"]).toBe("Cullen");
      expect(fields["Last Name"]).toBe("Tan");
      expect(fields["Birth Date"]).toBe("2019-01-01");
      expect(fields["Gender"]).toBe("M");
      expect(fields["Health Concerns"]).toBe("");
      expect(fields["Family"]).toEqual(["recFAM123"]);
    });

    it("omits Family link when no airtable record ID provided", () => {
      const fields = StudentDTO.toStudentAirtableFields(student, null);
      expect(fields["Family"]).toEqual([]);
    });
  });

  describe("toEnrollmentAirtableFields", () => {
    it("maps enrollment fields to Airtable field names with student and class links", () => {
      const fields = StudentDTO.toEnrollmentAirtableFields(
        student,
        "recSTU456",
        "recCLS789"
      );

      expect(fields["Enrollment ID"]).toBe("327");
      expect(fields["Enrollment Type"]).toBe("ACTIVE");
      expect(fields["Start Date"]).toBe("2026-02-08");
      expect(fields["Drop Date"]).toBe("");
      expect(fields["Medical"]).toBe(false);
      expect(fields["Allow Image"]).toBe(true);
      expect(fields["Trial"]).toBe(false);
      expect(fields["Waitlist"]).toBe(false);
      expect(fields["Student"]).toEqual(["recSTU456"]);
      expect(fields["Class"]).toEqual(["recCLS789"]);
    });

    it("omits links when no airtable record IDs provided", () => {
      const fields = StudentDTO.toEnrollmentAirtableFields(student, null, null);
      expect(fields["Student"]).toEqual([]);
      expect(fields["Class"]).toEqual([]);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="StudentDTO"
```

Expected: FAIL — `StudentDTO.toStudentAirtableFields is not a function`.

**Step 3: Add static methods to `iclasspro/dto/StudentDTO.js`**

Add after the constructor's closing `}`, before `module.exports`:

```js
  /**
   * Map student person fields to Airtable field names for ICP_Students table
   * @param {StudentDTO} student
   * @param {string|null} familyAirtableRecordId - Airtable record ID of the parent Family
   * @returns {Object} Airtable fields object
   */
  static toStudentAirtableFields(student, familyAirtableRecordId) {
    return {
      "Student ID": String(student.studentId),
      "First Name": student.firstName || "",
      "Last Name": student.lastName || "",
      "Birth Date": student.birthDate || "",
      "Gender": student.gender || "",
      "Health Concerns": student.healthConcerns || "",
      "Family": familyAirtableRecordId ? [familyAirtableRecordId] : [],
    };
  }

  /**
   * Map enrollment fields to Airtable field names for ICP_Enrollments table
   * @param {StudentDTO} student
   * @param {string|null} studentAirtableRecordId - Airtable record ID of the Student
   * @param {string|null} classAirtableRecordId - Airtable record ID of the Class
   * @returns {Object} Airtable fields object
   */
  static toEnrollmentAirtableFields(
    student,
    studentAirtableRecordId,
    classAirtableRecordId
  ) {
    return {
      "Enrollment ID": String(student.enrollmentId),
      "Enrollment Type": student.enrollmentType || "",
      "Start Date": student.startDate || "",
      "Drop Date": student.dropDate || "",
      "Medical": student.flags?.medical || false,
      "Allow Image": student.flags?.allowImage || false,
      "Trial": student.flags?.trial || false,
      "Waitlist": student.flags?.waitlist || false,
      "Student": studentAirtableRecordId ? [studentAirtableRecordId] : [],
      "Class": classAirtableRecordId ? [classAirtableRecordId] : [],
    };
  }
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="StudentDTO"
```

Expected: PASS — 4 tests pass.

**Step 5: Commit**

```bash
git add iclasspro/dto/StudentDTO.js iclasspro/dto/__tests__/StudentDTO.test.js
git commit -m "feat(iclasspro): add toStudentAirtableFields and toEnrollmentAirtableFields to StudentDTO"
```

---

## Task 6: Create iclasspro/services/airtable.js

**Why:** Core Airtable sync service. Reads JSON, upserts all 5 tables in dependency order, resolves linked record IDs.

**Files:**
- Install: `airtable` package in root `package.json`
- Create: `iclasspro/services/airtable.js`
- Create: `iclasspro/services/__tests__/airtable.test.js`

**Step 1: Install airtable at root level**

```bash
npm install airtable
```

Verify `package.json` now includes `"airtable": "^0.12.2"` (or similar) in dependencies.

**Step 2: Write the failing tests**

Create `iclasspro/services/__tests__/airtable.test.js`:

```js
const IClassProAirtableService = require("../airtable");

// Mock the airtable module
jest.mock("airtable", () => {
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const mockSelect = jest.fn();

  return jest.fn().mockImplementation(() => ({
    base: jest.fn().mockReturnValue(
      jest.fn().mockReturnValue({
        create: mockCreate,
        update: mockUpdate,
        select: mockSelect,
      })
    ),
  }));
});

// Mock config to avoid env var requirements
jest.mock("../../config", () => ({
  airtable: {
    apiKey: "test-key",
    baseId: "test-base",
    familiesTable: "ICP_Families",
    guardiansTable: "ICP_Guardians",
    studentsTable: "ICP_Students",
    classesTable: "ICP_Classes",
    enrollmentsTable: "ICP_Enrollments",
  },
}));

// Build a minimal sync data fixture matching the JSON output shape
function makeFixture() {
  return {
    syncedAt: "2026-02-17T00:00:00.000Z",
    totalClasses: 1,
    classes: [
      {
        id: 31,
        name: "Test Class",
        durationSchedule: { "1-149500": "Sun 1:45 PM-3:00 PM" },
        room: "Test Room",
        instructors: ["Smith, John"],
        occupancy: { max: 10 },
        roster: [
          {
            studentId: 338,
            enrollmentId: 327,
            firstName: "Cullen",
            lastName: "Tan",
            age: "7y",
            gender: "M",
            enrollmentType: "ACTIVE",
            startDate: "2026-02-08",
            dropDate: null,
            familyName: "Tan Xiaotian",
            familyId: 254,
            birthDate: "2019-01-01",
            healthConcerns: null,
            flags: { medical: false, allowImage: true, trial: false, waitlist: false, makeup: false },
            family: {
              familyId: 254,
              familyName: "Xiaotian Tan",
              primaryEmail: "test@example.com",
              primaryPhone: "0412345678",
              guardians: [
                {
                  guardianId: 1234,
                  firstName: "Xiaotian",
                  lastName: "Tan",
                  email: "test@example.com",
                  phone: "0412345678",
                  relationship: null,
                  isPrimary: true,
                },
              ],
              address: { street: "49 Durham Rd", city: "Surrey Hills", state: "VIC", zip: "3127" },
              emergencyContacts: [],
            },
          },
        ],
      },
    ],
  };
}

describe("IClassProAirtableService", () => {
  let service;
  let mockTable;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IClassProAirtableService();

    // Set up mock table with chainable select
    mockTable = {
      create: jest.fn().mockResolvedValue({ id: "recNEW123", fields: {} }),
      update: jest.fn().mockResolvedValue({ id: "recEXIST456", fields: {} }),
      select: jest.fn().mockReturnValue({
        firstPage: jest.fn().mockResolvedValue([]),  // Default: no existing record
      }),
    };
    service.base = jest.fn().mockReturnValue(mockTable);
  });

  describe("findRecord", () => {
    it("returns null when no record found", async () => {
      const result = await service.findRecord("ICP_Families", "Family ID", "999");
      expect(result).toBeNull();
    });

    it("returns the first record when found", async () => {
      const existingRecord = { id: "recABC", fields: { "Family ID": "254" } };
      mockTable.select.mockReturnValue({
        firstPage: jest.fn().mockResolvedValue([existingRecord]),
      });

      const result = await service.findRecord("ICP_Families", "Family ID", "254");
      expect(result).toEqual(existingRecord);
    });
  });

  describe("upsertRecord", () => {
    it("creates a new record when none exists", async () => {
      mockTable.select.mockReturnValue({
        firstPage: jest.fn().mockResolvedValue([]),
      });

      const result = await service.upsertRecord(
        "ICP_Families", "Family ID", "254", { "Family ID": "254", "Family Name": "Test" }
      );

      expect(mockTable.create).toHaveBeenCalledWith({ "Family ID": "254", "Family Name": "Test" });
      expect(result.id).toBe("recNEW123");
    });

    it("updates an existing record when found", async () => {
      const existingRecord = { id: "recEXIST456", fields: {} };
      mockTable.select.mockReturnValue({
        firstPage: jest.fn().mockResolvedValue([existingRecord]),
      });

      await service.upsertRecord(
        "ICP_Families", "Family ID", "254", { "Family Name": "Updated" }
      );

      expect(mockTable.update).toHaveBeenCalledWith("recEXIST456", { "Family Name": "Updated" });
    });
  });

  describe("syncFromJson", () => {
    it("throws if JSON file does not exist", async () => {
      await expect(
        service.syncFromJson("/nonexistent/path.json")
      ).rejects.toThrow("JSON file not found");
    });
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="services/__tests__/airtable"
```

Expected: FAIL — `Cannot find module '../airtable'`.

**Step 4: Create `iclasspro/services/airtable.js`**

```js
const Airtable = require("airtable");
const fs = require("fs");
const config = require("../config");
const FamilyDTO = require("../dto/FamilyDTO");
const ClassDTO = require("../dto/ClassDTO");
const StudentDTO = require("../dto/StudentDTO");

const CHUNK_SIZE = 10;

class IClassProAirtableService {
  constructor() {
    this.base = new Airtable({ apiKey: config.airtable.apiKey }).base(
      config.airtable.baseId
    );
  }

  /**
   * Find a record in a table by field value
   * @returns {Object|null} Airtable record or null
   */
  async findRecord(tableName, fieldName, value) {
    try {
      const records = await this.base(tableName)
        .select({
          filterByFormula: `{${fieldName}} = '${value}'`,
          maxRecords: 1,
        })
        .firstPage();
      return records[0] || null;
    } catch (error) {
      throw new Error(`Airtable find error in ${tableName}: ${error.message}`);
    }
  }

  /**
   * Upsert a single record. Returns the Airtable record (including .id).
   */
  async upsertRecord(tableName, keyField, keyValue, fields) {
    const existing = await this.findRecord(tableName, keyField, keyValue);
    if (existing) {
      return await this.base(tableName).update(existing.id, fields);
    } else {
      return await this.base(tableName).create(fields);
    }
  }

  /**
   * Upsert an array of items in chunks of 10.
   * mapper(item) must return { keyField, keyValue, fields }
   * Returns Map of { itemId -> airtableRecordId }
   */
  async bulkUpsert(tableName, items, mapper, getItemId) {
    const idMap = new Map();

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(
        chunk.map(async (item) => {
          try {
            const { keyField, keyValue, fields } = mapper(item);
            const record = await this.upsertRecord(
              tableName,
              keyField,
              keyValue,
              fields
            );
            return { itemId: getItemId(item), airtableId: record.id };
          } catch (err) {
            console.warn(
              `Failed to upsert record in ${tableName}: ${err.message}`
            );
            return { itemId: getItemId(item), airtableId: null };
          }
        })
      );

      for (const { itemId, airtableId } of results) {
        if (airtableId) idMap.set(itemId, airtableId);
      }
    }

    return idMap;
  }

  /**
   * Upsert all unique families. Returns { familyId -> airtableRecordId } Map.
   */
  async upsertFamilies(classes) {
    const uniqueFamilies = new Map();
    for (const cls of classes) {
      for (const student of cls.roster) {
        if (student.family && !uniqueFamilies.has(student.family.familyId)) {
          uniqueFamilies.set(student.family.familyId, student.family);
        }
      }
    }

    return this.bulkUpsert(
      config.airtable.familiesTable,
      [...uniqueFamilies.values()],
      (family) => ({
        keyField: "Family ID",
        keyValue: String(family.familyId),
        fields: FamilyDTO.toAirtableFields(family),
      }),
      (family) => family.familyId
    );
  }

  /**
   * Upsert all guardians (linked to families). Returns { guardianId -> airtableRecordId } Map.
   */
  async upsertGuardians(classes, familyIdMap) {
    const uniqueGuardians = new Map();
    for (const cls of classes) {
      for (const student of cls.roster) {
        if (student.family) {
          for (const guardian of student.family.guardians || []) {
            if (!uniqueGuardians.has(guardian.guardianId)) {
              uniqueGuardians.set(guardian.guardianId, {
                guardian,
                familyId: student.family.familyId,
              });
            }
          }
        }
      }
    }

    return this.bulkUpsert(
      config.airtable.guardiansTable,
      [...uniqueGuardians.values()],
      ({ guardian, familyId }) => ({
        keyField: "Guardian ID",
        keyValue: String(guardian.guardianId),
        fields: FamilyDTO.toGuardianAirtableFields(
          guardian,
          familyIdMap.get(familyId) || null
        ),
      }),
      ({ guardian }) => guardian.guardianId
    );
  }

  /**
   * Upsert all unique students (linked to families). Returns { studentId -> airtableRecordId } Map.
   */
  async upsertStudents(classes, familyIdMap) {
    const uniqueStudents = new Map();
    for (const cls of classes) {
      for (const student of cls.roster) {
        if (!uniqueStudents.has(student.studentId)) {
          uniqueStudents.set(student.studentId, student);
        }
      }
    }

    return this.bulkUpsert(
      config.airtable.studentsTable,
      [...uniqueStudents.values()],
      (student) => ({
        keyField: "Student ID",
        keyValue: String(student.studentId),
        fields: StudentDTO.toStudentAirtableFields(
          student,
          familyIdMap.get(student.familyId) || null
        ),
      }),
      (student) => student.studentId
    );
  }

  /**
   * Upsert all classes. Returns { classId -> airtableRecordId } Map.
   */
  async upsertClasses(classes) {
    return this.bulkUpsert(
      config.airtable.classesTable,
      classes,
      (cls) => ({
        keyField: "Class ID",
        keyValue: String(cls.id),
        fields: ClassDTO.toAirtableFields(cls),
      }),
      (cls) => cls.id
    );
  }

  /**
   * Upsert all enrollments (linked to students + classes).
   */
  async upsertEnrollments(classes, studentIdMap, classIdMap) {
    const enrollments = [];
    for (const cls of classes) {
      for (const student of cls.roster) {
        enrollments.push({ student, classId: cls.id });
      }
    }

    return this.bulkUpsert(
      config.airtable.enrollmentsTable,
      enrollments,
      ({ student, classId }) => ({
        keyField: "Enrollment ID",
        keyValue: String(student.enrollmentId),
        fields: StudentDTO.toEnrollmentAirtableFields(
          student,
          studentIdMap.get(student.studentId) || null,
          classIdMap.get(classId) || null
        ),
      }),
      ({ student }) => student.enrollmentId
    );
  }

  /**
   * Main entry point: sync all tables from a JSON file.
   * @param {string} jsonPath - Path to iclasspro-*.json file
   * @returns {Object} Summary counts { families, guardians, students, classes, enrollments }
   */
  async syncFromJson(jsonPath) {
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found: ${jsonPath}`);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const classes = data.classes || [];

    const familyIdMap = await this.upsertFamilies(classes);
    const guardianIdMap = await this.upsertGuardians(classes, familyIdMap);
    const studentIdMap = await this.upsertStudents(classes, familyIdMap);
    const classIdMap = await this.upsertClasses(classes);
    await this.upsertEnrollments(classes, studentIdMap, classIdMap);

    return {
      families: familyIdMap.size,
      guardians: guardianIdMap.size,
      students: studentIdMap.size,
      classes: classIdMap.size,
    };
  }
}

module.exports = IClassProAirtableService;
```

**Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="services/__tests__/airtable"
```

Expected: PASS — 4 tests pass.

**Step 6: Run full test suite to check for regressions**

```bash
npm test
```

Expected: All tests pass.

**Step 7: Commit**

```bash
git add iclasspro/services/airtable.js iclasspro/services/__tests__/airtable.test.js package.json package-lock.json
git commit -m "feat(iclasspro): add IClassProAirtableService with 5-table normalized upsert"
```

---

## Task 7: Create command entry points and update package.json

**Why:** Wire up the new commands so `npm run iclasspro:airtable` and `npm run iclasspro:full` work.

**Files:**
- Create: `iclasspro/commands/sync-airtable.js`
- Create: `iclasspro/commands/sync-full.js`
- Modify: `package.json`

**Step 1: Create `iclasspro/commands/sync-airtable.js`**

This command reads the most recent JSON file from `iclasspro/data/` and syncs to Airtable.

```js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const winston = require("winston");
const IClassProAirtableService = require("../services/airtable");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "..", "..", "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "..", "..", "combined.log"),
    }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

function getLatestJsonFile() {
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) {
    throw new Error(`Data directory not found: ${dataDir}. Run 'npm run iclasspro' first.`);
  }

  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.startsWith("iclasspro-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(`No iClassPro JSON files found in ${dataDir}. Run 'npm run iclasspro' first.`);
  }

  return path.join(dataDir, files[0]);
}

async function main() {
  const jsonPath = getLatestJsonFile();
  logger.info(`Syncing to Airtable from: ${jsonPath}`);

  const service = new IClassProAirtableService();
  const summary = await service.syncFromJson(jsonPath);

  logger.info(
    `Airtable sync complete: ${summary.families} families, ${summary.guardians} guardians, ${summary.students} students, ${summary.classes} classes`
  );
}

main().catch((err) => {
  logger.error("Airtable sync failed:", err);
  process.exit(1);
});
```

**Step 2: Create `iclasspro/commands/sync-full.js`**

```js
require("dotenv").config();
const path = require("path");
const winston = require("winston");
const SyncService = require("../services/sync");
const IClassProAirtableService = require("../services/airtable");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "..", "..", "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "..", "..", "combined.log"),
    }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

async function main() {
  // Step 1: Fetch from iClassPro API → save JSON
  logger.info("Step 1/2: Fetching from iClassPro API...");
  const syncService = new SyncService(logger);
  const jsonPath = await syncService.run();
  logger.info(`Step 1/2 complete: saved to ${jsonPath}`);

  // Step 2: Sync JSON → Airtable
  logger.info("Step 2/2: Syncing to Airtable...");
  const airtableService = new IClassProAirtableService();
  const summary = await airtableService.syncFromJson(jsonPath);
  logger.info(
    `Step 2/2 complete: ${summary.families} families, ${summary.guardians} guardians, ${summary.students} students, ${summary.classes} classes`
  );
}

main().catch((err) => {
  logger.error("Full sync failed:", err);
  process.exit(1);
});
```

**Step 3: Add scripts to `package.json`**

In `package.json`, update the `"scripts"` section to add the two new commands:

```json
"iclasspro": "node iclasspro/index.js",
"iclasspro:airtable": "node iclasspro/commands/sync-airtable.js",
"iclasspro:full": "node iclasspro/commands/sync-full.js"
```

**Step 4: Run full test suite to verify nothing is broken**

```bash
npm test
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add iclasspro/commands/sync-airtable.js iclasspro/commands/sync-full.js package.json
git commit -m "feat(iclasspro): add iclasspro:airtable and iclasspro:full commands"
```

---

## Verification

After all tasks are complete, run the full test suite one final time:

```bash
npm test
```

All tests should pass. Then verify the commands are wired up:

```bash
# Check scripts exist
npm run | grep iclasspro
```

Expected output includes:
```
  iclasspro
  iclasspro:airtable
  iclasspro:full
```

To test against real Airtable (requires `.env` with valid credentials and the 5 tables created in Airtable):

```bash
npm run iclasspro:airtable
```
