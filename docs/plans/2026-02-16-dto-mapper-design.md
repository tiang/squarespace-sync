# iClassPro DTOs and Mappers — Design

## Goal

Separate data transformation logic from API services using DTOs (pure data structures) and Mappers (transformation logic).

## Current State

- `RosterService` contains transformation logic (lines 12-33)
- `SyncService` contains transformation logic (lines 41-59)
- `OrderDTO` mixes data structure + transformation (tech debt to refactor separately)

## Proposed Architecture

### DTO Pattern (Pure Data Structures)

DTOs define data shapes without transformation logic. They serve as contracts for what data looks like after transformation.

**Benefits:**
- Clear data contracts
- Type safety (future TypeScript migration)
- No logic, just structure
- Easy to document and test

### Mapper Pattern (Transformation Logic)

Mappers handle all transformation, validation, and normalization logic.

**Benefits:**
- Single responsibility (only transforms data)
- Testable in isolation
- Centralized transformation rules
- Easy to mock for testing

## Module Structure

```
iclasspro/
  dto/
    ClassDTO.js       — Class data structure definition
    StudentDTO.js     — Student data structure definition
  mappers/
    ClassMapper.js    — Transforms raw API → ClassDTO
    StudentMapper.js  — Transforms raw API → StudentDTO
  services/
    classes.js        — Thin API client (returns raw data)
    roster.js         — Thin API client (returns raw data)
    sync.js           — Orchestrates, calls mappers
```

## DTO Specifications

### ClassDTO

**Structure:**
```javascript
{
  id: number,                    // Class ID
  name: string,                  // Class name
  schedule: {                    // Schedule object with timeslots
    schedules: string[],         // Array of timeslot IDs
    durations: number[]          // Array of duration in seconds
  },
  durationSchedule: {            // Display strings keyed by day-tsId
    "1-149500": "Sun 1:45 PM-3:00 PM"
  },
  room: string,                  // Room/location name
  instructors: string[],         // Array of instructor names
  occupancy: {                   // Class capacity info
    active: number,
    max: number,
    openings: number,
    seatsFilled: number,
    waitlist: number
  }
}
```

**Fields:**
- All fields map directly from raw API response
- No computed/derived fields
- Defines shape only, no validation

### StudentDTO

**Structure:**
```javascript
{
  studentId: number,
  enrollmentId: number,
  firstName: string,
  lastName: string,
  age: string,                   // e.g., "7y"
  gender: string,                // "M", "F", or other
  enrollmentType: string,        // "ACTIVE", "WAITLIST", etc.
  startDate: string,             // ISO date string
  dropDate: string | null,       // ISO date string or null
  familyName: string,
  familyId: number,
  birthDate: string,             // ISO date string
  healthConcerns: string | null,
  flags: {
    medical: boolean,
    allowImage: boolean,
    trial: boolean,
    waitlist: boolean,
    makeup: boolean
  }
}
```

**Fields:**
- All fields from raw roster API response
- Null for optional missing fields
- Boolean flags default to false if missing

## Mapper Specifications

### ClassMapper

**Static method:**
```javascript
ClassMapper.transform(rawClass)
```

**Input:** Raw class object from `/api/v1/class-list/` POST response

**Output:** ClassDTO instance

**Validation:**
- Required fields: `id`, `name`
- Throws error if required fields missing (includes class info in error message)

**Defaults:**
- Empty object `{}` for `schedule` if missing
- Empty object `{}` for `durationSchedule` if missing
- Empty string `""` for `room` if missing
- Empty array `[]` for `instructors` if missing
- Zero for all `occupancy` fields if missing

**Error handling:**
- Descriptive errors: `"ClassMapper: Missing required field 'id' in class '${rawClass.name}'"`
- Includes context (class name/id) for debugging

### StudentMapper

**Static method:**
```javascript
StudentMapper.transform(rawStudent)
```

**Input:** Raw student object from `/api/v1/roster/classes/{classId}/{date}/{tsId}` GET response

**Output:** StudentDTO instance

**Validation:**
- Required fields: `studentId`, `enrollmentId`, `firstName`, `lastName`
- Optional fields: all others (null if missing)
- Date validation: if `startDate` or `birthDate` provided, validate format
- Throws error if required fields missing

**Defaults:**
- `null` for all optional string fields
- `false` for all flag booleans if missing
- Empty object `{}` for `flags` if missing

**Error handling:**
- Descriptive errors: `"StudentMapper: Missing required field 'studentId' for student '${rawStudent.firstName} ${rawStudent.lastName}'"`
- Includes student context for debugging

## Service Changes

### ClassesService

No changes needed — already returns raw API data.

### RosterService

**Remove transformation logic (lines 12-33):**

```javascript
// BEFORE
async getRoster(classId, date, tsId) {
  const response = await this.client.get(
    `/roster/classes/${classId}/${date}/${tsId}`
  );
  const students = response.data.data || response.data;

  return students.map((s) => ({
    studentId: s.id,
    enrollmentId: s.enrollmentId,
    // ... transformation logic
  }));
}

// AFTER
async getRoster(classId, date, tsId) {
  const response = await this.client.get(
    `/roster/classes/${classId}/${date}/${tsId}`
  );
  return response.data.data || response.data;
}
```

### SyncService

**Add mapper imports and call mappers:**

```javascript
const ClassMapper = require('../mappers/ClassMapper');
const StudentMapper = require('../mappers/StudentMapper');

// In sync loop (replace lines 41-59):
for (const rawClass of classList) {
  const tsId = rawClass.schedule?.schedules?.[0];
  if (!tsId) {
    this.logger.warn(
      `Class ${rawClass.name} (${rawClass.value}) has no timeslot, skipping`
    );
    continue;
  }

  try {
    const rawRoster = await rosterService.getRoster(
      rawClass.value,
      today,
      tsId
    );

    classesWithRosters.push({
      ...ClassMapper.transform(rawClass),
      roster: rawRoster.map((s) => StudentMapper.transform(s)),
    });

    this.logger.info(
      `  ${rawClass.name}: ${rawRoster.length} students enrolled`
    );
  } catch (err) {
    this.logger.error(
      `Failed to fetch roster for ${rawClass.name}: ${err.message}`
    );
  }
}
```

## Future: Bidirectional Transforms

When POST/PUT functionality is added, mappers will gain reverse methods:

```javascript
ClassMapper.toApi(classDTO)      // ClassDTO → raw API format
StudentMapper.toApi(studentDTO)  // StudentDTO → raw API format
```

This prepares for create/update operations without changing the DTO structure.

## Tech Debt: OrderDTO Refactoring

`sync/dto/OrderDTO.js` currently mixes DTO + Mapper patterns. Should be refactored separately:

```
sync/
  dto/
    OrderDTO.js        — Pure data structure
  mappers/
    OrderMapper.js     — Transformation logic from OrderDTO
```

This refactoring should be a **separate PR** to avoid mixing concerns.

## Benefits

1. **Clearer separation of concerns** — Services fetch, Mappers transform, DTOs define shape
2. **Easier testing** — Test mappers without mocking HTTP, test services without transformation logic
3. **Better maintainability** — Find transformation logic in one place (mappers), not scattered
4. **Future-proof** — Easy to add reverse transforms for POST/PUT
5. **Consistent pattern** — Once OrderDTO is refactored, entire codebase follows DTO+Mapper pattern
