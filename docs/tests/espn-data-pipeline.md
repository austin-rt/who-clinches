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

### POST /api/pull

Fetches game data from ESPN scoreboard API and stores in MongoDB.

#### Command Template

```bash
curl -X POST "{BASE_URL}/api/pull?x-vercel-protection-bypass=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": 8,
    "week": 11
  }'
```

#### Expected Response

See `app/api/pull/route.ts` for response interface.

Response should include:
- `fetched`: number of games from ESPN
- `upserted`: number of games inserted/updated
- `lastUpdated`: timestamp
- `logs`: array of processing messages

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

### Check Games Count for Week

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.games.countDocuments({season: 2025, week: 11})" \
  --quiet
```

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
- [ ] POST /api/pull-teams returns 200
- [ ] POST /api/pull returns 200
- [ ] GET /api/games returns 200
- [ ] Teams data verified in `preview` database
- [ ] Games data verified in `preview` database
- [ ] Conference records populated (not null)
- [ ] Logs show: `[MongoDB] Connecting to database: preview`

### Production (main branch)
- [ ] Preview tests completed successfully first
- [ ] Deployment accessible with bypass token
- [ ] Test with single team first
- [ ] POST /api/pull-teams returns 200
- [ ] POST /api/pull returns 200
- [ ] GET /api/games returns 200
- [ ] Teams data verified in `production` database
- [ ] Games data verified in `production` database
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

