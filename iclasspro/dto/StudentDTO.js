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
