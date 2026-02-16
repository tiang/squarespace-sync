const FamilyMapper = require("../mappers/FamilyMapper");

/**
 * FamilyService - Fetches family data from iClassPro API
 *
 * Cache-ready interface: adding caching later requires changes only
 * inside getFamily(), with zero impact on callers.
 */
class FamilyService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Fetch a single family by ID
   * @param {number} familyId - Family ID
   * @returns {Promise<FamilyDTO>} Transformed family data
   * @throws {Error} If API call fails
   */
  async getFamily(familyId) {
    try {
      const response = await this.client.get(`/family/${familyId}`);
      return FamilyMapper.transform(response.data);
    } catch (error) {
      throw new Error(
        `Failed to fetch family ${familyId}: ${error.message}`
      );
    }
  }

  /**
   * Fetch multiple families in parallel
   * @param {Array<number>} familyIds - Array of family IDs
   * @returns {Promise<Array<FamilyDTO|null>>} Array of family DTOs (null for failures)
   */
  async getFamilies(familyIds) {
    // Deduplicate and filter out null/undefined
    const uniqueIds = [
      ...new Set(familyIds.filter((id) => id != null)),
    ];

    // Fetch all families in parallel
    const promises = uniqueIds.map(async (id) => {
      try {
        return await this.getFamily(id);
      } catch (error) {
        console.warn(`Failed to fetch family ${id}: ${error.message}`);
        return null; // Return null for failures, continue with others
      }
    });

    return Promise.all(promises);
  }
}

module.exports = FamilyService;
