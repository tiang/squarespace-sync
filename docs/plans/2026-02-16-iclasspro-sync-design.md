# iClassPro Headless API Sync — Design

## Goal

Reverse-engineer iClassPro's internal API to pull class schedules and enrolled student rosters, saving results to local JSON files.

## Discovered API

Base URL: `https://app.iclasspro.com/api/v1/`
Auth: Session cookie (`ICLASSPRO=...`) obtained via staff login POST.

### Auth Flow

1. POST `https://app.iclasspro.com/a/{account}/` with form data: `stafflogin=1&uname=...&passwd=...&stayloggedin=1`
2. Response: 302 redirect with `Set-Cookie: ICLASSPRO=...` (valid ~30 days with stayloggedin)
3. All subsequent requests include this cookie

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `class-list/` | POST | All classes with schedule, occupancy, instructors, openings |
| `classes` | GET | Full class detail (description, age range, sessions, config) |
| `roster/classes/{classId}/{date}/{tsId}` | GET | Students enrolled in a class for a specific date/timeslot |
| `students` | GET | Paginated student list (15/page) |
| `get-class-enrollment/{enrollmentId}/{studentId}` | GET | Individual enrollment details |

### Key Parameters

- `classId`: numeric class ID from class-list response
- `date`: ISO date string (e.g., `2026-02-16`)
- `tsId`: timeslot ID from class schedule (e.g., `149500` = Sun 1:45 PM)

## Architecture

### Module Structure

```
iclasspro/
  index.js          — Entry point: login → fetch → save
  config.js         — Credentials + settings from env vars
  services/
    auth.js         — Login, cookie management, session refresh
    classes.js      — Fetch class list + class details
    roster.js       — Fetch rosters per class/date/timeslot
  data/             — Output JSON files
```

### Data Flow

1. Login → get session cookie
2. Fetch class list (POST `class-list/`) → all class IDs + schedule info
3. For each active class → fetch roster (GET `roster/classes/{classId}/{date}/{tsId}`)
4. Combine class schedule + roster into unified JSON
5. Save to `iclasspro/data/iclasspro-{timestamp}.json`

### Output JSON Shape

```json
{
  "syncedAt": "2026-02-16T10:30:00Z",
  "classes": [
    {
      "id": 31,
      "name": "Camberwell - Junior Engineers",
      "schedule": { "day": "Sun", "startTime": "1:45 PM", "endTime": "3:00 PM" },
      "room": "Camberwell Community Centre...",
      "instructors": ["Cronin, Ryan", "Cannell, Sophie"],
      "occupancy": { "active": 7, "max": 14, "openings": 7 },
      "roster": [
        {
          "studentId": 338,
          "firstName": "Cullen",
          "lastName": "Tan",
          "age": "7y",
          "gender": "M",
          "enrollmentType": "ACTIVE",
          "startDate": "2026-02-08",
          "familyName": "Tan Xiaotian"
        }
      ]
    }
  ]
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ICLASSPRO_USERNAME` | Yes | — | Staff login username |
| `ICLASSPRO_PASSWORD` | Yes | — | Staff login password |
| `ICLASSPRO_ACCOUNT` | No | `rocketacademy` | Account slug |

## Approach

HTTP client with session replay (Axios). Pure JavaScript, no build step — matches existing project conventions. Credentials stored in `.env` alongside existing Squarespace/Airtable keys.
