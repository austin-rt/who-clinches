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

### Update Games Cron

**Modes:**
- `mode=season` - Update all games (daily batch)
- `mode=week` - Update current week only
- Default - Update incomplete games only (frequent updates)

**Test:**
```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "${BASE_URL}/api/cron/update-games?mode=season" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Expected:** Status 200, `updated`, `gamesChecked`, `activeGames`, `espnCalls`, `lastUpdated`, `errors`

**Checks:**
- Status 200
- `updated >= 0` (games with score changes)
- `activeGames >= 0` (games in progress)
- `lastUpdated` is valid ISO timestamp
- `errors` is array

### Update Rankings Cron

**Test:**
```bash
curl -X GET "${BASE_URL}/api/cron/update-rankings" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Expected:** Status 200, `updated: 16`, `teamsChecked: 16`, `espnCalls >= 16`, `lastUpdated`, `errors`

**Checks:**
- `updated` equals number of teams in conference (16 for SEC)
- `espnCalls >= 16` (one per team minimum)

### Update Spreads Cron

**Test:**
```bash
curl -X GET "${BASE_URL}/api/cron/update-spreads" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Expected:** Status 200, update counts and timestamp

### Update Team Averages Cron

**Test:**
```bash
curl -X GET "${BASE_URL}/api/cron/update-team-averages" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Expected:** Status 200, update counts and timestamp

### Batch Update Endpoint (Hobby Tier)

**Test:**
```bash
curl -X GET "${BASE_URL}/api/cron/update-all" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Expected:** Status 200, `success`, `jobsRun: 3`, `jobsSucceeded`, `totalDuration`, `results` array, `lastUpdated`

**Checks:**
- `jobsRun = 3` (update-games, update-rankings, update-test-data)
- Each job in `results` has `success`, `status`, `duration`

---

## Authentication Tests

**Missing Token:**
```bash
curl -X GET "${BASE_URL}/api/cron/update-games"
```
**Expected:** Status 401, `{"error": "Unauthorized"}`

**Invalid Token:**
```bash
curl -X GET "${BASE_URL}/api/cron/update-games" \
  -H "Authorization: Bearer invalid-token"
```
**Expected:** Status 401, `{"error": "Unauthorized"}`

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

**Verify Game Fields:**
```bash
mongosh "mongodb+srv://${READONLY_USER}:${READONLY_PW}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}" \
  --eval "var g = db.games.findOne({conferenceGame: true}); print('displayName:', g.displayName, '| predictedScore:', JSON.stringify(g.predictedScore));" --quiet
```

**Verify Team Fields:**
```bash
mongosh "mongodb+srv://${READONLY_USER}:${READONLY_PW}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}" \
  --eval "var t = db.teams.findOne(); print('avgPointsFor:', t.record?.stats?.avgPointsFor);" --quiet
```

**Checks:**
- `displayName` format: "{away abbrev} @ {home abbrev}"
- `predictedScore` present for conference games
- Team averages > 0 after rankings cron

---

## Vercel Configuration

### Hobby Plan (Current)

**Schedule:** `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/update-all",
    "schedule": "0 2 * * *"
  }]
}
```

**Checks:**
- Daily at 2:00 AM UTC
- Shows as "Active" in Vercel dashboard
- Batch endpoint calls: `pull-teams`, `update-games?mode=season`, `update-rankings`, `update-spreads`

### Pro Plan (Future)

**Schedule:** `vercel.pro.json`
- `update-games`: Every 5 minutes during game windows
- `update-spreads`: Hourly (13-5 UTC)
- `update-team-averages`: Weekly Sunday 6 AM UTC
- `update-rankings`: Twice weekly (Sunday & Wednesday 3 AM UTC)

**Migration:** Copy `vercel.pro.json` to `vercel.json` after upgrade

---

## Error Handling

**ESPN API Failure:**
- Cron returns 200 (not 500)
- `errors` array contains error messages
- Partial updates still saved

**Checks:**
- Cron doesn't crash
- Errors logged to database (`errors` collection)
- Error array in response populated

---

## Performance & Idempotency

**Performance:**
- Execution times within Vercel limits (10s Hobby, 60s Pro)
- No 429 (rate limit) errors from ESPN
- Database connections properly closed

**Idempotency:**
- Multiple runs don't cause errors
- Data integrity maintained
- Subsequent runs may show `updated: 0` (no changes)

---

## Troubleshooting

**401 Unauthorized:** `CRON_SECRET` not set in Vercel environment variables

**Cron Not Executing:** Verify Hobby plan limits (max 2 crons, min 1 day frequency), check `vercel.json` syntax

**High API Call Count:** Review cron logic, implement caching, adjust Pro plan schedule

**Database Connection Errors:** Ensure `dbConnect()` called once per request, check MongoDB Atlas limits

---

## Testing Checklist

**Local:**
- [ ] Update games cron (all modes)
- [ ] Update rankings cron
- [ ] Authentication tests
- [ ] Database verification
- [ ] Batch update endpoint
- [ ] Idempotency test

**Vercel:**
- [ ] Cron configuration in dashboard
- [ ] Execution logs show success
- [ ] Monitor for 1 week
