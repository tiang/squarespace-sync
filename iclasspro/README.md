# iClassPro Sync

Fetches class schedules, rosters, and family details from iClassPro API.

## Usage

Run the sync process:

```bash
npm run iclasspro
```

For development with auto-reload:

```bash
npm run iclasspro:dev
```

## Output

Saves to `iclasspro/data/iclasspro-{timestamp}.json` with:
- Classes and schedules
- Enrolled students per class
- **Family details** for each student (guardians, contact info, address)

## Architecture

The service follows a clean architecture pattern with three layers:

### Services
- **auth.js** - Handles iClassPro API authentication and token management
- **classes.js** - Fetches class schedules and information
- **roster.js** - Retrieves student enrollment data per class
- **family.js** - Fetches family details for students (guardians, contact info, address)
- **sync.js** - Orchestrates the sync workflow

### DTOs (Data Transfer Objects)
- **ClassDTO.js** - Defines the class data structure
- **StudentDTO.js** - Defines the student data structure
- **FamilyDTO.js** - Defines the family data structure

### Mappers
- **ClassMapper.js** - Transforms iClassPro class API responses to ClassDTO
- **StudentMapper.js** - Transforms iClassPro student API responses to StudentDTO
- **FamilyMapper.js** - Transforms iClassPro family API responses to FamilyDTO

## Family Data Enrichment

Each student record is enriched with complete family information. The sync process:

1. Fetches all classes and their rosters
2. For each enrolled student, fetches their family details via the Family API
3. Maps family data (guardians, contact info, address) using FamilyMapper
4. Attaches enriched family data to each student record

### Family Data Structure

Each student record includes:

```json
{
  "studentId": 338,
  "firstName": "John",
  "lastName": "Doe",
  "familyId": 664,
  "family": {
    "familyId": 664,
    "familyName": "Doe",
    "primaryEmail": "john.doe@example.com",
    "primaryPhone": "1234567890",
    "guardians": [
      {
        "guardianId": 1234,
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane.doe@example.com",
        "phone": "1234567890",
        "relationship": "Mother"
      }
    ],
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701",
      "country": "USA"
    }
  }
}
```

### Error Handling

**Missing family data:** If the Family API call fails for a student, the sync continues and returns `null` for that student's family data. The error is logged but does not halt the entire sync process.

## Environment Variables

The sync service uses the shared `.env` file in the root directory.

**Required:**
- `ICLASSPRO_API_KEY`: Your iClassPro API key
- `ICLASSPRO_STAFF_ID`: Your iClassPro staff ID

## Logging

Logs are written to:
- Console output with sync progress
- Error details for failed API calls (including missing family data)
