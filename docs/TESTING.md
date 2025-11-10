# Testing Guide

## Manual Testing Steps

This document outlines the manual testing procedures for the SEC Tiebreaker API endpoints.

---

## Prerequisites

### Local Testing
- Development server running: `npm run dev`
- MongoDB connection configured in `.env.local`
- Database: `test`

### Deployed Testing (Vercel)
- Vercel bypass token stored in `.env.local` as `VERCEL_AUTOMATION_BYPASS_SECRET`
- Preview URL: https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/
- Production URL: https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/

### Database Access
- Read-only credentials for verification:
  - User: `readonly`
  - Password: stored in `.env.local` as `MONGODB_PASSWORD_READONLY`
  - Databases: `test`, `preview`, `production`

---

## API Endpoints

### POST /api/pull-teams

Fetches team data from ESPN (site + core APIs) and stores in MongoDB.

#### Local Test

```bash
curl -X POST http://localhost:3000/api/pull-teams \
  -H "Content-Type: application/json" \
  -d '{"teams": ["UGA", "ALA"]}'
```

#### Deployed Test (Preview)

```bash
curl -X POST "https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/api/pull-teams?x-vercel-protection-bypass=YOUR_BYPASS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"teams": ["UGA", "ALA"]}'
```

#### Expected Response

```json
{
  "upserted": 2,
  "lastUpdated": "2025-11-10T16:41:24.908Z",
  "logs": [
    "🔄 RESHAPING ESPN TEAMS DATA",
    "📊 Processing 2 teams",
    "🏈 Team 1: UGA",
    "   Overall Record: 8-1",
    "   Conference Record: 6-1",
    "   Home Record: 4-1",
    "   Away Record: 3-0",
    "✅ Team reshaped successfully"
  ]
}
```

#### Verify in Database

```bash
mongosh "mongodb+srv://readonly:PASSWORD@cluster0.rr6gggn.mongodb.net/DBNAME?appName=SEC-Tiebreaker" \
  --eval "db.teams.find({}, {_id:1, displayName:1, abbreviation:1, 'record.overall':1, 'record.conference':1}).pretty()" \
  --quiet
```

Replace `PASSWORD` with read-only password and `DBNAME` with `test`, `preview`, or `production`.

#### What to Check

- ✅ Status code: 200
- ✅ `upserted` count matches number of teams requested
- ✅ Logs show successful ESPN API calls (both site and core APIs)
- ✅ Conference records are populated (not null)
- ✅ Home/away records are populated
- ✅ Data exists in correct database (test/preview/production)

---

### POST /api/pull

Fetches game data from ESPN scoreboard API and stores in MongoDB.

#### Local Test

```bash
curl -X POST http://localhost:3000/api/pull \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": 8,
    "week": 11,
    "sport": "football",
    "league": "college-football"
  }'
```

#### Deployed Test (Preview)

```bash
curl -X POST "https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/api/pull?x-vercel-protection-bypass=YOUR_BYPASS_TOKEN" \
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
  "logs": [
    "🔄 RESHAPING ESPN SCOREBOARD DATA",
    "📊 Processing 16 games",
    "Game details..."
  ]
}
```

#### Verify in Database

```bash
mongosh "mongodb+srv://readonly:PASSWORD@cluster0.rr6gggn.mongodb.net/DBNAME?appName=SEC-Tiebreaker" \
  --eval "db.games.find({season: 2025, week: 11}, {espnId:1, 'home.teamEspnId':1, 'away.teamEspnId':1, 'home.score':1, 'away.score':1, state:1}).limit(5).pretty()" \
  --quiet
```

#### What to Check

- ✅ Status code: 200
- ✅ `upserted` count matches number of games for that week
- ✅ Games have correct season/week
- ✅ Odds data populated (spread, overUnder, favoriteTeamEspnId)
- ✅ Team ESPN IDs are correct
- ✅ Data stored in correct database

---

### GET /api/games

Queries stored game data from MongoDB.

#### Local Test

```bash
# Get all games for a season/week
curl "http://localhost:3000/api/games?season=2025&week=11"

# Get games for a specific team
curl "http://localhost:3000/api/games?season=2025&week=11"

# Filter by conference
curl "http://localhost:3000/api/games?season=2025&conferenceId=8"
```

#### Deployed Test (Preview)

```bash
curl "https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/api/games?season=2025&week=11&x-vercel-protection-bypass=YOUR_BYPASS_TOKEN"
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

#### What to Check

- ✅ Status code: 200
- ✅ `events` array contains games
- ✅ `teams` array contains team metadata
- ✅ Filters work correctly (season, week, conferenceId)
- ✅ Data comes from correct database

---

## Database Verification

### Check All Teams

```bash
mongosh "mongodb+srv://readonly:PASSWORD@cluster0.rr6gggn.mongodb.net/DBNAME?appName=SEC-Tiebreaker" \
  --eval "db.teams.countDocuments()" \
  --quiet
```

### Check All Games for a Week

```bash
mongosh "mongodb+srv://readonly:PASSWORD@cluster0.rr6gggn.mongodb.net/DBNAME?appName=SEC-Tiebreaker" \
  --eval "db.games.countDocuments({season: 2025, week: 11})" \
  --quiet
```

### Verify Conference Records Are Populated

```bash
mongosh "mongodb+srv://readonly:PASSWORD@cluster0.rr6gggn.mongodb.net/DBNAME?appName=SEC-Tiebreaker" \
  --eval "db.teams.find({'record.conference': null}).count()" \
  --quiet
```

Should return `0` (no teams with null conference records).

---

## Environment Testing

### Test Environment Auto-Detection

1. **Local (test database)**:
   - `MONGODB_DB=test` in `.env.local`
   - Should connect to `test` database

2. **Preview (preview database)**:
   - Vercel sets `VERCEL_ENV=preview`
   - Should connect to `preview` database automatically

3. **Production (production database)**:
   - Vercel sets `VERCEL_ENV=production`
   - Should connect to `production` database automatically

### Verify Database Connection

Check the deployment logs in Vercel or local terminal for:
```
[MongoDB] Connecting to database: test
```

---

## Testing Checklist

### Before Deployment

- [ ] Local tests pass for all endpoints
- [ ] Data verified in `test` database
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Linter passes (`npm run lint`)

### After Deploying to Preview

- [ ] Preview deployment accessible with bypass token
- [ ] `/api/pull-teams` works on preview
- [ ] `/api/pull` works on preview
- [ ] `/api/games` works on preview
- [ ] Data verified in `preview` database
- [ ] Environment auto-detection working (logs show `preview`)

### Before Merging to Main

- [ ] All preview tests pass
- [ ] Data integrity verified
- [ ] No TypeScript errors
- [ ] README documentation updated

### After Deploying to Production

- [ ] Production deployment accessible
- [ ] Test with a single team first
- [ ] Verify `production` database connection
- [ ] Monitor for errors in Vercel logs

---

## Troubleshooting

### Connection Errors

Check environment variables are set in Vercel:
- `MONGODB_USER`
- `MONGODB_PASSWORD`
- `MONGODB_HOST`
- `MONGODB_APP_NAME`

### Wrong Database

Check logs for:
```
[MongoDB] Connecting to database: DBNAME
```

Should match expected environment (`test`, `preview`, or `production`).

### ESPN API Rate Limiting

If ESPN returns 429 errors:
- Wait 1-2 minutes between requests
- Reduce number of teams/games per request
- Current rate limit: 500ms delay between calls

### Null Conference Records

If conference records are `null`:
- Check ESPN Core API is accessible
- Verify `getTeamRecords()` is being called
- Check logs for ESPN Core API errors

---

## Notes

- All tests use read-only credentials for verification
- Tests do not modify production data unless explicitly intended
- Vercel bypass token is required for deployed environment testing
- Local tests use `test` database, deployed tests use environment-specific databases

