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
