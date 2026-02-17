/**
 * FamilyDTO - Pure data structure for iClassPro family data
 *
 * Defines the shape of a family object after transformation.
 * No transformation logic - see FamilyMapper for that.
 */
class FamilyDTO {
  /**
   * @param {number} familyId - Family ID
   * @param {string|null} familyName - Family name
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

  /**
   * Map a FamilyDTO to Airtable field names for ICP_Families table
   * @param {FamilyDTO} family
   * @returns {Object} Airtable fields object
   */
  static toAirtableFields(family) {
    return {
      "Family ID": String(family.familyId),
      "Family Name": family.familyName || "",
      "Primary Email": family.primaryEmail || "",
      "Primary Phone": family.primaryPhone || "",
      "Street": family.address?.street || "",
      "City": family.address?.city || "",
      "State": family.address?.state || "",
      "Zip": family.address?.zip || "",
    };
  }

  /**
   * Map a guardian object to Airtable field names for ICP_Guardians table
   * @param {Object} guardian - Guardian object from FamilyDTO.guardians[]
   * @param {string|null} familyAirtableRecordId - Airtable record ID of the parent Family
   * @returns {Object} Airtable fields object
   */
  static toGuardianAirtableFields(guardian, familyAirtableRecordId) {
    return {
      "Guardian ID": String(guardian.guardianId),
      "First Name": guardian.firstName || "",
      "Last Name": guardian.lastName || "",
      "Email": guardian.email || "",
      "Phone": guardian.phone || "",
      "Relationship": guardian.relationship ? String(guardian.relationship) : "",
      "Is Primary": guardian.isPrimary || false,
      "Family": familyAirtableRecordId ? [familyAirtableRecordId] : [],
    };
  }
}

module.exports = FamilyDTO;
