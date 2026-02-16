class RosterService {
  constructor(client) {
    this.client = client;
  }

  async getRoster(classId, date, tsId) {
    const response = await this.client.get(
      `/roster/classes/${classId}/${date}/${tsId}`
    );
    return response.data.data || response.data;
  }
}

module.exports = RosterService;
