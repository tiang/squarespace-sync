class ClassesService {
  constructor(client) {
    this.client = client;
  }

  async getClassList() {
    const response = await this.client.post("/class-list/", {});
    return response.data.data || response.data;
  }

  async getClassDetails(classId) {
    const response = await this.client.get("/classes");
    const allClasses = response.data.data || response.data;
    return allClasses.find((c) => c.id === classId) || null;
  }
}

module.exports = ClassesService;
