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
