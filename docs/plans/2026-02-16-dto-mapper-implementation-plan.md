# DTO and Mapper Pattern Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate data transformation logic from API services using DTOs (pure data structures) and Mappers (transformation logic).

**Architecture:** Create DTO files defining data shapes, Mapper files with transformation logic, simplify services to return raw API data, update SyncService to use mappers.

**Tech Stack:** Node.js, plain JavaScript (no TypeScript, no build step)

---

### Task 1: Create ClassDTO

**Files:**
- Create: `iclasspro/dto/ClassDTO.js`

**Step 1: Create ClassDTO.js**

```javascript
/**
 * ClassDTO - Pure data structure for iClassPro class data
 *
 * Defines the shape of a class object after transformation.
 * No transformation logic - see ClassMapper for that.
 */
class ClassDTO {
  /**
   * @param {number} id - Class ID
   * @param {string} name - Class name
   * @param {Object} schedule - Schedule with timeslots
   * @param {string[]} schedule.schedules - Array of timeslot IDs
   * @param {number[]} schedule.durations - Array of durations in seconds
   * @param {Object} durationSchedule - Display strings keyed by day-tsId
   * @param {string} room - Room/location name
   * @param {string[]} instructors - Array of instructor names
   * @param {Object} occupancy - Class capacity info
   * @param {number} occupancy.active - Active enrollments
   * @param {number} occupancy.max - Maximum capacity
   * @param {number} occupancy.openings - Available spots
   * @param {number} occupancy.seatsFilled - Seats filled
   * @param {number} occupancy.waitlist - Waitlist count
   */
  constructor(
    id,
    name,
    schedule,
    durationSchedule,
    room,
    instructors,
    occupancy
  ) {
    this.id = id;
    this.name = name;
    this.schedule = schedule;
    this.durationSchedule = durationSchedule;
    this.room = room;
    this.instructors = instructors;
    this.occupancy = occupancy;
  }
}

module.exports = ClassDTO;
```

**Step 2: Commit**

```bash
git add iclasspro/dto/ClassDTO.js
git commit -m "feat(iclasspro): add ClassDTO data structure"
```

---

### Task 2: Create StudentDTO

**Files:**
- Create: `iclasspro/dto/StudentDTO.js`

**Step 1: Create StudentDTO.js**

```javascript
/**
 * StudentDTO - Pure data structure for iClassPro student data
 *
 * Defines the shape of a student/enrollment object after transformation.
 * No transformation logic - see StudentMapper for that.
 */
class StudentDTO {
  /**
   * @param {number} studentId - Student ID
   * @param {number} enrollmentId - Enrollment ID
   * @param {string} firstName - Student first name
   * @param {string} lastName - Student last name
   * @param {string} age - Student age (e.g., "7y")
   * @param {string} gender - Gender ("M", "F", or other)
   * @param {string} enrollmentType - Enrollment type ("ACTIVE", "WAITLIST", etc.)
   * @param {string} startDate - Enrollment start date (ISO string)
   * @param {string|null} dropDate - Drop date (ISO string) or null
   * @param {string} familyName - Family name
   * @param {number} familyId - Family ID
   * @param {string} birthDate - Birth date (ISO string)
   * @param {string|null} healthConcerns - Health concerns or null
   * @param {Object} flags - Boolean flags
   * @param {boolean} flags.medical - Has medical flag
   * @param {boolean} flags.allowImage - Photo permission
   * @param {boolean} flags.trial - Is trial enrollment
   * @param {boolean} flags.waitlist - Is waitlisted
   * @param {boolean} flags.makeup - Is makeup class
   */
  constructor(
    studentId,
    enrollmentId,
    firstName,
    lastName,
    age,
    gender,
    enrollmentType,
    startDate,
    dropDate,
    familyName,
    familyId,
    birthDate,
    healthConcerns,
    flags
  ) {
    this.studentId = studentId;
    this.enrollmentId = enrollmentId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
    this.gender = gender;
    this.enrollmentType = enrollmentType;
    this.startDate = startDate;
    this.dropDate = dropDate;
    this.familyName = familyName;
    this.familyId = familyId;
    this.birthDate = birthDate;
    this.healthConcerns = healthConcerns;
    this.flags = flags;
  }
}

module.exports = StudentDTO;
```

**Step 2: Commit**

```bash
git add iclasspro/dto/StudentDTO.js
git commit -m "feat(iclasspro): add StudentDTO data structure"
```

---

### Task 3: Create ClassMapper

**Files:**
- Create: `iclasspro/mappers/ClassMapper.js`

**Step 1: Create ClassMapper.js**

```javascript
const ClassDTO = require("../dto/ClassDTO");

/**
 * ClassMapper - Transforms raw iClassPro class API data to ClassDTO
 */
class ClassMapper {
  /**
   * Transform raw class data from API to ClassDTO
   * @param {Object} rawClass - Raw class object from /api/v1/class-list/
   * @returns {ClassDTO} Transformed class data
   * @throws {Error} If required fields are missing
   */
  static transform(rawClass) {
    // Validate required fields
    if (!rawClass.value) {
      throw new Error(
        `ClassMapper: Missing required field 'id' in class '${rawClass.name || "unknown"}'`
      );
    }
    if (!rawClass.name) {
      throw new Error(
        `ClassMapper: Missing required field 'name' in class ID ${rawClass.value}`
      );
    }

    // Extract fields with defaults
    const id = rawClass.value;
    const name = rawClass.name;
    const schedule = rawClass.schedule || {};
    const durationSchedule = rawClass.durationSchedule || {};
    const room = rawClass.room || "";
    const instructors = rawClass.instructor || [];

    // Extract occupancy with defaults
    const occupancy = {
      active: rawClass.occupancy?.active || 0,
      max: rawClass.occupancy?.max || 0,
      openings: rawClass.occupancy?.openings || 0,
      seatsFilled: rawClass.occupancy?.seatsFilled || 0,
      waitlist: rawClass.occupancy?.waitlist || 0,
    };

    return new ClassDTO(
      id,
      name,
      schedule,
      durationSchedule,
      room,
      instructors,
      occupancy
    );
  }
}

module.exports = ClassMapper;
```

**Step 2: Verify ClassMapper works**

Run from project root:
```bash
node -e "
const ClassMapper = require('./iclasspro/mappers/ClassMapper');
const testClass = {
  value: 31,
  name: 'Test Class',
  schedule: { schedules: ['149500'], durations: [4500] },
  durationSchedule: { '1-149500': 'Sun 1:45 PM-3:00 PM' },
  room: 'Test Room',
  instructor: ['Test Instructor'],
  occupancy: { active: 7, max: 14, openings: 7, seatsFilled: 7, waitlist: 0 }
};
const result = ClassMapper.transform(testClass);
console.log('ClassMapper test:', result.id === 31 ? 'PASS' : 'FAIL');
"
```
Expected: `ClassMapper test: PASS`

**Step 3: Commit**

```bash
git add iclasspro/mappers/ClassMapper.js
git commit -m "feat(iclasspro): add ClassMapper for class data transformation"
```

---

### Task 4: Create StudentMapper

**Files:**
- Create: `iclasspro/mappers/StudentMapper.js`

**Step 1: Create StudentMapper.js**

```javascript
const StudentDTO = require("../dto/StudentDTO");

/**
 * StudentMapper - Transforms raw iClassPro student/roster API data to StudentDTO
 */
class StudentMapper {
  /**
   * Transform raw student data from API to StudentDTO
   * @param {Object} rawStudent - Raw student object from /api/v1/roster/classes/{classId}/{date}/{tsId}
   * @returns {StudentDTO} Transformed student data
   * @throws {Error} If required fields are missing
   */
  static transform(rawStudent) {
    // Validate required fields
    const requiredFields = [
      { field: "id", name: "studentId" },
      { field: "enrollmentId", name: "enrollmentId" },
      { field: "firstName", name: "firstName" },
      { field: "lastName", name: "lastName" },
    ];

    for (const { field, name } of requiredFields) {
      if (!rawStudent[field]) {
        const studentName = `${rawStudent.firstName || "unknown"} ${rawStudent.lastName || "unknown"}`;
        throw new Error(
          `StudentMapper: Missing required field '${name}' for student '${studentName}'`
        );
      }
    }

    // Validate date format if provided (basic check)
    const validateDate = (dateStr, fieldName) => {
      if (dateStr && typeof dateStr === "string" && dateStr.length > 0) {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(
            `StudentMapper: Invalid date format for '${fieldName}': ${dateStr}`
          );
        }
      }
    };

    validateDate(rawStudent.startDate, "startDate");
    validateDate(rawStudent.birthDate, "birthDate");

    // Extract fields with defaults
    const studentId = rawStudent.id;
    const enrollmentId = rawStudent.enrollmentId;
    const firstName = rawStudent.firstName;
    const lastName = rawStudent.lastName;
    const age = rawStudent.age || null;
    const gender = rawStudent.gender || null;
    const enrollmentType = rawStudent.type || null;
    const startDate = rawStudent.startDate || null;
    const dropDate = rawStudent.dropDate || null;
    const familyName = rawStudent.familyName || null;
    const familyId = rawStudent.familyId || null;
    const birthDate = rawStudent.birthDate || null;
    const healthConcerns = rawStudent.healthConcerns || null;

    // Extract flags with defaults
    const flags = {
      medical: rawStudent.flags?.medical || false,
      allowImage: rawStudent.flags?.allowImage || false,
      trial: rawStudent.flags?.trial || false,
      waitlist: rawStudent.flags?.waitlist || false,
      makeup: rawStudent.flags?.makeup || false,
    };

    return new StudentDTO(
      studentId,
      enrollmentId,
      firstName,
      lastName,
      age,
      gender,
      enrollmentType,
      startDate,
      dropDate,
      familyName,
      familyId,
      birthDate,
      healthConcerns,
      flags
    );
  }
}

module.exports = StudentMapper;
```

**Step 2: Verify StudentMapper works**

Run from project root:
```bash
node -e "
const StudentMapper = require('./iclasspro/mappers/StudentMapper');
const testStudent = {
  id: 338,
  enrollmentId: 327,
  firstName: 'Test',
  lastName: 'Student',
  age: '7y',
  gender: 'M',
  type: 'ACTIVE',
  startDate: '2026-02-08',
  dropDate: null,
  familyName: 'Test Family',
  familyId: 254,
  birthDate: '2019-01-01',
  healthConcerns: null,
  flags: { medical: false, allowImage: true, trial: false, waitlist: false, makeup: false }
};
const result = StudentMapper.transform(testStudent);
console.log('StudentMapper test:', result.studentId === 338 ? 'PASS' : 'FAIL');
"
```
Expected: `StudentMapper test: PASS`

**Step 3: Commit**

```bash
git add iclasspro/mappers/StudentMapper.js
git commit -m "feat(iclasspro): add StudentMapper for student data transformation"
```

---

### Task 5: Simplify RosterService

**Files:**
- Modify: `iclasspro/services/roster.js:6-34`

**Step 1: Remove transformation logic from RosterService**

Replace the entire `getRoster` method with:

```javascript
async getRoster(classId, date, tsId) {
  const response = await this.client.get(
    `/roster/classes/${classId}/${date}/${tsId}`
  );
  return response.data.data || response.data;
}
```

The full file should now be:

```javascript
class RosterService {
  constructor(client) {
    this.client = client;
  }

  async getRoster(classId, date, tsId) {
    const response = await this.client.get(
      `/roster/classes/${classId}/${date}/${tsId}`
    );
    return response.data.data || response.data;
  }
}

module.exports = RosterService;
```

**Step 2: Commit**

```bash
git add iclasspro/services/roster.js
git commit -m "refactor(iclasspro): simplify RosterService to return raw API data"
```

---

### Task 6: Update SyncService to use Mappers

**Files:**
- Modify: `iclasspro/services/sync.js:1-67`

**Step 1: Add mapper imports at top of file**

Add after the existing requires:

```javascript
const ClassMapper = require("../mappers/ClassMapper");
const StudentMapper = require("../mappers/StudentMapper");
```

**Step 2: Replace transformation logic in sync loop**

Find the for loop (around lines 31-67) and replace the transformation section:

Replace this code:
```javascript
const roster = await rosterService.getRoster(cls.value, today, tsId);
const scheduleKey = Object.keys(cls.durationSchedule || {})[0];
const scheduleDisplay = cls.durationSchedule?.[scheduleKey] || "";

classesWithRosters.push({
  id: cls.value,
  name: cls.name,
  schedule: scheduleDisplay,
  room: cls.room,
  instructors: cls.instructor || [],
  occupancy: {
    active: cls.occupancy?.active || 0,
    max: cls.occupancy?.max || 0,
    openings: cls.occupancy?.openings || 0,
    seatsFilled: cls.occupancy?.seatsFilled || 0,
    waitlist: cls.occupancy?.waitlist || 0,
  },
  roster,
});
```

With this:
```javascript
const rawRoster = await rosterService.getRoster(cls.value, today, tsId);

classesWithRosters.push({
  ...ClassMapper.transform(cls),
  roster: rawRoster.map((s) => StudentMapper.transform(s)),
});
```

**Step 3: Update logger call**

The logger call references `roster.length` — update it to `rawRoster.length`:

```javascript
this.logger.info(`  ${cls.name}: ${rawRoster.length} students enrolled`);
```

**Step 4: Commit**

```bash
git add iclasspro/services/sync.js
git commit -m "refactor(iclasspro): use mappers for data transformation in SyncService"
```

---

### Task 7: End-to-End Verification

**Files:**
- None (verification only)

**Step 1: Run full sync**

Run from project root:
```bash
npm run iclasspro
```

Expected output:
- Login success
- Class count logged
- Each class shows student count
- JSON file saved to `iclasspro/data/iclasspro-{timestamp}.json`
- No errors

**Step 2: Verify output structure**

Check the JSON output matches the expected shape:
```bash
ls -t iclasspro/data/ | head -1 | xargs -I {} cat "iclasspro/data/{}" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
const sample = data.classes[0];
const hasId = 'id' in sample;
const hasSchedule = 'schedule' in sample && 'schedules' in sample.schedule;
const hasDurationSchedule = 'durationSchedule' in sample;
const hasOccupancy = 'occupancy' in sample && 'active' in sample.occupancy;
console.log('Structure validation:', hasId && hasSchedule && hasDurationSchedule && hasOccupancy ? 'PASS' : 'FAIL');
if (sample.roster && sample.roster.length > 0) {
  const student = sample.roster[0];
  const hasStudentId = 'studentId' in student;
  const hasFlags = 'flags' in student && 'medical' in student.flags;
  console.log('Student structure:', hasStudentId && hasFlags ? 'PASS' : 'FAIL');
}
"
```

Expected:
```
Structure validation: PASS
Student structure: PASS
```

**Step 3: Final commit (if any cleanup needed)**

If everything works, no commit needed. If you made any adjustments during verification, commit them:

```bash
git add .
git commit -m "chore(iclasspro): finalize DTO/Mapper implementation"
```

---

## Verification Summary

After completing all tasks, verify:
- [ ] DTOs created with pure data structures (no logic)
- [ ] Mappers created with transformation + validation logic
- [ ] RosterService simplified to return raw data
- [ ] SyncService uses mappers for transformation
- [ ] Full sync runs successfully
- [ ] JSON output structure matches expected shape
- [ ] All commits follow conventional commit format

## Next Steps

After this PR:
1. Create separate PR to refactor `sync/dto/OrderDTO.js` using same DTO+Mapper pattern
2. Add unit tests for mappers (when test framework is set up)
3. Implement bidirectional transforms (`toApi()` methods) when POST/PUT functionality is added
