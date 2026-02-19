# iClassPro → Airtable Sync — Design

## Goal

Sync iClassPro data (classes, enrollments, students, families, guardians) to Airtable for dashboarding and quick data retrieval. Airtable is the visibility layer; a custom database (GCP) will serve as the future platform backend.

**Phase 1 (complete):** Enrich sync output with family data, save to JSON
**Phase 2 (this design):** Sync enriched JSON to Airtable — 5 normalized tables
**Phase 3 (future):** Sync to custom database / GCP platform

## Commands

| Command | Does |
|---------|------|
| `npm run iclasspro` | Fetch from iClassPro API → save to JSON (unchanged) |
| `npm run iclasspro:airtable` | Read latest JSON → upsert 5 Airtable tables |
| `npm run iclasspro:full` | Both in sequence (fetch → JSON → Airtable) |

## Architecture

### New Files

```
iclasspro/
  services/
    airtable.js          ← NEW: Upserts all 5 tables, resolves linked record IDs
  commands/
    sync-api.js          ← NEW: Entry point for `npm run iclasspro`
    sync-airtable.js     ← NEW: Entry point for `npm run iclasspro:airtable`
    sync-full.js         ← NEW: Entry point for `npm run iclasspro:full`
```

### Modified Files

- `iclasspro/dto/FamilyDTO.js` — preserve `guardianId` in guardian objects; add `toAirtableFields()`
- `iclasspro/mappers/FamilyMapper.js` — preserve `guardian.id` as `guardianId` in transformed guardians
- `iclasspro/dto/ClassDTO.js` — add `toAirtableFields()`
- `iclasspro/dto/StudentDTO.js` — add `toAirtableFields()`
- `package.json` — add `iclasspro:airtable` and `iclasspro:full` scripts
- `.env.example` — add `ICLASSPRO_AIRTABLE_*` table name vars

## Airtable Schema — 5 Tables

### ICP_Families

| Field | Type | Source |
|-------|------|--------|
| `Family ID` | Text (unique key) | `familyId` |
| `Family Name` | Text | `familyName` |
| `Primary Email` | Email | `primaryEmail` |
| `Primary Phone` | Phone | `primaryPhone` |
| `Street` | Text | `address.street` |
| `City` | Text | `address.city` |
| `State` | Text | `address.state` |
| `Zip` | Text | `address.zip` |
| `Guardians` | Linked → ICP_Guardians | Resolved during sync |

### ICP_Guardians

| Field | Type | Source |
|-------|------|--------|
| `Guardian ID` | Text (unique key) | `guardianId` |
| `First Name` | Text | `firstName` |
| `Last Name` | Text | `lastName` |
| `Email` | Email | `email` |
| `Phone` | Phone | `phone` |
| `Relationship` | Text | `relationship` |
| `Is Primary` | Checkbox | `isPrimary` |
| `Family` | Linked → ICP_Families | Resolved during sync |

### ICP_Students

| Field | Type | Source |
|-------|------|--------|
| `Student ID` | Text (unique key) | `studentId` |
| `First Name` | Text | `firstName` |
| `Last Name` | Text | `lastName` |
| `Birth Date` | Date | `birthDate` |
| `Gender` | Text | `gender` |
| `Health Concerns` | Long text | `healthConcerns` |
| `Family` | Linked → ICP_Families | Resolved during sync |

### ICP_Classes

| Field | Type | Source |
|-------|------|--------|
| `Class ID` | Text (unique key) | `id` |
| `Class Name` | Text | `name` |
| `Schedule` | Text | `durationSchedule` |
| `Room` | Text | `room` |
| `Instructors` | Text | `instructors[]` joined |
| `Max Capacity` | Number | `occupancy.max` |

### ICP_Enrollments

| Field | Type | Source |
|-------|------|--------|
| `Enrollment ID` | Text (unique key) | `enrollmentId` |
| `Enrollment Type` | Text | `enrollmentType` |
| `Start Date` | Date | `startDate` |
| `Drop Date` | Date | `dropDate` |
| `Medical` | Checkbox | `flags.medical` |
| `Allow Image` | Checkbox | `flags.allowImage` |
| `Trial` | Checkbox | `flags.trial` |
| `Waitlist` | Checkbox | `flags.waitlist` |
| `Student` | Linked → ICP_Students | Resolved during sync |
| `Class` | Linked → ICP_Classes | Resolved during sync |

## Data Flow

### `iclasspro:airtable`

```
Read latest JSON from iclasspro/data/
  → Upsert ICP_Families   → store { familyId → airtableRecordId } map
  → Upsert ICP_Guardians  → linked to Family airtable IDs
  → Upsert ICP_Students   → linked to Family airtable IDs
  → Upsert ICP_Classes    → store { classId → airtableRecordId } map
  → Upsert ICP_Enrollments → linked to Student + Class airtable IDs
```

**Upsert order matters** — each table depends on Airtable record IDs from prior tables.

### `iclasspro:full`

Runs `iclasspro` (fetch → JSON) then `iclasspro:airtable` (JSON → Airtable) in sequence.
If the API fetch fails, Airtable sync is skipped.

### Upsert Strategy

Same pattern as Squarespace sync:
- Find by unique ID field (e.g. `filterByFormula: {Family ID} = '...'`)
- If found → update; if not found → create
- Batch in chunks of 10 to respect Airtable rate limits

## FamilyMapper Change

`guardian.id` is currently used to join emails/phones but then dropped. It must be preserved:

```js
// Before
{ firstName, lastName, email, phone, relationship, isPrimary }

// After
{ guardianId, firstName, lastName, email, phone, relationship, isPrimary }
```

FamilyDTO guardian schema updated to match.

## Error Handling

- Per-record failures caught individually — one bad record doesn't block the rest
- Missing linked record (e.g. family enrichment failed → student has no family) — skip the link, log a warning
- Airtable API errors — log with record ID and continue
- No JSON file present when running `iclasspro:airtable` — fail fast with a clear error message
- `iclasspro:full` — if fetch step fails, Airtable sync is skipped entirely

## Environment Variables

Uses existing `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`. Add table name vars:

```
ICLASSPRO_AIRTABLE_FAMILIES_TABLE=ICP_Families
ICLASSPRO_AIRTABLE_GUARDIANS_TABLE=ICP_Guardians
ICLASSPRO_AIRTABLE_STUDENTS_TABLE=ICP_Students
ICLASSPRO_AIRTABLE_CLASSES_TABLE=ICP_Classes
ICLASSPRO_AIRTABLE_ENROLLMENTS_TABLE=ICP_Enrollments
```
