# ESPN Data Pipeline Testing

Tests the complete ESPN data pipeline: data ingestion from ESPN API, transformation, persistence to MongoDB, and retrieval for deployed environments.

**Note:** All credentials must be read from `.env.local` - do not hardcode secrets.

**Related Documentation:**
- [ESPN API Testing](./espn-api-testing.md) - Field verification patterns and API inconsistencies
- [API Reference](../guides/api-reference.md) - Complete endpoint documentation

---

## Environments

### Local (develop branch)

- **URL**: http://localhost:3000
- **Database**: `dev`
- **Branch**: `develop`
- **Purpose**: Active development and testing

### Preview/Staging (develop branch on Vercel)

- **URL**: https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/
- **Database**: `preview`
- **Vercel Env**: `VERCEL_ENV=preview`
- **Branch**: `develop` (auto-deploys to Vercel preview on push)
- **Purpose**: Staging environment for testing before production

### Production (main branch)

- **URL**: https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/
- **Database**: `production`
- **Vercel Env**: `VERCEL_ENV=production`
- **Branch**: `main` (auto-deploys on push)
- **⚠️ CAUTION**: Tests modify production data

---

## Prerequisites

All credentials stored in `.env.local`:

- `VERCEL_AUTOMATION_BYPASS_SECRET` - Required bypass token for protected deployments (preview/production)
  - Automatically handled by `scripts/db-check-and-seed.js` when using `--env preview` or `--env production`
  - Automatically handled by Jest tests (via `__tests__/setup.ts`) when `BASE_URL` contains `vercel.app`
  - Must be manually added to curl commands when testing preview/production deployments directly
- `MONGODB_PASSWORD_READONLY` - Read-only password for database verification
- Read-only user: `readonly`

---

## API Endpoints

### POST /api/pull-teams

Fetches team data from ESPN (site + core APIs) and stores in MongoDB.

#### Pre-Seeding Check

**Always check if teams already exist before seeding:**

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "const count = db.teams.countDocuments(); console.log('Teams in database:', count); if (count > 0) { console.log('Sample teams:'); db.teams.find({}, {_id:1, abbreviation:1, displayName:1}).limit(3).forEach(printjson); }" \
  --quiet
```

**Decision:**

- If teams exist and data looks current: **SKIP seeding**, report as "Seeding not needed - {count} teams already present"
- If teams missing or data looks stale: **PROCEED with seeding**, report as "Seeding needed - database empty/stale"

#### Command Template

Replace `{BASE_URL}` and `{DATABASE}` based on environment:

- Local: `BASE_URL=http://localhost:3000`, `DATABASE=dev`
- Preview/Staging: `BASE_URL=https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/`, `DATABASE=preview`
- Production: `BASE_URL=https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/`, `DATABASE=production`

**⚠️ IMPORTANT: Always seed ALL teams (conferenceId: 8) before proceeding with remaining tests**

**Note:** For preview/production deployments, bypass token is automatically handled by `scripts/db-check-and-seed.js`. For manual curl commands, use:

```bash
# Seed all SEC teams (required for accurate predictedScore calculations)
# Bypass token automatically handled by db:check script, or manually for curl:
curl -X POST "{BASE_URL}/api/pull-teams?x-vercel-protection-bypass=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "conferenceId": 8}'
```

#### Expected Response

See `app/api/pull-teams/route.ts` for `PullTeamsResponse` interface.

Response should include:

- `upserted`: 16 (all SEC teams)
- `lastUpdated`: timestamp

**Before proceeding to other tests, verify all 16 teams were seeded successfully.**

#### Database Verification

See `lib/models/Team.ts` for `ITeam` interface and schema.

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.find({}, {_id:1, displayName:1, abbreviation:1, 'record.overall':1, 'record.conference':1, nationalRanking:1, conferenceStanding:1}).pretty()" \
  --quiet
```

Replace `{DATABASE}` with `dev` (local), `preview` (staging), or `production`.

#### Checks

- Status code: 200
- `upserted` count = 16 (all SEC teams)
- Conference records populated (not null)
- Home/away records populated
- National rankings populated for ranked teams
- Conference standings populated
- Data exists in correct database

**Do not proceed to games seeding until all 16 teams are confirmed in database.**

---

### POST /api/pull-games

Fetches game data from ESPN scoreboard API and stores in MongoDB.

**Prerequisites:** All SEC teams must be seeded first (`POST /api/pull-teams` with `conferenceId: 8`) for accurate `predictedScore` calculations.

**Full Season Pull:** If `week` is not specified, the endpoint dynamically fetches the ESPN calendar to determine the "Regular Season" weeks and pulls all of them. For 2025, this is weeks 1-14 (SEC Championship excluded). This ensures the database has complete regular season data without hardcoding week ranges.

#### Pre-Seeding Check

**Always check if games already exist before seeding:**

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "const count = db.games.countDocuments({season: 2025}); console.log('Games in database (2025 season):', count); if (count > 0) { console.log('Games by week:'); const byWeek = db.games.aggregate([{ \$match: {season: 2025} }, { \$group: { _id: '\$week', count: { \$sum: 1 } } }, { \$sort: { _id: 1 } }]).toArray(); byWeek.forEach(w => console.log('  Week', w._id + ':', w.count, 'games')); }" \
  --quiet
```

**Decision:**

- If games exist for target season/week: **SKIP seeding**, report as "Seeding not needed - {count} games already present for season/week"
- If games missing or incomplete: **PROCEED with seeding**, report as "Seeding needed - games missing for season/week"
- If testing specific week and it exists: **SKIP**, report as "Week {X} already seeded with {count} games"

#### Command Template (Full Season - Recommended)

**Note:** Bypass token is automatically handled by `scripts/db-check-and-seed.js`. For manual curl commands:

```bash
curl -X POST "{BASE_URL}/api/pull-games?x-vercel-protection-bypass=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)" \
  -H "Content-Type: application/json" \
  -d '{
    "sport": "football",
    "league": "college-football",
    "season": 2025,
    "conferenceId": 8
  }'
```

This will:

- Query ESPN calendar API to determine regular season weeks dynamically
- Pull all regular season weeks (e.g., 1-14 for 2025, excluding SEC Championship)
- Upsert games (existing games updated, new games inserted)
- Return the total number of games upserted and the list of weeks pulled

#### Command Template (Single Week - Optional)

Use this to update only a specific week. **Note:** Bypass token automatically handled by `scripts/db-check-and-seed.js`:

```bash
curl -X POST "{BASE_URL}/api/pull-games?x-vercel-protection-bypass=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)" \
  -H "Content-Type: application/json" \
  -d '{
    "sport": "football",
    "league": "college-football",
    "season": 2025,
    "conferenceId": 8,
    "week": 11
  }'
```

#### Expected Response

See `app/api/pull-games/route.ts` for response interface.

Response should include:

- `upserted`: number of games inserted/updated
- `weeksPulled`: array of week numbers that were pulled
- `lastUpdated`: timestamp
- `errors`: array of error messages (if any, optional field)

#### Database Verification

See `lib/models/Game.ts` for `IGame` interface and schema.

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.games.find({season: 2025, week: 11}, {espnId:1, displayName:1, 'home.teamEspnId':1, 'away.teamEspnId':1, 'home.score':1, 'away.score':1, 'odds.spread':1, predictedScore:1, state:1, conferenceGame:1}).limit(5).pretty()" \
  --quiet
```

#### Checks

- Status code: 200
- `upserted` count matches games for that week
- Games have correct season/week
- **`displayName` field present** (format: "{away abbrev} @ {home abbrev}")
- **`predictedScore` field present** for conference games
  - Completed games: `predictedScore` matches real scores
  - Incomplete games: `predictedScore` calculated from spread + team averages
- Odds data populated when available
- Team ESPN IDs correct
- Conference game flag set correctly
- Data stored in correct database

---

### GET /api/games

Queries stored game data from MongoDB.

#### Command Template

**Note:** Bypass token automatically handled by Jest tests. For manual curl commands:

```bash
# Get all games for season/week
curl "{BASE_URL}/api/games?season=2025&week=11&x-vercel-protection-bypass=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)"

# Get games by conference
curl "{BASE_URL}/api/games?season=2025&conferenceId=8&x-vercel-protection-bypass=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)"
```

#### Expected Response

See `app/api/games/route.ts` for response interface.

Response should include:

- `events`: array of `GameLean` objects (see `lib/types.ts`)
- `teams`: array of team metadata objects
- `lastUpdated`: timestamp

#### Checks

- Status code: 200
- `events` array contains games matching query
- `teams` array contains all teams from games
- Filters work correctly (season, week, conferenceId)
- Data comes from correct database

---

## Additional Database Verification

### Check Teams Count

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.countDocuments()" \
  --quiet
```

### Check Games Count by Week

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "
console.log('Total games:', db.games.countDocuments());
console.log('');
console.log('Games by week:');
const byWeek = db.games.aggregate([
  { \$group: { _id: '\$week', count: { \$sum: 1 } } },
  { \$sort: { _id: 1 } }
]).toArray();
byWeek.forEach(w => console.log('Week', w._id + ':', w.count, 'games'));
" \
  --quiet
```

Expected output for complete dataset (weeks 1-14 for 2025 season):

- Total games: ~128
- Week 1: 16 games
- Week 2-14: varying counts (typically 8-10 games per week)

### Verify Conference Records

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.find({'record.conference': null}).count()" \
  --quiet
```

Should return `0` (no teams with null conference records).

### Verify Database Connection Logs

Check Vercel deployment logs for:

```
[MongoDB] Connecting to database: {DATABASE}
```

Should show `preview` or `production` based on environment.

---

## Testing Checklist

### Preview (develop branch)

- [ ] Deployment accessible with bypass token
- [ ] **Pre-check**: Teams count in `preview` database
  - [ ] If teams exist: Seeding skipped (report count)
  - [ ] If teams missing: POST /api/pull-teams returns 200 (16 teams)
- [ ] **Pre-check**: Games count in `preview` database for target season
  - [ ] If games exist: Seeding skipped (report count by week)
  - [ ] If games missing: POST /api/pull-games returns 200 for all regular season weeks (dynamically determined, e.g., 1-14 for 2025)
  - [ ] Response includes `weeksPulled` array with all pulled weeks
- [ ] GET /api/games returns 200
- [ ] Teams data verified in `preview` database (16 teams expected)
- [ ] Games data verified in `preview` database (~128 games for 2025, weeks 1-14 expected)
- [ ] Games include team display fields (displayName, logo, color)
- [ ] Conference records populated (not null)
- [ ] Logs show: `[MongoDB] Connecting to database: preview`

### Production (main branch)

- [ ] Preview tests completed successfully first
- [ ] Deployment accessible with bypass token
- [ ] **Pre-check**: Teams count in `production` database
  - [ ] If teams exist: Seeding skipped (report count)
  - [ ] If teams missing: POST /api/pull-teams returns 200 (16 teams)
- [ ] **Pre-check**: Games count in `production` database for target season
  - [ ] If games exist: Seeding skipped (report count by week)
  - [ ] If games missing: POST /api/pull-games returns 200 for all regular season weeks (dynamically determined, e.g., 1-14 for 2025)
  - [ ] Response includes `weeksPulled` array with all pulled weeks
- [ ] GET /api/games returns 200
- [ ] Teams data verified in `production` database (16 teams expected)
- [ ] Games data verified in `production` database (~128 games for 2025, weeks 1-14 expected)
- [ ] Games include team display fields (displayName, logo, color)
- [ ] Conference records populated (not null)
- [ ] Logs show: `[MongoDB] Connecting to database: production`
- [ ] Monitor for errors for 5-10 minutes

---

## Troubleshooting

### Wrong Database Connected

Check Vercel logs for `[MongoDB] Connecting to database: {DATABASE}`.
Verify `VERCEL_ENV` is set correctly in Vercel.

### Bypass Token Not Working

- Verify `VERCEL_AUTOMATION_BYPASS_SECRET` in `.env.local` matches Vercel deployment setting
- Token is automatically handled by `scripts/db-check-and-seed.js` and Jest tests
- For manual curl commands, ensure token is correctly extracted from `.env.local`

### ESPN API Rate Limiting

Wait 1-2 minutes between requests. Current delay: 500ms between calls.

### Null Conference Records

Check ESPN Core API accessibility and logs for errors.
