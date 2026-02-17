# ICP_Roster Denormalized Table Design

## Goal

Add a 6th Airtable table (`ICP_Roster`) that flattens all entity data into one row per enrollment for admin overview. Synced alongside the existing 5 normalized tables.

## Row Key

`Enrollment ID` — deduplicated the same way as the enrollments table.

## Fields

| Field | Source | Airtable Type |
|---|---|---|
| Enrollment ID | student.enrollmentId | singleLineText (PK) |
| Enrollment Type | student.enrollmentType | singleLineText |
| Start Date | student.startDate | date |
| Drop Date | student.dropDate | date |
| Trial | student.flags.trial | checkbox |
| Waitlist | student.flags.waitlist | checkbox |
| Makeup | student.flags.makeup | checkbox |
| Medical | student.flags.medical | checkbox |
| Allow Image | student.flags.allowImage | checkbox |
| Student ID | student.studentId | singleLineText |
| Student First Name | student.firstName | singleLineText |
| Student Last Name | student.lastName | singleLineText |
| Student Age | student.age | singleLineText |
| Student Gender | student.gender | singleLineText |
| Birth Date | student.birthDate | date |
| Health Concerns | student.healthConcerns | multilineText |
| Class ID | cls.id | singleLineText |
| Class Name | cls.name | singleLineText |
| Schedule | cls.durationSchedule values joined | singleLineText |
| Room | cls.room | singleLineText |
| Instructors | cls.instructors joined | singleLineText |
| Max Capacity | cls.occupancy.max | number |
| Active Enrollments | cls.occupancy.active | number |
| Openings | cls.occupancy.openings | number |
| Seats Filled | cls.occupancy.seatsFilled | number |
| Waitlist Count | cls.occupancy.waitlist | number |
| Family ID | family.familyId | singleLineText |
| Family Name | family.familyName | singleLineText |
| Primary Email | family.primaryEmail | email |
| Primary Phone | family.primaryPhone | phoneNumber |
| Street | family.address.street | singleLineText |
| City | family.address.city | singleLineText |
| State | family.address.state | singleLineText |
| Zip | family.address.zip | singleLineText |
| Guardian Name | first guardian: first + last | singleLineText |
| Guardian Email | first guardian email | email |
| Guardian Phone | first guardian phone | phoneNumber |
| Guardian Relationship | first guardian relationship | singleLineText |

## Guardian Rule

Pick the first guardian from `student.family.guardians[0]`. If no guardians exist, leave fields empty.

## Implementation

1. `RosterDTO` — new DTO with static `toAirtableFields(student, cls)` that flattens all fields
2. `upsertRoster` — new method in `IClassProAirtableService`, uses `bulkUpsert` keyed by Enrollment ID, no linked record fields needed
3. `syncFromJson` — call `upsertRoster` after existing 5 tables
4. `create-airtable-tables.js` — add roster table schema (no linked record fields, just flat data)
5. Config — `ICLASSPRO_AIRTABLE_ROSTER_TABLE` env var, default `"ICP_Roster"`
6. Tests — RosterDTO unit tests, airtable service integration test coverage
