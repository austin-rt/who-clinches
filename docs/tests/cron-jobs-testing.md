# Cron Jobs Testing

Tests all cron job endpoints for data updates, authentication, error handling, and response consistency.

**Related:** [API Reference](../guides/api-reference.md) | [Cron Jobs API Reference](../guides/api-reference-cron.md)

---

## Prerequisites

- `CRON_SECRET` set in `.env.local` and Vercel environment variables
- Database seeded with teams and games
- Access to Vercel deployment logs

---

## Testing Procedures

**Setup**:
```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
```

**Update Games**: `GET /api/cron/cfb/sec/update-games?mode=season` (modes: `season`, `week`, default=incomplete only). Expected: Status 200, `updated`, `gamesChecked`, `activeGames`, `espnCalls`, `lastUpdated`, `errors`

**Update Rankings**: `GET /api/cron/cfb/sec/update-rankings`. Expected: Status 200, `updated: 16`, `teamsChecked: 16`, `espnCalls >= 16`

**Update Spreads**: `GET /api/cron/cfb/sec/update-spreads`. Expected: Status 200, update counts

**Update Team Averages**: `GET /api/cron/cfb/sec/update-team-averages`. Expected: Status 200, update counts

**Batch Update (Hobby)**: `GET /api/cron/update-all`. Expected: Status 200, `success`, `jobsRun: 3`, `jobsSucceeded`, `totalDuration`, `results` array

---

## Authentication Tests

**Missing Token**: `curl -X GET "${BASE_URL}/api/cron/cfb/sec/update-games"` → Status 401

**Invalid Token**: `curl -X GET "${BASE_URL}/api/cron/cfb/sec/update-games" -H "Authorization: Bearer invalid-token"` → Status 401

---

## Database Verification

**Setup** (see [ESPN Data Pipeline Quick Ref](./espn-data-pipeline-quick-ref.md) for full commands):
```bash
READONLY_USER=$(grep MONGODB_USER_READONLY .env.local | cut -d '=' -f2)
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
MONGODB_HOST=$(grep MONGODB_HOST .env.local | cut -d '=' -f2)
MONGODB_DB=$(grep MONGODB_DB .env.local | cut -d '=' -f2)
MONGODB_APP_NAME=$(grep MONGODB_APP_NAME .env.local | cut -d '=' -f2)
MONGODB_URI="mongodb+srv://${READONLY_USER}:${READONLY_PW}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}"
```

**Checks**: `displayName` format "{away abbrev} @ {home abbrev}", `predictedScore` present for conference games, team averages > 0 after rankings cron

---

## Vercel Configuration

**Hobby Plan**: `vercel.json` - Daily at 2:00 AM UTC, batch endpoint `/api/cron/update-all`, shows as "Active" in dashboard

**Pro Plan**: `vercel.pro.json` - `update-games` (every 5 min during game windows), `update-spreads` (hourly 13-5 UTC), `update-team-averages` (weekly Sunday 6 AM), `update-rankings` (twice weekly Sun/Wed 3 AM). Migration: Copy `vercel.pro.json` to `vercel.json` after upgrade

---

## Error Handling & Performance

**ESPN API Failure**: Cron returns 200 (not 500), `errors` array contains messages, partial updates saved, errors logged to database

**Performance**: Execution within Vercel limits (10s Hobby, 60s Pro), no 429 errors, connections properly closed

**Idempotency**: Multiple runs don't cause errors, data integrity maintained, subsequent runs may show `updated: 0`

## Troubleshooting

**401 Unauthorized**: `CRON_SECRET` not set in Vercel environment variables

**Cron Not Executing**: Verify Hobby plan limits (max 2 crons, min 1 day frequency), check `vercel.json` syntax

**High API Call Count**: Review cron logic, implement caching, adjust Pro plan schedule

**Database Connection Errors**: Ensure `dbConnect()` called once per request, check MongoDB Atlas limits

---

## Testing Checklist

**Local**: Update games cron (all modes), update rankings cron, authentication tests, database verification, batch update endpoint, idempotency test

**Vercel**: Cron configuration in dashboard, execution logs show success, monitor for 1 week
