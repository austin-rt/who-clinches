# ESPN Data Pipeline Testing

Tests the complete ESPN data pipeline: data ingestion from ESPN API, transformation, persistence to MongoDB, and retrieval for deployed environments.

**Note:** All credentials must be read from `.env.local` - do not hardcode secrets.

---

## Environments

### Preview (develop branch)
- **URL**: https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/
- **Database**: `preview`
- **Vercel Env**: `VERCEL_ENV=preview`

### Production (main branch)
- **URL**: https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/
- **Database**: `production`
- **Vercel Env**: `VERCEL_ENV=production`
- **⚠️ CAUTION**: Tests modify production data

---

## Prerequisites

All credentials stored in `.env.local`:
- `VERCEL_AUTOMATION_BYPASS_SECRET` - Bypass token for protected deployments
- `MONGODB_PASSWORD_READONLY` - Read-only password for database verification
- Read-only user: `readonly`

---

## API Endpoints

### POST /api/pull-teams

Fetches team data from ESPN (site + core APIs) and stores in MongoDB.

#### Command Template

Replace `{BASE_URL}` and `{DATABASE}` based on environment:
- Preview: `BASE_URL=https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/`, `DATABASE=preview`
- Production: `BASE_URL=https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/`, `DATABASE=production`

```bash
curl -X POST "{BASE_URL}/api/pull-teams?x-vercel-protection-bypass=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)" \
  -H "Content-Type: application/json" \
  -d '{"teams": ["UGA", "ALA"]}'
```

#### Expected Response

See `app/api/pull-teams/route.ts` for `PullTeamsResponse` interface.

Response should include:
- `upserted`: number of teams inserted/updated
- `lastUpdated`: timestamp
- `logs`: array of processing messages

#### Database Verification

See `lib/models/Team.ts` for `ITeam` interface and schema.

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.find({}, {_id:1, displayName:1, abbreviation:1, 'record.overall':1, 'record.conference':1, nationalRanking:1, conferenceStanding:1}).pretty()" \
  --quiet
```

Replace `{DATABASE}` with `preview` or `production`.

#### Checks

- Status code: 200
- `upserted` count matches requested teams
- Conference records populated (not null)
- Home/away records populated
- National rankings populated for ranked teams
- Conference standings populated
- Data exists in correct database

---

### POST /api/pull-games

Fetches game data from ESPN scoreboard API and stores in MongoDB.

**Full Season Pull:** If `week` is not specified, the endpoint dynamically fetches the ESPN calendar to determine the "Regular Season" weeks and pulls all of them. For 2025, this is weeks 1-14 (SEC Championship excluded). This ensures the database has complete regular season data without hardcoding week ranges.

#### Command Template (Full Season - Recommended)

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

Use this to update only a specific week:

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
  --eval "db.games.find({season: 2025, week: 11}, {espnId:1, 'home.teamEspnId':1, 'away.teamEspnId':1, 'home.score':1, 'away.score':1, state:1, conferenceGame:1}).limit(5).pretty()" \
  --quiet
```

#### Checks

- Status code: 200
- `upserted` count matches games for that week
- Games have correct season/week
- Odds data populated when available
- Team ESPN IDs correct
- Conference game flag set correctly
- Data stored in correct database

---

### GET /api/games

Queries stored game data from MongoDB.

#### Command Template

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
- [ ] POST /api/pull-teams returns 200 (16 teams)
- [ ] POST /api/pull-games returns 200 for all regular season weeks (dynamically determined, e.g., 1-14 for 2025)
- [ ] Response includes `weeksPulled` array with all pulled weeks
- [ ] GET /api/games returns 200
- [ ] Teams data verified in `preview` database (16 teams)
- [ ] Games data verified in `preview` database (~128 games for 2025, weeks 1-14)
- [ ] Games include team display fields (displayName, logo, color)
- [ ] Conference records populated (not null)
- [ ] Logs show: `[MongoDB] Connecting to database: preview`

### Production (main branch)
- [ ] Preview tests completed successfully first
- [ ] Deployment accessible with bypass token
- [ ] POST /api/pull-teams returns 200 (16 teams)
- [ ] POST /api/pull-games returns 200 for all regular season weeks (dynamically determined, e.g., 1-14 for 2025)
- [ ] Response includes `weeksPulled` array with all pulled weeks
- [ ] GET /api/games returns 200
- [ ] Teams data verified in `production` database (16 teams)
- [ ] Games data verified in `production` database (~128 games for 2025, weeks 1-14)
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
Verify token in `.env.local` matches Vercel deployment setting.

### ESPN API Rate Limiting
Wait 1-2 minutes between requests. Current delay: 500ms between calls.

### Null Conference Records
Check ESPN Core API accessibility and logs for errors.

