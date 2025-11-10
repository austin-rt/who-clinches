# Deployment Testing Guide

Tests ESPN data pull and database verification for deployed environments.

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

```json
{
  "upserted": 2,
  "lastUpdated": "2025-11-10T16:41:24.908Z",
  "logs": [
    "Processing 2 teams",
    "Team 1: UGA",
    "Overall Record: 8-1",
    "Conference Record: 6-1",
    "Home Record: 4-1",
    "Away Record: 3-0",
    "Team reshaped successfully"
  ]
}
```

#### Database Verification

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.find({}, {_id:1, displayName:1, abbreviation:1, 'record.overall':1, 'record.conference':1}).pretty()" \
  --quiet
```

Replace `{DATABASE}` with `preview` or `production`.

#### Checks

- Status code: 200
- `upserted` count matches requested teams
- Conference records are populated (not null)
- Home/away records are populated
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

```json
{
  "fetched": 16,
  "upserted": 16,
  "lastUpdated": "2025-11-10T...",
  "logs": ["Processing 16 games", "Game details..."]
}
```

#### Database Verification

```bash
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/{DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.games.find({season: 2025, week: 11}, {espnId:1, 'home.teamEspnId':1, 'away.teamEspnId':1, 'home.score':1, 'away.score':1, state:1}).limit(5).pretty()" \
  --quiet
```

#### Checks

- Status code: 200
- `upserted` count matches games for that week
- Games have correct season/week
- Odds data populated (spread, overUnder, favoriteTeamEspnId)
- Team ESPN IDs are correct
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

```json
{
  "events": [
    {
      "espnId": "401752766",
      "date": "2025-11-16T00:30Z",
      "week": 12,
      "season": 2025,
      "state": "pre",
      "home": {
        "teamEspnId": "61",
        "abbrev": "UGA",
        "score": null
      },
      "away": {
        "teamEspnId": "251",
        "abbrev": "TEX",
        "score": null
      },
      "odds": {
        "favoriteTeamEspnId": "61",
        "spread": -9.5,
        "overUnder": 52.5
      }
    }
  ],
  "teams": [
    {
      "id": "61",
      "abbrev": "UGA",
      "displayName": "Georgia Bulldogs",
      "logo": "https://..."
    }
  ],
  "lastUpdated": "2025-11-10T..."
}
```

#### Checks

- Status code: 200
- `events` array contains games
- `teams` array contains team metadata
- Filters work correctly
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

