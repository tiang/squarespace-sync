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
