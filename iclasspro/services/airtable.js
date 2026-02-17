const Airtable = require("airtable");
const fs = require("fs");
const config = require("../config");
const FamilyDTO = require("../dto/FamilyDTO");
const ClassDTO = require("../dto/ClassDTO");
const StudentDTO = require("../dto/StudentDTO");
const RosterDTO = require("../dto/RosterDTO");

const CHUNK_SIZE = 10;

class IClassProAirtableService {
  constructor(logger = console) {
    this.logger = logger;
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
      const escaped = String(value).replace(/'/g, "\\'");
      const records = await this.base(tableName)
        .select({
          filterByFormula: `{${fieldName}} = '${escaped}'`,
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
   * getItemId(item) returns the item's own ID for the result map.
   * Returns { idMap: Map<itemId -> airtableRecordId>, failed: number }
   */
  async bulkUpsert(tableName, items, mapper, getItemId) {
    const idMap = new Map();
    let failed = 0;

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
            this.logger.warn(
              `Failed to upsert record in ${tableName}: ${err.message}`
            );
            return { itemId: getItemId(item), airtableId: null };
          }
        })
      );

      for (const { itemId, airtableId } of results) {
        if (airtableId) {
          idMap.set(itemId, airtableId);
        } else {
          failed++;
        }
      }
    }

    return { idMap, failed };
  }

  /**
   * Upsert all unique families. Returns { idMap, failed }.
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
   * Upsert all guardians (linked to families). Returns { idMap, failed }.
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
   * Upsert all unique students (linked to families). Returns { idMap, failed }.
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
   * Upsert all classes (linked to enrolled students). Returns { idMap, failed }.
   */
  async upsertClasses(classes, studentIdMap) {
    return this.bulkUpsert(
      config.airtable.classesTable,
      classes,
      (cls) => {
        const studentRecordIds = (cls.roster || [])
          .map((s) => studentIdMap.get(s.studentId))
          .filter(Boolean);
        return {
          keyField: "Class ID",
          keyValue: String(cls.id),
          fields: ClassDTO.toAirtableFields(cls, studentRecordIds),
        };
      },
      (cls) => cls.id
    );
  }

  /**
   * Upsert all enrollments (linked to students + classes). Returns { idMap, failed }.
   */
  async upsertEnrollments(classes, studentIdMap, classIdMap) {
    const uniqueEnrollments = new Map();
    for (const cls of classes) {
      for (const student of cls.roster) {
        if (!uniqueEnrollments.has(student.enrollmentId)) {
          uniqueEnrollments.set(student.enrollmentId, { student, classId: cls.id });
        }
      }
    }

    return this.bulkUpsert(
      config.airtable.enrollmentsTable,
      [...uniqueEnrollments.values()],
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

  /**
   * Main entry point: sync all tables from a JSON file.
   * @param {string} jsonPath - Path to iclasspro-*.json file
   * @returns {Object} Summary counts per table: { succeeded, attempted }
   */
  async syncFromJson(jsonPath) {
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found: ${jsonPath}`);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const classes = data.classes || [];

    const familyResult = await this.upsertFamilies(classes);
    const guardianResult = await this.upsertGuardians(classes, familyResult.idMap);
    const studentResult = await this.upsertStudents(classes, familyResult.idMap);
    const classResult = await this.upsertClasses(classes, studentResult.idMap);
    const enrollmentResult = await this.upsertEnrollments(
      classes,
      studentResult.idMap,
      classResult.idMap
    );
    const rosterResult = await this.upsertRoster(classes);

    const tally = (result) => ({
      succeeded: result.idMap.size,
      attempted: result.idMap.size + result.failed,
    });

    return {
      families: tally(familyResult),
      guardians: tally(guardianResult),
      students: tally(studentResult),
      classes: tally(classResult),
      enrollments: tally(enrollmentResult),
      roster: tally(rosterResult),
    };
  }
}

module.exports = IClassProAirtableService;
