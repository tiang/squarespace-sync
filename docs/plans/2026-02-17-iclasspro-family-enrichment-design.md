# iClassPro Family Data Enrichment — Design

## Goal

Extend the existing iClassPro sync to include full family details for each enrolled student. Family data is fetched from the iClassPro API and merged into enrollment records before saving to JSON.

**Phase 1 (This Design):** Enrich sync output with family data, save to JSON
**Phase 2 (Future):** Sync enriched data to Airtable (separate task)

## Discovered API

### Family Endpoint

**Endpoint:** `GET /api/v1/family/{familyId}`
**Auth:** Session cookie (same as existing class/roster endpoints)
**Returns:** Full family details including guardians, contact info, address, emergency contacts

**Related endpoints discovered (may be useful later):**
- `GET /api/v1/get-primary-families-guardian/{familyId}` — primary guardian info
- `GET /api/v1/get-family-students/{familyId}/1` — all students in family
- `GET /api/v1/ledger/{familyId}/summary` — ledger summary
- `POST /api/v1/families/{familyId}/enrollment-info` — enrollment details

## Architecture

### Module Structure

```
iclasspro/
  services/
    family.js        ← NEW: Family data fetching with cache-ready interface
    sync.js          ← MODIFY: Add family fetch + merge steps
  dto/
    FamilyDTO.js     ← NEW: Family data structure
  mappers/
    FamilyMapper.js  ← NEW: Transform raw API → FamilyDTO
```

### Service Design

**FamilyService** — Cache-ready interface for future optimization

```js
class FamilyService {
  constructor(client) {
    this.client = client;
  }

  async getFamily(familyId) {
    // Today: direct API call
    // Future: check cache first, then API
    const response = await this.client.get(`/family/${familyId}`);
    return FamilyMapper.transform(response.data);
  }

  async getFamilies(familyIds) {
    // Today: batch fetch with Promise.all
    // Future: check cache for hits, only fetch misses
    const uniqueIds = [...new Set(familyIds)];
    return Promise.all(uniqueIds.map(id => this.getFamily(id)));
  }
}
```

**Design principle:** The sync service calls `FamilyService.getFamilies()` — implementation details (caching, batching) are hidden. Adding caching later requires zero changes to sync logic.

### FamilyDTO Fields

Based on API exploration, the FamilyDTO will include:

- **Core:** `familyId`, `familyName`, `primaryEmail`, `primaryPhone`
- **Guardians:** array of `{firstName, lastName, email, phone, relationship}`
- **Address:** `{street, city, state, zip}`
- **Emergency contacts:** array of contact objects
- **Custom fields, notes** (if present in API response)

Exact field mapping will be finalized during implementation based on actual API response shape.

## Data Flow

### Modified Sync Flow

**Current state:** `SyncService` saves classes + rosters to JSON
**New state:** `SyncService` saves classes + rosters + **family data** to JSON

**Steps:**

1. **Login** → get session cookie (unchanged)
2. **Fetch classes** → `POST /class-list/` (unchanged)
3. **Fetch rosters** → `GET /roster/classes/{classId}/{date}/{tsId}` per class (unchanged)
4. **Extract unique familyIds** → `[...new Set(allStudents.map(s => s.familyId))]` ← NEW
5. **Batch fetch families** → `FamilyService.getFamilies(familyIds)` ← NEW
6. **Merge family data** → each student gets `family: FamilyDTO` field ← NEW
7. **Save to JSON** → `iclasspro/data/iclasspro-{timestamp}.json` with enriched data (modified)

### Output JSON Shape

**Before (current):**
```json
{
  "syncedAt": "2026-02-17T...",
  "totalClasses": 15,
  "classes": [
    {
      "id": 31,
      "name": "Camberwell - Junior Engineers",
      "roster": [
        {
          "studentId": 338,
          "firstName": "Cullen",
          "lastName": "Tan",
          "familyId": 664,
          "familyName": "Tan Xiaotian"
        }
      ]
    }
  ]
}
```

**After (enriched):**
```json
{
  "syncedAt": "2026-02-17T...",
  "totalClasses": 15,
  "classes": [
    {
      "id": 31,
      "name": "Camberwell - Junior Engineers",
      "roster": [
        {
          "studentId": 338,
          "firstName": "Cullen",
          "lastName": "Tan",
          "familyId": 664,
          "familyName": "Tan Xiaotian",
          "family": {
            "familyId": 664,
            "familyName": "Tan Xiaotian",
            "primaryEmail": "xiaotian.tan@example.com",
            "primaryPhone": "+61 XXX XXX XXX",
            "guardians": [
              {
                "firstName": "Xiaotian",
                "lastName": "Tan",
                "email": "xiaotian.tan@example.com",
                "phone": "+61 XXX XXX XXX",
                "relationship": "Parent"
              }
            ],
            "address": {
              "street": "123 Main St",
              "city": "Melbourne",
              "state": "VIC",
              "zip": "3000"
            }
          }
        }
      ]
    }
  ]
}
```

## Error Handling

**Per-family fetch failures:**
- Failed family API calls are caught individually
- Enrollment syncs without family data (family field = null)
- Warning logged with familyId and error message
- Sync continues for remaining families

**Philosophy:** Partial data is better than no data. Missing family info for one student shouldn't block the entire sync.

## Approach Rationale

**Chosen: Batch Family Fetch After Roster Sync (Approach 1)**

**Why:**
- **Efficient:** Deduplicates familyIds first, minimizes API calls
- **Simple:** Clear data flow (fetch all → merge all → save)
- **Future-proof:** Easy to add caching later without changing sync logic

**Alternatives considered:**
- **On-demand fetch during roster sync:** More API calls (duplicates per class), harder to optimize
- **Pre-fetch all families with cache:** Over-engineering for Phase 1, adds complexity before we know usage patterns

## Phase Separation

**Phase 1 (this design):** Family data enrichment + JSON output
**Phase 2 (future task):** Airtable sync with 3-table architecture

**Rationale:** JSON enrichment validates family API integration and data quality before designing Airtable schema. Allows iterative refinement of family data structure.
