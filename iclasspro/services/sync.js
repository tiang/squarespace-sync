const authService = require("./auth");
const ClassesService = require("./classes");
const RosterService = require("./roster");
const FamilyService = require("./family");
const ClassMapper = require("../mappers/ClassMapper");
const StudentMapper = require("../mappers/StudentMapper");
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
    const familyService = new FamilyService(client);

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
        const rawRoster = await rosterService.getRoster(cls.value, today, tsId);

        classesWithRosters.push({
          ...ClassMapper.transform(cls),
          roster: rawRoster.map((s) => StudentMapper.transform(s)),
        });

        this.logger.info(`  ${cls.name}: ${rawRoster.length} students enrolled`);
      } catch (err) {
        this.logger.error(
          `Failed to fetch roster for ${cls.name}: ${err.message}`
        );
      }
    }

    // 4. Extract unique family IDs from all rosters
    const allStudents = classesWithRosters.flatMap((cls) => cls.roster);
    const familyIds = [...new Set(allStudents.map((s) => s.familyId).filter(Boolean))];
    this.logger.info(`Found ${familyIds.length} unique families`);

    // 5. Batch fetch family data
    const families = await familyService.getFamilies(familyIds);
    const familyMap = new Map(
      families.filter(Boolean).map((f) => [f.familyId, f])
    );
    this.logger.info(`Fetched ${familyMap.size} family records`);

    // 6. Merge family data into student records
    for (const cls of classesWithRosters) {
      for (const student of cls.roster) {
        student.family = familyMap.get(student.familyId) || null;
      }
    }

    // 7. Save to JSON
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
