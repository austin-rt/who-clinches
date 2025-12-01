# ESPN Data Pipeline Testing

Complete testing guide for ESPN data ingestion, transformation, and persistence.

**Related:** [Quick Reference](./espn-data-pipeline-quick-ref.md) | [ESPN API Testing](./espn-api-testing.md) | [API Reference](../guides/api-reference.md)

**Note:** All credentials must be read from `.env.local` - do not hardcode secrets.

---

## Prerequisites

Credentials in `.env.local`:
- `VERCEL_AUTOMATION_BYPASS_SECRET` - Bypass token (auto-handled by scripts/tests, manual for curl)
- `MONGODB_USER_READONLY`, `MONGODB_PASSWORD_READONLY` - Database verification

---

## API Endpoints

### POST /api/games/[sport]/[conf]

**Example**: `POST /api/games/cfb/sec`

Fetches game data from ESPN scoreboard API, upserts to database, and returns reshaped data. Teams are automatically extracted from scoreboard data.

**Pre-check**: Verify games exist for target season/week (skip if data exists).

**Full Season Pull** (recommended): If `week` not specified, endpoint dynamically fetches ESPN calendar to determine regular season weeks (e.g., 1-14 for 2025).

**Command**:
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl -X POST "{BASE_URL}/api/games/cfb/sec?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" -d '{"season": 2025}'
```

**Single Week** (optional):
```bash
curl -X POST "{BASE_URL}/api/games/cfb/sec?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" -d '{"season": 2025, "week": 11}'
```

**Expected Response**: Status 200, `events` array (GameLean[]), `teams` array (TeamMetadata[]), `lastUpdated` timestamp

**Checks**: Status 200, `upserted` matches games for week, `displayName` present (format: "{away abbrev} @ {home abbrev}"), `predictedScore` present for conference games, data in correct database

---

### GET /api/games/[sport]/[conf]

**Example**: `/api/games/cfb/sec`

Read-only query from database (does not fetch from ESPN).

**Command**:
```bash
curl "{BASE_URL}/api/games/cfb/sec?season=2025&week=11&x-vercel-protection-bypass=${BYPASS_TOKEN}"
```

**Expected Response**: Status 200, `events` array (GameLean[]), `teams` array (TeamMetadata[]), `lastUpdated` timestamp

**Checks**: Status 200, `events` matches query, `teams` contains all teams from games, filters work correctly

---

## Database Verification

**Setup variables** (see [Quick Reference](./espn-data-pipeline-quick-ref.md) for full commands): Extract MongoDB credentials from `.env.local`, construct `MONGODB_URI`

**Expected Results**:
- Teams: 16 teams in database (extracted from games)
- Games: ~128 games for 2025 season (weeks 1-14)
- Conference records: Calculated from completed conference games (format: "W-L", e.g., "7-1"). Verify with `db.teams.find({'record.conference': null}).count()` - should return 0 after games are completed. Records are updated automatically when games are fetched/updated.
- Database connection: Vercel logs show `[MongoDB] Connecting to database: {DATABASE}` (preview/production)

---

## Testing Checklist

**For each environment (Preview/Production)**:
- [ ] Pre-check: Games count for target season (skip if data exists)
- [ ] POST /api/games/cfb/sec returns 200 (includes `events` array with games) if needed
- [ ] GET /api/games/cfb/sec returns 200
- [ ] Database verification: 16 teams, ~128 games (2025, weeks 1-14)
- [ ] Games include team display fields (displayName, logo, color)
- [ ] Conference records populated (not null)
- [ ] Logs show correct database connection

---

## Troubleshooting

**Wrong database**: Check Vercel logs for `[MongoDB] Connecting to database: {DATABASE}`, verify `VERCEL_ENV`

**Bypass token**: Verify `VERCEL_AUTOMATION_BYPASS_SECRET` matches Vercel setting (auto-handled by scripts/tests)

**Rate limiting**: Wait 1-2 minutes between requests (500ms delay between calls)

**Null conference records**: Verify completed conference games exist in database (`db.games.find({conferenceGame: true, completed: true, 'home.score': {$ne: null}, 'away.score': {$ne: null}})`). Records are calculated from games, not from ESPN API. If games are completed but records are null, check error logs for calculation errors.
