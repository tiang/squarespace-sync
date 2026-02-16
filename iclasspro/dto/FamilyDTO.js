/**
 * FamilyDTO - Pure data structure for iClassPro family data
 *
 * Defines the shape of a family object after transformation.
 * No transformation logic - see FamilyMapper for that.
 */
class FamilyDTO {
  /**
   * @param {number} familyId - Family ID
   * @param {string} familyName - Family name
   * @param {string|null} primaryEmail - Primary email
   * @param {string|null} primaryPhone - Primary phone
   * @param {Array<Object>} guardians - Array of guardian objects
   * @param {Object|null} address - Address object
   * @param {Array<Object>} emergencyContacts - Array of emergency contact objects
   */
  constructor(
    familyId,
    familyName,
    primaryEmail,
    primaryPhone,
    guardians,
    address,
    emergencyContacts
  ) {
    this.familyId = familyId;
    this.familyName = familyName;
    this.primaryEmail = primaryEmail;
    this.primaryPhone = primaryPhone;
    this.guardians = guardians || [];
    this.address = address;
    this.emergencyContacts = emergencyContacts || [];
  }
}

module.exports = FamilyDTO;
