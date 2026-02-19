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

  /**
   * Map a ClassDTO to Airtable field names for ICP_Classes table
   * @param {ClassDTO} cls
   * @param {string[]} [studentAirtableRecordIds] - Airtable record IDs of enrolled students
   * @returns {Object} Airtable fields object
   */
  static toAirtableFields(cls, studentAirtableRecordIds) {
    const fields = {
      "Class ID": String(cls.id),
      "Class Name": cls.name || "",
      "Schedule": cls.durationSchedule
        ? Object.values(cls.durationSchedule).join(", ")
        : "",
      "Room": cls.room || "",
      "Instructors": cls.instructors ? cls.instructors.join(", ") : "",
      "Max Capacity": cls.occupancy?.max || 0,
    };
    if (studentAirtableRecordIds && studentAirtableRecordIds.length > 0) {
      fields["ICP_Students"] = studentAirtableRecordIds;
    }
    return fields;
  }
}

module.exports = ClassDTO;
