# iClassPro Family Data Enrichment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend iClassPro sync to fetch family details via `/api/v1/family/{familyId}` and merge into enrollment records before saving to JSON.

**Architecture:** New FamilyService with cache-ready interface, FamilyDTO/FamilyMapper following existing patterns. SyncService modified to: extract familyIds → batch fetch → merge → save enriched JSON.

**Tech Stack:** Node.js, Axios (existing), Winston (existing), DTO/Mapper pattern (existing)

---

## Task 1: Discover Family API Response Shape

**Goal:** Fetch actual family data from iClassPro API to understand response structure before designing DTO.

**Files:**
- None yet (exploration only)

**Step 1: Use existing auth to fetch family data**

Run this one-liner to see the actual API response:

```bash
node -e "const auth = require('./iclasspro/services/auth'); auth.login().then(() => { const client = auth.createClient(); return client.get('/family/664'); }).then(r => console.log(JSON.stringify(r.data, null, 2))).catch(e => console.error(e.message))"
```

Expected: JSON response with family details

**Step 2: Save sample response for reference**

Create a temporary file to document the response:

```bash
node -e "const auth = require('./iclasspro/services/auth'); auth.login().then(() => { const client = auth.createClient(); return client.get('/family/664'); }).then(r => console.log(JSON.stringify(r.data, null, 2)) > require('fs').writeFileSync('iclasspro/data/family-sample.json', JSON.stringify(r.data, null, 2))).catch(e => console.error(e.message))"
```

**Step 3: Review response structure**

Read `iclasspro/data/family-sample.json` and note:
- Core fields: familyId, familyName, email, phone
- Guardian structure (array? nested object?)
- Address format
- Any unexpected fields

**Step 4: Document findings in this plan**

Add a comment block below with the actual field mapping discovered:

```
ACTUAL API RESPONSE SHAPE:
(to be filled after Step 3)
```

**Step 5: Do NOT commit yet**

Wait until FamilyDTO is created based on this discovery.

---

## Task 2: Create FamilyDTO

**Files:**
- Create: `iclasspro/dto/FamilyDTO.js`

**Step 1: Write FamilyDTO class based on API discovery**

Create `iclasspro/dto/FamilyDTO.js`:

```js
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
   * @param {Object|null} address - Address object {street, city, state, zip}
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
```

**Note:** Adjust fields based on actual API response from Task 1.

**Step 2: Verify file loads**

Run: `node -e "const FamilyDTO = require('./iclasspro/dto/FamilyDTO'); const f = new FamilyDTO(1, 'Test', 'test@example.com', '1234567890', [], null, []); console.log(f.familyName)"`
Expected: `Test`

**Step 3: Commit**

```bash
git add iclasspro/dto/FamilyDTO.js iclasspro/data/family-sample.json
git commit -m "feat(iclasspro): add FamilyDTO based on API response discovery"
```

---

## Task 3: Create FamilyMapper with Tests

**Files:**
- Create: `iclasspro/mappers/FamilyMapper.js`
- Create: `iclasspro/mappers/__tests__/FamilyMapper.test.js`

**Step 1: Create test directory**

```bash
mkdir -p iclasspro/mappers/__tests__
```

**Step 2: Write failing test**

Create `iclasspro/mappers/__tests__/FamilyMapper.test.js`:

```js
const FamilyMapper = require("../FamilyMapper");
const FamilyDTO = require("../../dto/FamilyDTO");
const fs = require("fs");
const path = require("path");

describe("FamilyMapper", () => {
  let sampleFamily;

  beforeAll(() => {
    // Load the actual API response saved in Task 1
    const samplePath = path.join(__dirname, "../../data/family-sample.json");
    sampleFamily = JSON.parse(fs.readFileSync(samplePath, "utf8"));
  });

  describe("transform", () => {
    it("should transform raw family data to FamilyDTO", () => {
      const result = FamilyMapper.transform(sampleFamily);

      expect(result).toBeInstanceOf(FamilyDTO);
      expect(result.familyId).toBe(664); // Update based on actual sample
      expect(result.familyName).toBeTruthy();
      expect(result.guardians).toBeInstanceOf(Array);
    });

    it("should throw error if familyId is missing", () => {
      const invalidFamily = { ...sampleFamily };
      delete invalidFamily.id; // Adjust based on actual field name

      expect(() => FamilyMapper.transform(invalidFamily)).toThrow(
        /Missing required field.*familyId/
      );
    });

    it("should handle missing optional fields gracefully", () => {
      const minimalFamily = {
        id: 999, // Adjust field name based on API
        name: "Test Family",
      };

      const result = FamilyMapper.transform(minimalFamily);

      expect(result.familyId).toBe(999);
      expect(result.primaryEmail).toBeNull();
      expect(result.guardians).toEqual([]);
    });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npm test -- iclasspro/mappers/__tests__/FamilyMapper.test.js`
Expected: FAIL with "Cannot find module '../FamilyMapper'"

**Step 4: Write minimal FamilyMapper implementation**

Create `iclasspro/mappers/FamilyMapper.js`:

```js
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
    // Validate required fields (adjust based on actual API response)
    if (!rawFamily.id && !rawFamily.familyId) {
      throw new Error(
        `FamilyMapper: Missing required field 'familyId' for family`
      );
    }

    // Extract fields with defaults (ADJUST THESE based on actual API response from Task 1)
    const familyId = rawFamily.id || rawFamily.familyId;
    const familyName = rawFamily.name || rawFamily.familyName || null;
    const primaryEmail = rawFamily.primaryEmail || rawFamily.email || null;
    const primaryPhone = rawFamily.primaryPhone || rawFamily.phone || null;

    // Extract guardians (adjust based on actual structure)
    const guardians = (rawFamily.guardians || []).map((g) => ({
      firstName: g.firstName || null,
      lastName: g.lastName || null,
      email: g.email || null,
      phone: g.phone || null,
      relationship: g.relationship || null,
    }));

    // Extract address (adjust based on actual structure)
    const address = rawFamily.address
      ? {
          street: rawFamily.address.street || null,
          city: rawFamily.address.city || null,
          state: rawFamily.address.state || null,
          zip: rawFamily.address.zip || null,
        }
      : null;

    // Extract emergency contacts (adjust based on actual structure)
    const emergencyContacts = (rawFamily.emergencyContacts || []).map((ec) => ({
      name: ec.name || null,
      phone: ec.phone || null,
      relationship: ec.relationship || null,
    }));

    return new FamilyDTO(
      familyId,
      familyName,
      primaryEmail,
      primaryPhone,
      guardians,
      address,
      emergencyContacts
    );
  }
}

module.exports = FamilyMapper;
```

**IMPORTANT:** After Task 1, you'll need to adjust field names in this mapper to match the actual API response.

**Step 5: Run test to verify it passes**

Run: `npm test -- iclasspro/mappers/__tests__/FamilyMapper.test.js`
Expected: PASS (all tests green)

If tests fail due to field name mismatches, update the mapper based on the actual API response structure.

**Step 6: Commit**

```bash
git add iclasspro/mappers/FamilyMapper.js iclasspro/mappers/__tests__/FamilyMapper.test.js
git commit -m "feat(iclasspro): add FamilyMapper with validation tests"
```

---

## Task 4: Create FamilyService with Tests

**Files:**
- Create: `iclasspro/services/family.js`
- Create: `iclasspro/services/__tests__/family.test.js`

**Step 1: Create test directory**

```bash
mkdir -p iclasspro/services/__tests__
```

**Step 2: Write failing test**

Create `iclasspro/services/__tests__/family.test.js`:

```js
const FamilyService = require("../family");
const FamilyMapper = require("../../mappers/FamilyMapper");
const FamilyDTO = require("../../dto/FamilyDTO");

describe("FamilyService", () => {
  let service;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
    };
    service = new FamilyService(mockClient);
  });

  describe("getFamily", () => {
    it("should fetch and transform a single family", async () => {
      const mockResponse = {
        data: {
          id: 664,
          name: "Test Family",
          email: "test@example.com",
          phone: "1234567890",
        },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.getFamily(664);

      expect(mockClient.get).toHaveBeenCalledWith("/family/664");
      expect(result).toBeInstanceOf(FamilyDTO);
      expect(result.familyId).toBe(664);
    });

    it("should throw error if API call fails", async () => {
      mockClient.get.mockRejectedValue(new Error("API Error"));

      await expect(service.getFamily(664)).rejects.toThrow(
        "Failed to fetch family 664"
      );
    });
  });

  describe("getFamilies", () => {
    it("should fetch multiple families in parallel", async () => {
      const mockResponse1 = {
        data: { id: 664, name: "Family 1" },
      };
      const mockResponse2 = {
        data: { id: 665, name: "Family 2" },
      };

      mockClient.get
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const result = await service.getFamilies([664, 665]);

      expect(mockClient.get).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].familyId).toBe(664);
      expect(result[1].familyId).toBe(665);
    });

    it("should deduplicate family IDs", async () => {
      const mockResponse = {
        data: { id: 664, name: "Family 1" },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.getFamilies([664, 664, 664]);

      expect(mockClient.get).toHaveBeenCalledTimes(1); // Only called once
      expect(result).toHaveLength(1);
    });

    it("should filter out null/undefined IDs", async () => {
      const mockResponse = {
        data: { id: 664, name: "Family 1" },
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.getFamilies([664, null, undefined]);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it("should continue on individual failures", async () => {
      const mockResponse1 = {
        data: { id: 664, name: "Family 1" },
      };

      mockClient.get
        .mockResolvedValueOnce(mockResponse1)
        .mockRejectedValueOnce(new Error("API Error"));

      const result = await service.getFamilies([664, 665]);

      // Should return successful fetches, null for failures
      expect(result).toHaveLength(2);
      expect(result[0].familyId).toBe(664);
      expect(result[1]).toBeNull();
    });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npm test -- iclasspro/services/__tests__/family.test.js`
Expected: FAIL with "Cannot find module '../family'"

**Step 4: Write FamilyService implementation**

Create `iclasspro/services/family.js`:

```js
const FamilyMapper = require("../mappers/FamilyMapper");

/**
 * FamilyService - Fetches family data from iClassPro API
 *
 * Cache-ready interface: adding caching later requires changes only
 * inside getFamily(), with zero impact on callers.
 */
class FamilyService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Fetch a single family by ID
   * @param {number} familyId - Family ID
   * @returns {Promise<FamilyDTO>} Transformed family data
   * @throws {Error} If API call fails
   */
  async getFamily(familyId) {
    try {
      const response = await this.client.get(`/family/${familyId}`);
      return FamilyMapper.transform(response.data);
    } catch (error) {
      throw new Error(
        `Failed to fetch family ${familyId}: ${error.message}`
      );
    }
  }

  /**
   * Fetch multiple families in parallel
   * @param {Array<number>} familyIds - Array of family IDs
   * @returns {Promise<Array<FamilyDTO|null>>} Array of family DTOs (null for failures)
   */
  async getFamilies(familyIds) {
    // Deduplicate and filter out null/undefined
    const uniqueIds = [
      ...new Set(familyIds.filter((id) => id != null)),
    ];

    // Fetch all families in parallel
    const promises = uniqueIds.map(async (id) => {
      try {
        return await this.getFamily(id);
      } catch (error) {
        console.warn(`Failed to fetch family ${id}: ${error.message}`);
        return null; // Return null for failures, continue with others
      }
    });

    return Promise.all(promises);
  }
}

module.exports = FamilyService;
```

**Step 5: Run test to verify it passes**

Run: `npm test -- iclasspro/services/__tests__/family.test.js`
Expected: PASS (all tests green)

**Step 6: Commit**

```bash
git add iclasspro/services/family.js iclasspro/services/__tests__/family.test.js
git commit -m "feat(iclasspro): add FamilyService with batch fetch and error handling"
```

---

## Task 5: Modify SyncService to Include Family Data

**Files:**
- Modify: `iclasspro/services/sync.js`

**Step 1: Read current SyncService implementation**

Run: `cat iclasspro/services/sync.js`

Review the current flow to understand where to insert family fetch + merge steps.

**Step 2: Add family fetch step after roster fetch**

Modify `iclasspro/services/sync.js`:

```js
const authService = require("./auth");
const ClassesService = require("./classes");
const RosterService = require("./roster");
const FamilyService = require("./family"); // NEW
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
    const familyService = new FamilyService(client); // NEW

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

    // 4. Extract unique family IDs from all rosters (NEW)
    const allStudents = classesWithRosters.flatMap((cls) => cls.roster);
    const familyIds = [...new Set(allStudents.map((s) => s.familyId).filter(Boolean))];
    this.logger.info(`Found ${familyIds.length} unique families`);

    // 5. Batch fetch family data (NEW)
    const families = await familyService.getFamilies(familyIds);
    const familyMap = new Map(
      families.filter(Boolean).map((f) => [f.familyId, f])
    );
    this.logger.info(`Fetched ${familyMap.size} family records`);

    // 6. Merge family data into student records (NEW)
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
```

**Step 3: Test the modified sync**

Run: `npm run iclasspro`

Expected output:
```
Starting iClassPro sync
Logged in to iClassPro
Found 15 classes
  Class A: 7 students enrolled
  Class B: 5 students enrolled
  ...
Found 12 unique families
Fetched 12 family records
Saved 15 classes to iclasspro/data/iclasspro-2026-02-17T...json
```

**Step 4: Verify enriched JSON output**

Run: `cat iclasspro/data/iclasspro-*.json | grep -A 20 '"family"'`

Expected: Each student should have a `family` object with familyId, familyName, primaryEmail, etc.

**Step 5: Commit**

```bash
git add iclasspro/services/sync.js
git commit -m "feat(iclasspro): enrich sync with family data fetch and merge"
```

---

## Task 6: Integration Test — Full Sync with Family Data

**Files:**
- None (verification only)

**Step 1: Run full sync**

Run: `npm run iclasspro`

**Step 2: Verify output JSON structure**

Run: `node -e "const data = require('./iclasspro/data/iclasspro-' + require('fs').readdirSync('iclasspro/data').filter(f => f.startsWith('iclasspro-')).pop()); console.log('Total classes:', data.totalClasses); console.log('Sample student with family:', JSON.stringify(data.classes[0].roster[0], null, 2))"`

Expected output:
- Total classes count
- Sample student object with nested `family` object

**Step 3: Verify family data is present**

Check that:
- ✅ `family` field exists on student records
- ✅ `family.familyId` matches `student.familyId`
- ✅ `family.guardians` is an array
- ✅ `family.primaryEmail` and `family.primaryPhone` are present

**Step 4: Check logs for errors**

Run: `tail -50 combined.log`

Verify:
- No "Failed to fetch family" errors (or only expected ones)
- "Fetched X family records" matches expected count

**Step 5: Do NOT commit yet**

Wait for final cleanup in Task 7.

---

## Task 7: Cleanup and Documentation

**Files:**
- Modify: `README.md` or `iclasspro/README.md` (if exists)
- Delete: `iclasspro/data/family-sample.json` (temporary exploration file)

**Step 1: Remove temporary exploration file**

Run: `rm iclasspro/data/family-sample.json`

**Step 2: Update documentation**

Add or update `iclasspro/README.md` with:

```markdown
# iClassPro Sync

Fetches class schedules, rosters, and family details from iClassPro API.

## Usage

```bash
npm run iclasspro
```

## Output

Saves to `iclasspro/data/iclasspro-{timestamp}.json` with:
- Classes and schedules
- Enrolled students per class
- **Family details** for each student (guardians, contact info, address)

## Architecture

- **Services:** auth, classes, roster, **family**
- **DTOs:** ClassDTO, StudentDTO, **FamilyDTO**
- **Mappers:** ClassMapper, StudentMapper, **FamilyMapper**

## Family Data

Each student record includes:
```json
{
  "studentId": 338,
  "firstName": "John",
  "familyId": 664,
  "family": {
    "familyId": 664,
    "familyName": "Doe",
    "primaryEmail": "john.doe@example.com",
    "guardians": [...],
    "address": {...}
  }
}
```

Missing family data: Returns `null` if API call fails. Sync continues.
```

**Step 3: Final test**

Run: `npm run iclasspro` one more time to verify everything works end-to-end.

**Step 4: Final commit**

```bash
git add iclasspro/README.md
git commit -m "docs(iclasspro): update README with family data enrichment"
```

---

## Verification Checklist

Before marking complete, verify:

- [ ] `npm run iclasspro` completes without errors
- [ ] Output JSON includes `family` object for each student
- [ ] Family data matches expected structure (familyId, guardians, etc.)
- [ ] Tests pass: `npm test -- iclasspro/`
- [ ] All commits follow conventional commit format
- [ ] No temporary files committed (`family-sample.json` removed)
- [ ] Documentation updated

---

## Next Phase

**Phase 2 (Future):** Airtable sync with 3-table architecture
- Design Airtable schema (iClassPro, Squarespace, Combined tables)
- Create IClassProAirtableService
- Implement bulk upsert with deduplication logic
