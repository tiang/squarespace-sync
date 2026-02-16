class RosterService {
  constructor(client) {
    this.client = client;
  }

  async getRoster(classId, date, tsId) {
    const response = await this.client.get(
      `/roster/classes/${classId}/${date}/${tsId}`
    );
    const students = response.data.data || response.data;

    return students.map((s) => ({
      studentId: s.id,
      enrollmentId: s.enrollmentId,
      firstName: s.firstName,
      lastName: s.lastName,
      age: s.age,
      gender: s.gender,
      enrollmentType: s.type,
      startDate: s.startDate,
      dropDate: s.dropDate,
      familyName: s.familyName,
      familyId: s.familyId,
      birthDate: s.birthDate,
      healthConcerns: s.healthConcerns,
      flags: {
        medical: s.flags?.medical,
        allowImage: s.flags?.allowImage,
        trial: s.flags?.trial,
        waitlist: s.flags?.waitlist,
        makeup: s.flags?.makeup,
      },
    }));
  }
}

module.exports = RosterService;
