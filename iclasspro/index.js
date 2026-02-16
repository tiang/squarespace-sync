const winston = require("winston");
const authService = require("./services/auth");
const ClassesService = require("./services/classes");
const RosterService = require("./services/roster");
const fs = require("fs");
const path = require("path");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "..", "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "..", "combined.log"),
    }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

async function sync() {
  logger.info("Starting iClassPro sync");

  // 1. Login
  await authService.login();
  const client = authService.createClient();
  logger.info("Logged in to iClassPro");

  const classesService = new ClassesService(client);
  const rosterService = new RosterService(client);

  // 2. Fetch class list
  const classList = await classesService.getClassList();
  logger.info(`Found ${classList.length} classes`);

  // 3. For each class, fetch roster for today
  const today = new Date().toISOString().split("T")[0];
  const classesWithRosters = [];

  for (const cls of classList) {
    const tsId = cls.schedule?.schedules?.[0];
    if (!tsId) {
      logger.warn(`Class ${cls.name} (${cls.value}) has no timeslot, skipping`);
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

      logger.info(
        `  ${cls.name}: ${roster.length} students enrolled`
      );
    } catch (err) {
      logger.error(`Failed to fetch roster for ${cls.name}: ${err.message}`);
    }
  }

  // 4. Save to JSON
  const output = {
    syncedAt: new Date().toISOString(),
    totalClasses: classesWithRosters.length,
    classes: classesWithRosters,
  };

  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = path.join(dataDir, `iclasspro-${timestamp}.json`);
  fs.writeFileSync(filename, JSON.stringify(output, null, 2));

  logger.info(`Saved ${classesWithRosters.length} classes to ${filename}`);
  return filename;
}

sync()
  .then((file) => logger.info(`Sync complete: ${file}`))
  .catch((err) => {
    logger.error("Sync failed:", err);
    process.exit(1);
  });
