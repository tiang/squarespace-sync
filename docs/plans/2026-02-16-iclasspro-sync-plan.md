# iClassPro Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a headless iClassPro API client that logs in, fetches class schedules and rosters, and saves them to local JSON.

**Architecture:** New `iclasspro/` module at project root (parallel to `sync/`). Axios-based HTTP client with cookie-jar auth. Reuses the existing `data/` directory for JSON output via the existing `sync/services/json.js` pattern.

**Tech Stack:** Node.js, Axios, dotenv, Winston (all already in the project)

---

### Task 1: Config Module

**Files:**
- Create: `iclasspro/config.js`

**Step 1: Write config.js**

```js
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const config = {
  iclasspro: {
    username: process.env.ICLASSPRO_USERNAME,
    password: process.env.ICLASSPRO_PASSWORD,
    account: process.env.ICLASSPRO_ACCOUNT || "rocketacademy",
  },
};

const required = ["ICLASSPRO_USERNAME", "ICLASSPRO_PASSWORD"];
const missing = required.filter((v) => !process.env[v]);
if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

module.exports = config;
```

**Step 2: Add env vars to .env**

Append to the existing `.env` file at project root:

```
# iClassPro Configuration
ICLASSPRO_USERNAME=tiang
ICLASSPRO_PASSWORD=Roku@40miles
ICLASSPRO_ACCOUNT=rocketacademy
```

**Step 3: Verify config loads**

Run: `node -e "const c = require('./iclasspro/config'); console.log(c.iclasspro.account)"`
Expected: `rocketacademy`

**Step 4: Commit**

```bash
git add iclasspro/config.js .env
git commit -m "feat(iclasspro): add config module with env var loading"
```

---

### Task 2: Auth Service

**Files:**
- Create: `iclasspro/services/auth.js`

**Step 1: Write auth.js**

This service logs in to iClassPro and returns an Axios instance with the session cookie set. It follows redirects manually to capture the Set-Cookie header.

```js
const axios = require("axios");
const config = require("../config");

const BASE_URL = "https://app.iclasspro.com";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36";

class AuthService {
  constructor() {
    this.sessionCookie = null;
  }

  async login() {
    const loginUrl = `${BASE_URL}/a/${config.iclasspro.account}/`;
    const formData = new URLSearchParams({
      stafflogin: "1",
      uname: config.iclasspro.username,
      passwd: config.iclasspro.password,
      stayloggedin: "1",
    });

    const response = await axios.post(loginUrl, formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        Origin: BASE_URL,
        Referer: loginUrl,
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 302,
    });

    const cookies = response.headers["set-cookie"];
    if (!cookies) {
      throw new Error("Login failed: no Set-Cookie header in response");
    }

    const icpCookie = cookies
      .map((c) => c.split(";")[0])
      .find((c) => c.startsWith("ICLASSPRO="));

    if (!icpCookie) {
      throw new Error("Login failed: ICLASSPRO cookie not found");
    }

    this.sessionCookie = icpCookie;
    return this.sessionCookie;
  }

  createClient() {
    if (!this.sessionCookie) {
      throw new Error("Not logged in. Call login() first.");
    }

    return axios.create({
      baseURL: `${BASE_URL}/api/v1`,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: `${this.sessionCookie}; ICPAPP=ICLASSPRO`,
      },
    });
  }
}

module.exports = new AuthService();
```

**Step 2: Verify login works**

Run: `node -e "const auth = require('./iclasspro/services/auth'); auth.login().then(c => console.log('Cookie:', c.substring(0, 30) + '...')).catch(e => console.error(e))"`
Expected: `Cookie: ICLASSPRO=<session-id>...`

**Step 3: Commit**

```bash
git add iclasspro/services/auth.js
git commit -m "feat(iclasspro): add auth service with session cookie login"
```

---

### Task 3: Classes Service

**Files:**
- Create: `iclasspro/services/classes.js`

**Step 1: Write classes.js**

```js
class ClassesService {
  constructor(client) {
    this.client = client;
  }

  async getClassList() {
    const response = await this.client.post("/class-list/", {});
    return response.data.data || response.data;
  }

  async getClassDetails(classId) {
    const response = await this.client.get(`/classes`);
    const allClasses = response.data.data || response.data;
    return allClasses.find((c) => c.id === classId) || null;
  }
}

module.exports = ClassesService;
```

**Step 2: Verify class list works**

Run: `node -e "const auth = require('./iclasspro/services/auth'); const Classes = require('./iclasspro/services/classes'); auth.login().then(() => { const c = new Classes(auth.createClient()); return c.getClassList(); }).then(list => console.log(list.length + ' classes found')).catch(e => console.error(e))"`
Expected: A number followed by `classes found` (e.g., `15 classes found`)

**Step 3: Commit**

```bash
git add iclasspro/services/classes.js
git commit -m "feat(iclasspro): add classes service for fetching class list"
```

---

### Task 4: Roster Service

**Files:**
- Create: `iclasspro/services/roster.js`

**Step 1: Write roster.js**

The roster endpoint requires `classId`, a `date` (YYYY-MM-DD), and a `tsId` (timeslot ID from the class schedule). The `tsId` is found in the class list response under `schedule.schedules[0]`.

```js
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
```

**Step 2: Verify roster fetch works**

Run: `node -e "const auth = require('./iclasspro/services/auth'); const Roster = require('./iclasspro/services/roster'); auth.login().then(() => { const r = new Roster(auth.createClient()); return r.getRoster(31, '2026-02-16', '149500'); }).then(roster => console.log(roster.length + ' students')).catch(e => console.error(e))"`
Expected: A number followed by `students` (e.g., `7 students`)

**Step 3: Commit**

```bash
git add iclasspro/services/roster.js
git commit -m "feat(iclasspro): add roster service for fetching class enrollments"
```

---

### Task 5: Entry Point — Orchestrate Full Sync

**Files:**
- Create: `iclasspro/index.js`

**Step 1: Write index.js**

This orchestrates the full flow: login → fetch class list → for each class, fetch roster → combine → save JSON.

```js
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
```

**Step 2: Add npm script to root package.json**

Add to the `scripts` section:
```json
"iclasspro": "node iclasspro/index.js"
```

**Step 3: Run the full sync**

Run: `npm run iclasspro`
Expected: Log output showing login, class count, roster counts per class, and a saved JSON file path.

**Step 4: Verify the output JSON**

Run: `ls iclasspro/data/` and read the latest file to confirm the shape matches the design.

**Step 5: Commit**

```bash
git add iclasspro/index.js package.json
git commit -m "feat(iclasspro): add entry point orchestrating full class roster sync"
```

---

### Task 6: Add .env to .gitignore (safety check)

**Files:**
- Modify: `.gitignore`

**Step 1: Verify .env is in .gitignore**

Check `.gitignore` contains `.env`. If not, add it. The iClassPro credentials are now in `.env` and must never be committed.

**Step 2: Commit if changed**

```bash
git add .gitignore
git commit -m "chore: ensure .env is in .gitignore"
```
