# Comprehensive API Testing Guide

Complete testing procedures for all SEC Tiebreaker API endpoints with valid and invalid payloads.

**Environment-agnostic**: Use placeholders `{BASE_URL}`, `{DATABASE}`, and credential variables for any environment.

---

## References

- `docs/api-reference.md` - Complete API endpoint documentation
- `docs/ESPN-API-TESTING.md` - ESPN API reference and known issues
- `lib/api-types.ts` - Request/response type definitions

---

## Prerequisites

**Credentials from `.env.local`:**
- `VERCEL_AUTOMATION_BYPASS_SECRET` - For protected deployments (Vercel preview/production)
- `CRON_SECRET` - For cron job endpoints
- `MONGODB_PASSWORD_READONLY` - For database verification queries

**Required for testing:**
- Environment variables set: `BASE_URL`, `DATABASE`
- Local server running (for local testing)
- Database access for verification queries

---

## Testing Scope

### 1. Data Seeding Endpoints

#### POST /api/pull-teams

**Pre-Seeding Check:**

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

**⚠️ IMPORTANT: Always seed ALL teams (conferenceId: 8) before proceeding with remaining tests**

**Valid Payloads:**

```bash
# Test 1: Pull all SEC teams (REQUIRED - run this first)
curl -X POST "{BASE_URL}/api/pull-teams?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "conferenceId": 8}'

# Test 2: Pull specific teams (optional - for testing partial updates)
curl -X POST "{BASE_URL}/api/pull-teams?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "teams": ["UGA", "ALA"]}'
```

**Expected:** 
- Test 1: Status 200, `upserted`: 16, `lastUpdated` timestamp
- Test 2: Status 200, `upserted`: 2, `lastUpdated` timestamp

**Before proceeding to games seeding, verify all 16 teams are in database.**

**Invalid Payloads:**

```bash
# Test 3: Missing sport
curl -X POST "{BASE_URL}/api/pull-teams?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"league": "college-football", "conferenceId": 8}'

# Test 4: Missing league
curl -X POST "{BASE_URL}/api/pull-teams?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "conferenceId": 8}'

# Test 5: Missing both teams and conferenceId
curl -X POST "{BASE_URL}/api/pull-teams?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football"}'

# Test 6: Empty teams array
curl -X POST "{BASE_URL}/api/pull-teams?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "teams": []}'
```

**Expected:** Status 400, response includes error message and error code

**Database Verification:**

```bash
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.find({}, {_id:1, displayName:1, abbreviation:1, 'record.overall':1, 'record.conference':1}).limit(5).pretty()" \
  --quiet
```

---

#### POST /api/pull-games

**Prerequisites:** All SEC teams must be seeded first (`POST /api/pull-teams` with `conferenceId: 8`) for accurate `predictedScore` calculations.

**Pre-Seeding Check:**

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

**Valid Payloads:**

```bash
# Test 1: Pull full season (no week specified - dynamically fetches all regular season weeks)
curl -X POST "{BASE_URL}/api/pull-games?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "season": 2025, "conferenceId": 8}'

# Test 2: Pull specific week
curl -X POST "{BASE_URL}/api/pull-games?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "season": 2025, "conferenceId": 8, "week": 11}'
```

**Expected:** Status 200, response includes `upserted` count, `weeksPulled` array, and `lastUpdated` timestamp

**Invalid Payloads:**

```bash
# Test 3: Missing sport
curl -X POST "{BASE_URL}/api/pull-games?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"league": "college-football", "season": 2025, "conferenceId": 8}'

# Test 4: Missing league
curl -X POST "{BASE_URL}/api/pull-games?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "season": 2025, "conferenceId": 8}'

# Test 5: Missing season
curl -X POST "{BASE_URL}/api/pull-games?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "conferenceId": 8}'

# Test 6: Invalid week (negative)
curl -X POST "{BASE_URL}/api/pull-games?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football", "league": "college-football", "season": 2025, "conferenceId": 8, "week": -1}'
```

**Expected:** Status 400, response includes error message and error code

**Database Verification:**

```bash
# Verify games stored
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.games.find({season: 2025, week: 11}, {espnId:1, displayName:1, 'home.score':1, 'away.score':1, state:1, conferenceGame:1}).limit(5).pretty()" \
  --quiet

# Verify games count by week
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "console.log('Total games:', db.games.countDocuments()); const byWeek = db.games.aggregate([{ \$group: { _id: '\$week', count: { \$sum: 1 } } }, { \$sort: { _id: 1 } }]).toArray(); byWeek.forEach(w => console.log('Week', w._id + ':', w.count, 'games'));" \
  --quiet

# Verify displayName field present
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.games.countDocuments({displayName: {\$exists: false}})" \
  --quiet
```

**Expected:** displayName count should be 0 (all games have displayName)

---

### 2. Data Retrieval Endpoints

#### GET /api/games

**Valid Payloads:**

```bash
# Test 1: Filter by season and week
curl "{BASE_URL}/api/games?season=2025&week=11&x-vercel-protection-bypass=${BYPASS_TOKEN}" | jq .

# Test 2: Filter by season and conferenceId
curl "{BASE_URL}/api/games?season=2025&conferenceId=8&x-vercel-protection-bypass=${BYPASS_TOKEN}" | jq .

# Test 3: Filter by state
curl "{BASE_URL}/api/games?season=2025&state=post&x-vercel-protection-bypass=${BYPASS_TOKEN}" | jq .

# Test 4: Filter by date range
curl "{BASE_URL}/api/games?season=2025&from=2025-11-01&to=2025-11-30&x-vercel-protection-bypass=${BYPASS_TOKEN}" | jq .

# Test 5: Multiple filters
curl "{BASE_URL}/api/games?season=2025&week=11&conferenceId=8&state=post&x-vercel-protection-bypass=${BYPASS_TOKEN}" | jq .
```

**Expected:** Status 200, response includes `events` array, `teams` array, and `lastUpdated` timestamp

**Invalid Payloads:**

```bash
# Test 6: Invalid season format (string)
curl "{BASE_URL}/api/games?season=invalid&week=11&x-vercel-protection-bypass=${BYPASS_TOKEN}"

# Test 7: Invalid week format (string)
curl "{BASE_URL}/api/games?season=2025&week=invalid&x-vercel-protection-bypass=${BYPASS_TOKEN}"

# Test 8: Invalid state value
curl "{BASE_URL}/api/games?season=2025&state=invalid&x-vercel-protection-bypass=${BYPASS_TOKEN}"
```

**Expected:** For invalid formats, API may return 200 with empty results or ignore invalid parameters (verify actual behavior)

**Checks:**
- `events` array contains games matching query filters
- `teams` array contains metadata for all teams in returned games
- Games include `displayName` field
- Conference games have appropriate flags set

---

### 3. Simulation Endpoint

#### POST /api/simulate

**Valid Payloads:**

```bash
# Test 1: No overrides (use real scores + predicted scores for incomplete games)
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}'

# Test 2: Single game override
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752759": {"homeScore": 28, "awayScore": 21}}}'

# Test 3: Multiple game overrides
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752759": {"homeScore": 28, "awayScore": 21}, "401752760": {"homeScore": 14, "awayScore": 35}}}'
```

**Expected:** Status 200, response includes `standings` array (all 16 SEC teams with rankings, records, and tiebreaker explanations)

**Invalid Payloads:**

```bash
# Test 4: Missing season
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"conferenceId": "8", "overrides": {}}'

# Test 5: Missing conferenceId
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "overrides": {}}'

# Test 6: Invalid override format (array instead of object)
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": [{"gameId": "401752759", "homeScore": 28, "awayScore": 21}]}'

# Test 7: Invalid score (tie score)
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752759": {"homeScore": 21, "awayScore": 21}}}'

# Test 8: Invalid score (negative)
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752759": {"homeScore": -5, "awayScore": 21}}}'

# Test 9: Invalid score (non-integer)
curl -X POST "{BASE_URL}/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752759": {"homeScore": 21.5, "awayScore": 20}}}'
```

**Expected:** Status 400, response includes error message and error code

**Checks:**
- Standings array contains all 16 SEC teams
- Each team has: rank, teamId, abbrev, displayName, logo, color, record, confRecord, explainPosition
- Rankings are 1-16 with no gaps
- Tiebreaker rules applied correctly (A-E)
- Overrides reflected in final standings

#### Test Scenarios with Expected Results

**Scenario 1: 2025 Season with Real + Predicted Scores (No Overrides)**

Payload:
```json
{
  "season": 2025,
  "conferenceId": "8",
  "overrides": {}
}
```

Expected Result (based on 2025 data as of testing):
- All 16 teams ranked
- Teams ordered by conference record (wins/losses)
- Teams with same record broken by tiebreaker rules A-E
- Top teams should have 6-2 or better records
- Bottom teams should have 0-8 or 1-7 records

**Verification Steps:**
1. Check that `standings.length === 16`
2. Check that ranks are 1-16 with no duplicates or gaps
3. Check that higher-ranked teams have better or equal win percentages
4. For teams with same record, verify tiebreaker explanation in `explainPosition`

---

### 4. Cron Job Endpoints

**Authentication Required:** All cron endpoints require `Authorization: Bearer {CRON_SECRET}` header

#### GET /api/cron/update-live-games

**Valid Request:**

```bash
curl -X GET "{BASE_URL}/api/cron/update-live-games" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Expected:** Status 200, response includes:
- `updated`: number of games updated
- `gamesChecked`: number of games examined
- `activeGames`: number of games currently in progress
- `espnCalls`: number of ESPN API calls made
- `lastUpdated`: timestamp
- `errors`: array (may be empty)

**Invalid Requests:**

```bash
# Test 1: Missing authentication
curl -X GET "{BASE_URL}/api/cron/update-live-games"

# Test 2: Invalid token
curl -X GET "{BASE_URL}/api/cron/update-live-games" \
  -H "Authorization: Bearer invalid_token"

# Test 3: Wrong HTTP method
curl -X POST "{BASE_URL}/api/cron/update-live-games" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Expected:** Status 401 for auth failures, appropriate error for wrong method

---

#### GET /api/cron/update-rankings

**Valid Request:**

```bash
curl -X GET "{BASE_URL}/api/cron/update-rankings" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Expected:** Status 200, response includes:
- `updated`: number of teams updated (should be 16 for SEC)
- `teamsChecked`: number of teams examined
- `espnCalls`: number of ESPN API calls made
- `lastUpdated`: timestamp
- `errors`: array (may be empty)

**Invalid Requests:**

```bash
# Test 1: Missing authentication
curl -X GET "{BASE_URL}/api/cron/update-rankings"

# Test 2: Invalid token
curl -X GET "{BASE_URL}/api/cron/update-rankings" \
  -H "Authorization: Bearer invalid_token"
```

**Expected:** Status 401 for auth failures

**Database Verification:**

```bash
# Verify rankings updated
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.find({}, {abbreviation:1, nationalRanking:1, conferenceStanding:1, 'record.conference':1}).pretty()" \
  --quiet

# Verify no null conference records
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.countDocuments({'record.conference': null})" \
  --quiet
```

**Expected:** Conference records count should be 0 (no teams with null conference records)

---

#### GET /api/cron/update-spreads

**Note:** Pro mode endpoint - may not be actively scheduled in Hobby plan

**Valid Request:**

```bash
curl -X GET "{BASE_URL}/api/cron/update-spreads" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Expected:** Status 200, response includes update counts and timestamp

**Invalid Requests:**

```bash
# Test 1: Missing authentication
curl -X GET "{BASE_URL}/api/cron/update-spreads"
```

**Expected:** Status 401

---

#### GET /api/cron/update-team-averages

**Note:** Pro mode endpoint - may not be actively scheduled in Hobby plan

**Valid Request:**

```bash
curl -X GET "{BASE_URL}/api/cron/update-team-averages" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Expected:** Status 200, response includes update counts and timestamp

**Invalid Requests:**

```bash
# Test 1: Missing authentication
curl -X GET "{BASE_URL}/api/cron/update-team-averages"
```

**Expected:** Status 401

**Database Verification:**

```bash
# Verify team averages updated
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.find({}, {abbreviation:1, 'record.stats.avgPointsFor':1, 'record.stats.avgPointsAgainst':1}).pretty()" \
  --quiet
```

---

## Additional Database Verification

### Verify Database Connection (Vercel deployments)

Check Vercel deployment logs for:
```
[MongoDB] Connecting to database: {DATABASE}
```

Should show `dev` (local), `preview` (staging), or `production` based on environment.

### Check Data Integrity

```bash
# Count teams
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.countDocuments()" \
  --quiet

# Count games
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.games.countDocuments({season: 2025})" \
  --quiet

# Verify predictedScore field (should exist for conference games)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "console.log('Conference games with predictedScore:', db.games.countDocuments({conferenceGame: true, predictedScore: {\$exists: true}})); console.log('Total conference games:', db.games.countDocuments({conferenceGame: true}));" \
  --quiet
```

---

## Success Criteria

- ✅ All valid requests return appropriate 2xx status codes
- ✅ All invalid requests return appropriate 4xx status codes
- ✅ Response schemas match documented interfaces in `lib/api-types.ts`
- ✅ Database state reflects expected changes in correct database
- ✅ No unhandled errors or exceptions
- ✅ Logs confirm connection to correct database (for Vercel deployments)
- ✅ 100% accuracy between documentation and implementation

---

## Troubleshooting

### Wrong Database Connected
Check Vercel logs for `[MongoDB] Connecting to database: {DATABASE}`.
Verify `VERCEL_ENV` is set correctly in Vercel.

### Bypass Token Not Working
Verify token in `.env.local` matches Vercel deployment setting.
Token only required for Vercel deployments, not local.

### ESPN API Rate Limiting
Wait 1-2 minutes between requests. Current delay: 500ms between calls.

### Null Conference Records
Check ESPN Core API accessibility and logs for errors.
May indicate ESPN API issues or incorrect record type constants.

