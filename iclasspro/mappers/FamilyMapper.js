const FamilyDTO = require("../dto/FamilyDTO");

/**
 * FamilyMapper - Transforms raw iClassPro family API data to FamilyDTO
 */
class FamilyMapper {
  /**
   * Transform raw family data from API to FamilyDTO
   * @param {Object} rawFamily - Raw family object from /api/v1/family/{familyId}
   * @returns {FamilyDTO} Transformed family data
   * @throws {Error} If required fields are missing
   */
  static transform(rawFamily) {
    // Validate required fields
    if (!rawFamily.id) {
      throw new Error(
        `FamilyMapper: Missing required field 'familyId' for family`
      );
    }

    // Extract family ID
    const familyId = rawFamily.id;

    // Derive family name from primary guardian
    const guardians = rawFamily.guardians || [];
    const primaryGuardian = guardians.find((g) => g.isPrimary) || guardians[0];
    const familyName =
      primaryGuardian && primaryGuardian.firstName && primaryGuardian.lastName
        ? `${primaryGuardian.firstName} ${primaryGuardian.lastName}`
        : null;

    // Extract primary email from emails array
    const emails = rawFamily.emails || [];
    const primaryEmailObj = emails.find((e) => e.isPrimary);
    const primaryEmail = primaryEmailObj ? primaryEmailObj.email : null;

    // Extract primary phone from phones array (use phoneSearch field)
    const phones = rawFamily.phones || [];
    const primaryPhoneObj = phones.find((p) => p.isPrimary);
    const primaryPhone = primaryPhoneObj ? primaryPhoneObj.phoneSearch : null;

    // Map guardians with their associated emails and phones
    const transformedGuardians = guardians.map((guardian) => {
      const guardianEmail = emails.find((e) => e.guardianId === guardian.id);
      const guardianPhone = phones.find((p) => p.guardianId === guardian.id);

      return {
        guardianId: guardian.id,
        firstName: guardian.firstName || null,
        lastName: guardian.lastName || null,
        email: guardianEmail ? guardianEmail.email : null,
        phone: guardianPhone ? guardianPhone.phoneSearch : null,
        relationship: guardian.relationshipId || null,
        isPrimary: guardian.isPrimary || false,
      };
    });

    // Extract primary address from addresses array
    const addresses = rawFamily.addresses || [];
    const primaryAddressObj = addresses.find((a) => a.isPrimary);
    const address = primaryAddressObj
      ? {
          street: (() => {
            const streetParts = [primaryAddressObj.street1, primaryAddressObj.street2]
              .filter(s => s && s.trim());
            return streetParts.length > 0 ? streetParts.join(", ") : null;
          })(),
          city: primaryAddressObj.city || null,
          state: primaryAddressObj.state || null,
          zip: primaryAddressObj.zip || null,
        }
      : null;

    // Emergency contacts - for now, use empty array
    // (API structure doesn't show separate emergency contacts in sample)
    const emergencyContacts = [];

    return new FamilyDTO(
      familyId,
      familyName,
      primaryEmail,
      primaryPhone,
      transformedGuardians,
      address,
      emergencyContacts
    );
  }
}

module.exports = FamilyMapper;
