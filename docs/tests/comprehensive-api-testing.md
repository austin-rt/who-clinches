# Comprehensive API Testing Guide

Complete testing procedures for all Conference Tiebreaker API endpoints.

**Environment-agnostic**: Use placeholders `{BASE_URL}`, `{DATABASE}`, and credential variables for any environment.

**Related:** [API Reference](../guides/api-reference.md) | [ESPN API Testing](./espn-api-testing.md) | [API Types](../../lib/api-types.ts)

---

## Prerequisites

### Environment Files

- **`.env.local`** - Local development (default)
  - Contains: `MONGODB_DB=dev`, `CRON_SECRET`, MongoDB credentials, read-only credentials
- **`.env.preview`** - Preview/staging (used by `npm run db:check -- --env preview`)
- **`.env.production`** - Production (used by `npm run db:check -- --env production`)

Database verification uses read-only credentials from `.env.local`.

### Required Credentials

- `VERCEL_AUTOMATION_BYPASS_SECRET` - For protected Vercel deployments (auto-handled by scripts/tests)
- `CRON_SECRET` - For cron job endpoints
- `MONGODB_USER_READONLY`, `MONGODB_PASSWORD_READONLY` - For database verification

**Setup:**
- Environment variables: `BASE_URL`, `DATABASE`
- Dev server running (check: `curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Running" || npm run dev`)
- Appropriate `.env.*` file for environment

---

## Testing Procedures

### 1. Data Seeding

#### POST /api/pull-teams

**Pre-check:** Verify teams exist before seeding (skip if data is current).

**Valid:**
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl -X POST "{BASE_URL}/api/pull-teams?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "conferenceId": 8}'
```

**Expected:** Status 200, `upserted: 16`, `lastUpdated` timestamp

**Invalid:** Missing `sport`, `league`, or both `teams` and `conferenceId` → Status 400

#### POST /api/pull-games

**Prerequisites:** Teams must be seeded first for accurate `predictedScore` calculations.

**Pre-check:** Verify games exist for target season/week (skip if data is current).

**Valid:**
```bash
curl -X POST "{BASE_URL}/api/pull-games?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "season": 2025, "conferenceId": 8}'
```

**Expected:** Status 200, `upserted` count, `weeksPulled` array, `lastUpdated` timestamp

**Invalid:** Missing required fields or invalid `week` → Status 400

### 2. Data Retrieval

#### GET /api/games

**Valid Query Parameters:** `season`, `week`, `conferenceId`, `state` (pre/in/post), `from`, `to`, `sport`, `league`

**Expected:** Status 200, `events` array, `teams` array, `lastUpdated` timestamp

**Response Verification:** Verify structure matches `GamesResponse` in `lib/api-types.ts`:
- `events` is array
- `teams` is array with required `TeamMetadata` fields: `id`, `abbrev`, `displayName`, `logo`, `color`, `alternateColor`
- `lastUpdated` exists

### 3. Simulation

#### POST /api/simulate

**Valid:**
```bash
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752759": {"homeScore": 28, "awayScore": 21}}}'
```

**Expected:** Status 200, `standings` array (16 teams), `championship` array (top 2), `tieLogs` array

**Response Verification:** Verify structure matches `SimulateResponse`:
- `standings` contains all 16 teams with required `StandingEntry` fields
- Ranks are 1-16 with no gaps
- `championship` length is 2
- `tieLogs` is array

**Invalid:** Missing `season`/`conferenceId`, invalid score format (negative, non-integer, tie) → Status 400

### 4. Cron Jobs

**Authentication:** All cron endpoints require `Authorization: Bearer ${CRON_SECRET}`

#### GET /api/cron/update-games

**Modes:** `mode=season` (all games), `mode=week` (current week), default (incomplete only)

**Expected:** Status 200, `updated`, `gamesChecked`, `activeGames`, `espnCalls`, `lastUpdated`, `errors`

#### GET /api/cron/update-rankings

**Expected:** Status 200, `updated` (16 teams), `teamsChecked`, `espnCalls`, `lastUpdated`, `errors`

#### GET /api/cron/update-spreads

**Expected:** Status 200, update counts and timestamp

#### GET /api/cron/update-team-averages

**Expected:** Status 200, update counts and timestamp

#### GET /api/cron/update-all

**Expected:** Status 200, `success`, `jobsRun`, `jobsSucceeded`, `totalDuration`, `results`, `lastUpdated`

**Invalid:** Missing/invalid auth → Status 401

---

## Database Verification

**Common Setup:**
```bash
READONLY_USER=$(grep MONGODB_USER_READONLY .env.local | cut -d '=' -f2)
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
MONGODB_HOST=$(grep MONGODB_HOST .env.local | cut -d '=' -f2)
MONGODB_DB=$(grep MONGODB_DB .env.local | cut -d '=' -f2)
MONGODB_APP_NAME=$(grep MONGODB_APP_NAME .env.local | cut -d '=' -f2)
```

**Verify Teams:**
```bash
mongosh "mongodb+srv://${READONLY_USER}:${READONLY_PW}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}" \
  --eval "db.teams.countDocuments()" --quiet
```

**Verify Games:**
```bash
mongosh "mongodb+srv://${READONLY_USER}:${READONLY_PW}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}" \
  --eval "db.games.countDocuments({season: 2025, conferenceGame: true})" --quiet
```

**Verify predictedScore:**
```bash
mongosh "mongodb+srv://${READONLY_USER}:${READONLY_PW}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}" \
  --eval "db.games.countDocuments({conferenceGame: true, predictedScore: {\$exists: true}})" --quiet
```

---

## Success Criteria

- ✅ Valid requests return 2xx status codes
- ✅ Invalid requests return 4xx status codes
- ✅ Response schemas match `lib/api-types.ts` interfaces
- ✅ Database state reflects expected changes
- ✅ No unhandled errors
- ✅ Logs confirm correct database connection

---

## Troubleshooting

**Wrong Database:** Check Vercel logs for `[MongoDB] Connecting to database: {DATABASE}`

**Bypass Token:** Verify `VERCEL_AUTOMATION_BYPASS_SECRET` in `.env.local` matches Vercel setting

**ESPN Rate Limiting:** Wait 1-2 minutes between requests (500ms delay between calls)

**Null Conference Records:** Check ESPN Core API accessibility and logs for errors
