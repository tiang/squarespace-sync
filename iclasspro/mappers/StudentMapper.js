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
