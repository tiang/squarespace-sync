const authService = require("./auth");
const ClassesService = require("./classes");
const RosterService = require("./roster");
const fs = require("fs");
const path = require("path");

class SyncService {
  constructor(logger) {
    this.logger = logger;
  }

  async run() {
    this.logger.info("Starting iClassPro sync");

    // 1. Login
    await authService.login();
    const client = authService.createClient();
    this.logger.info("Logged in to iClassPro");

    const classesService = new ClassesService(client);
    const rosterService = new RosterService(client);

    // 2. Fetch class list
    const classList = await classesService.getClassList();
    this.logger.info(`Found ${classList.length} classes`);

    // 3. For each class, fetch roster for today
    const today = new Date().toISOString().split("T")[0];
    const classesWithRosters = [];

    for (const cls of classList) {
      const tsId = cls.schedule?.schedules?.[0];
      if (!tsId) {
        this.logger.warn(
          `Class ${cls.name} (${cls.value}) has no timeslot, skipping`
        );
        continue;
      }

      try {
        const roster = await rosterService.getRoster(cls.value, today, tsId);
        const scheduleKey = Object.keys(cls.durationSchedule || {})[0];
        const scheduleDisplay = cls.durationSchedule?.[scheduleKey] || "";

        classesWithRosters.push({
          id: cls.value,
          name: cls.name,
          schedule: scheduleDisplay,
          room: cls.room,
          instructors: cls.instructor || [],
          occupancy: {
            active: cls.occupancy?.active || 0,
            max: cls.occupancy?.max || 0,
            openings: cls.occupancy?.openings || 0,
            seatsFilled: cls.occupancy?.seatsFilled || 0,
            waitlist: cls.occupancy?.waitlist || 0,
          },
          roster,
        });

        this.logger.info(`  ${cls.name}: ${roster.length} students enrolled`);
      } catch (err) {
        this.logger.error(
          `Failed to fetch roster for ${cls.name}: ${err.message}`
        );
      }
    }

    // 4. Save to JSON
    const output = {
      syncedAt: new Date().toISOString(),
      totalClasses: classesWithRosters.length,
      classes: classesWithRosters,
    };

    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = path.join(dataDir, `iclasspro-${timestamp}.json`);
    fs.writeFileSync(filename, JSON.stringify(output, null, 2));

    this.logger.info(`Saved ${classesWithRosters.length} classes to ${filename}`);
    return filename;
  }
}

module.exports = SyncService;
