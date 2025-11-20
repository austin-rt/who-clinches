# Cron Jobs Testing

Tests all cron job endpoints for data updates, authentication, error handling, and response consistency.

**Related Documentation:**
- [API Reference](../guides/api-reference.md) - Complete cron endpoint documentation

---

## Prerequisites

- `CRON_SECRET` set in `.env.local` and Vercel environment variables
- Database seeded with teams and games
- Access to Vercel deployment logs

---

## Test 1: Update Games Cron

Updates scores for games. Can update all games or just incomplete ones.

### Local Test (Season Mode - for daily batch)

```bash
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "http://localhost:3000/api/cron/update-games?mode=season" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

### Local Test (Active Mode - for frequent updates, incomplete games only)

```bash
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "http://localhost:3000/api/cron/update-games" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

### Expected Response

```json
{
  "updated": 10,
  "gamesChecked": 15,
  "activeGames": 3,
  "espnCalls": 2,
  "lastUpdated": "2025-11-11T...",
  "errors": []
}
```

### Checks

- [ ] Status 200
- [ ] `updated` >= 0 (number of games with score changes)
- [ ] `gamesChecked` >= 0 (games examined)
- [ ] `activeGames` >= 0 (games currently in progress)
- [ ] `espnCalls` >= 0 (API calls made)
- [ ] `lastUpdated` is valid ISO timestamp
- [ ] `errors` is an array (may be empty)

---

## Test 2: Update Rankings Cron

Updates team rankings, standings, and records weekly.

### Local Test

```bash
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "http://localhost:3000/api/cron/update-rankings" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

### Expected Response

```json
{
  "updated": 16,
  "teamsChecked": 16,
  "espnCalls": 16,
  "lastUpdated": "2025-11-11T...",
  "errors": []
}
```

### Checks

- [ ] Status 200
- [ ] `updated` = 16 (all SEC teams)
- [ ] `teamsChecked` = 16
- [ ] `espnCalls` >= 16 (one per team minimum)
- [ ] `lastUpdated` is valid ISO timestamp
- [ ] `errors` is an array (may be empty)

---

## Test 3: Authentication - Missing Token

Tests that cron endpoints require authentication.

### Command

```bash
curl -X GET "http://localhost:3000/api/cron/update-games"
```

### Expected Results

- **Status**: 401
- **Response**: `{"error": "Unauthorized"}`

### Checks

- [ ] Status 401
- [ ] Error message is "Unauthorized"

---

## Test 4: Authentication - Invalid Token

Tests that invalid tokens are rejected.

### Command

```bash
curl -X GET "http://localhost:3000/api/cron/update-games" \
  -H "Authorization: Bearer invalid-token-12345"
```

### Expected Results

- **Status**: 401
- **Response**: `{"error": "Unauthorized"}`

### Checks

- [ ] Status 401
- [ ] Error message is "Unauthorized"

---

## Test 5: Field Verification - Database State

Verify that new fields are properly populated after cron runs.

### Check Game Fields

```bash
# Check that displayName and predictedScore are populated
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/dev?appName=SEC-Tiebreaker" \
  --eval "
    print('Checking game fields...');
    var game = db.games.findOne({conferenceGame: true});
    print('displayName:', game.displayName);
    print('Format check:', game.displayName.includes('@') ? 'PASS' : 'FAIL');
    print('predictedScore:', JSON.stringify(game.predictedScore));
    print('Has predictedScore:', game.predictedScore ? 'PASS' : 'FAIL');
  " \
  --quiet
```

### Check Team Fields

```bash
# Check that team averages are populated
mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/dev?appName=SEC-Tiebreaker" \
  --eval "
    print('Checking team fields...');
    var team = db.teams.findOne({abbreviation: 'UGA'});
    print('avgPointsFor:', team.record?.stats?.avgPointsFor);
    print('avgPointsAgainst:', team.record?.stats?.avgPointsAgainst);
    print('Has averages:', (team.record?.stats?.avgPointsFor > 0) ? 'PASS' : 'FAIL');
  " \
  --quiet
```

### Checks

- [ ] `displayName` format is "{away abbrev} @ {home abbrev}" (e.g., "UGA @ ALA")
- [ ] `predictedScore` present for conference games
- [ ] `predictedScore.home` and `predictedScore.away` are positive integers
- [ ] Completed games: `predictedScore` matches real scores
- [ ] Incomplete games: `predictedScore` differs from 0-0 (uses priority order: ESPN odds → team averages + spread → ranking-based → home field advantage)
- [ ] Team `avgPointsFor` > 0 after rankings cron
- [ ] Team `avgPointsAgainst` > 0 after rankings cron

---

## Test 6: Update Live Games - No Active Games

Tests behavior when no games are currently in progress.

### Setup

Run during offseason or midweek when no games are active.

### Command

```bash
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "http://localhost:3000/api/cron/update-games" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

### Expected Results

- Status 200
- `activeGames: 0`
- `updated: 0` or minimal updates
- `espnCalls: 0` or 1 (may check current week)

### Checks

- [ ] Status 200
- [ ] Response structure valid even with no updates
- [ ] No errors thrown

---

## Test 6: Update Live Games - During Game Time

Tests behavior when games are in progress.

### Setup

Run on Saturday during SEC game time (typically 12-8 PM ET).

### Command

```bash
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "http://localhost:3000/api/cron/update-games" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

### Expected Results

- Status 200
- `activeGames > 0`
- `updated > 0` (scores changed)
- `gamesChecked >= activeGames`

### Checks

- [ ] Status 200
- [ ] Active games detected
- [ ] Scores updated in database
- [ ] `espnCalls` reflects API usage

---

## Test 7: Error Handling - ESPN API Failure

Tests graceful handling when ESPN API is unavailable.

### Setup

This is difficult to test locally. Monitor production logs when ESPN API has issues.

### Expected Behavior

- Cron returns 200 (not 500)
- `errors` array contains error messages
- Partial updates still saved (if some teams succeeded)

### Checks

- [ ] Cron doesn't crash
- [ ] Errors logged to database (`errors` collection)
- [ ] Error array in response populated

---

## Test 8: Database Verification After Cron

Verifies that cron jobs actually update the database.

### Update Live Games Verification

```bash
# Before cron
curl "http://localhost:3000/api/games?season=2025&week=11&state=in" | jq '.events[] | {espnId, home: .home.score, away: .away.score}'

# Run cron
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "http://localhost:3000/api/cron/update-games?mode=season" \
  -H "Authorization: Bearer ${CRON_SECRET}"

# After cron
curl "http://localhost:3000/api/games?season=2025&week=11&state=in" | jq '.events[] | {espnId, home: .home.score, away: .away.score}'
```

### Checks

- [ ] Scores changed if games were in progress
- [ ] `lastUpdated` timestamp updated
- [ ] Game `state` updated if game completed

### Update Rankings Verification

```bash
# Before cron
curl "http://localhost:3000/api/games?season=2025&conferenceId=8" | jq '.teams[] | {abbrev, displayName}'

# Run cron
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "http://localhost:3000/api/cron/update-rankings" \
  -H "Authorization: Bearer ${CRON_SECRET}"

# After cron (check Team collection via separate endpoint or DB query)
```

### Checks

- [ ] Team records updated
- [ ] Rankings updated
- [ ] `lastUpdated` timestamp updated

---

## Test 9: Vercel Cron Configuration

Tests that Vercel cron schedules are properly configured.

### Vercel Dashboard Check

1. Go to Vercel project → Settings → Cron Jobs
2. Verify schedules match `vercel.json`

### Current Hobby Plan Schedule

```json
{
  "crons": [
    {
      "path": "/api/cron/update-all",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Checks

- [ ] `update-all`: Daily at 2:00 AM UTC (10:00 PM ET previous day)
- [ ] Only 1 cron (Hobby plan allows 2, but we batch everything into one)
- [ ] Cron shows as "Active" in Vercel dashboard
- [ ] Batch endpoint calls: `pull-teams`, `update-games?mode=season`, `update-rankings`, `update-spreads`

---

## Test 10: Vercel Cron Execution Logs

Tests that crons run successfully in production.

### Steps

1. Wait for next scheduled cron execution
2. Check Vercel deployment logs
3. Filter by cron endpoint path

### Expected Log Entries

- Cron triggered at scheduled time
- Request includes `x-vercel-cron: true` header
- Response 200
- Execution time < 10 seconds (Hobby plan limit)

### Checks

- [ ] Cron executes at scheduled time
- [ ] No 401 errors (auth working)
- [ ] No 500 errors (no crashes)
- [ ] Response time within limits

---

## Test 11: Pro Plan Cron Configuration (Future)

Configuration for when upgrading to Vercel Pro.

### Pro Plan Schedule (from `vercel.pro.json`)

```json
{
  "crons": [
    { "path": "/api/cron/update-games", "schedule": "*/5 21-23,0-6 * * 4-5" },
    { "path": "/api/cron/update-games", "schedule": "*/5 16-23,0-6 * * 6" },
    { "path": "/api/cron/update-spreads", "schedule": "0 13-5 * * *" },
    { "path": "/api/cron/update-team-averages", "schedule": "0 6 * * 0" },
    { "path": "/api/cron/update-rankings", "schedule": "0 3 * * 0" },
    { "path": "/api/cron/update-rankings", "schedule": "0 3 * * 3" }
  ]
}
```

### Migration Steps

1. Upgrade to Vercel Pro
2. Copy `vercel.pro.json` to `vercel.json`
3. Commit and push to deploy
4. Verify all 6 crons appear in Vercel dashboard
5. Test each cron manually
6. Monitor logs for 24-48 hours

### Checks (after Pro upgrade)

- [ ] 6 crons active
- [ ] Live games: Every 5 minutes during game windows
- [ ] Spreads: Hourly updates
- [ ] Team averages: Weekly Sunday 6 AM UTC
- [ ] Rankings: Twice weekly (Sunday & Wednesday)
- [ ] All crons under 60s execution time (Pro limit)

---

## Test 12: Cron Error Logging

Tests that errors are logged to database for monitoring.

### Command

```bash
# Check error logs after cron runs
curl "http://localhost:3000/api/errors?limit=10" | jq .
```

_Note: This requires an `/api/errors` endpoint to be implemented for viewing error logs_

### Expected Results

- Errors from cron jobs logged with:
  - `endpoint`: Cron path
  - `error`: Error message
  - `timestamp`: When it occurred
  - `stackTrace`: For debugging

### Checks

- [ ] Cron errors appear in error log
- [ ] Timestamps accurate
- [ ] Stack traces helpful for debugging
- [ ] Old errors eventually pruned (30-day retention)

---

## Test 13: Rate Limiting and Performance

Tests that crons don't overwhelm ESPN API or database.

### Monitoring

- Watch cron execution time
- Count ESPN API calls
- Monitor MongoDB connection pool

### Expected Performance

**Hobby Plan:**

- `update-games`: < 10s execution, ~2-5 ESPN calls
- `update-rankings`: < 10s execution, 16 ESPN calls (one per team)

**Pro Plan:**

- Same per-execution times
- Higher total daily API calls (more frequent executions)

### Checks

- [ ] No 429 (rate limit) errors from ESPN
- [ ] Execution times within Vercel limits
- [ ] Database connections properly closed
- [ ] No memory leaks over time

---

## Test 14: Cron Idempotency

Tests that running cron multiple times doesn't cause issues.

### Command

```bash
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)

# Run cron 3 times in a row
for i in {1..3}; do
  echo "Run $i:"
  curl -X GET "http://localhost:3000/api/cron/update-games?mode=season" \
    -H "Authorization: Bearer ${CRON_SECRET}" | jq .
  sleep 2
done
```

### Expected Results

- All 3 runs return 200
- Data remains consistent
- No duplicate entries created
- Subsequent runs may show `updated: 0` (no changes)

### Checks

- [ ] Multiple runs don't cause errors
- [ ] Data integrity maintained
- [ ] No race conditions or conflicts

---

## Troubleshooting

### 401 Unauthorized in Production

**Cause**: CRON_SECRET not set in Vercel environment variables

**Fix**:

1. Go to Vercel → Settings → Environment Variables
2. Add `CRON_SECRET` with same value as `.env.local`
3. Redeploy

### Cron Not Executing on Schedule

**Cause**: Vercel plan limits or schedule syntax error

**Fix**:

1. Verify Hobby plan: max 2 crons, min 1 day frequency
2. Check `vercel.json` syntax (no comments allowed)
3. Verify crons show as "Active" in dashboard

### High ESPN API Call Count

**Cause**: Inefficient cron logic or too frequent executions

**Fix**:

1. Review cron code for unnecessary API calls
2. Implement caching where appropriate
3. Adjust Pro plan schedule if needed

### Database Connection Errors

**Cause**: Connection pool exhaustion

**Fix**:

1. Ensure `dbConnect()` is called once per request
2. Connections auto-close after serverless function ends
3. Check MongoDB Atlas connection limits

---

## Test 15: Batch Update Endpoint (Hobby Tier)

Tests the single batch endpoint that calls all cron jobs.

### Local Test

```bash
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "http://localhost:3000/api/cron/update-all" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

### Expected Response

```json
{
  "success": true,
  "jobsRun": 3,
  "jobsSucceeded": 3,
  "totalDuration": 15000,
  "results": [
    {
      "job": "update-games",
      "success": true,
      "status": 200,
      "duration": 200
    },
    {
      "job": "update-rankings",
      "success": true,
      "status": 200,
      "duration": 12000
    },
    {
      "job": "update-test-data",
      "success": true,
      "status": 200,
      "duration": 2800
    }
  ],
  "lastUpdated": "2025-11-13T...",
  "note": "update-test-data automatically triggers reshape tests in background"
}
```

### Checks

- [ ] Status 200 or 207 (Multi-Status if some jobs fail)
- [ ] `jobsRun` = 3 (update-games, update-rankings, update-test-data)
- [ ] `jobsSucceeded` = 3 (all jobs successful)
- [ ] Each job in `results` has `success`, `status`, `duration`
- [ ] `update-test-data` triggers reshape tests automatically (check ErrorLog for test results)

---

## Testing Checklist

### Local Testing

- [ ] Test 1: Update games cron (mode=season and mode=active/default)
- [ ] Test 2: Update rankings cron
- [ ] Test 3: Auth - missing token
- [ ] Test 4: Auth - invalid token
- [ ] Test 5: No active games behavior
- [ ] Test 8: Database updates verified
- [ ] Test 14: Idempotency test
- [ ] Test 15: Batch update endpoint

### Vercel Testing (Hobby Plan)

- [ ] Test 9: Cron configuration in dashboard
- [ ] Test 10: Execution logs show success
- [ ] Manual trigger both crons from dashboard
- [ ] Monitor for 1 week to ensure reliability

### Performance

- [ ] Test 13: Rate limiting and performance
- [ ] Execution times under limits
- [ ] No ESPN 429 errors

### Error Handling

- [ ] Test 7: Graceful ESPN API failure
- [ ] Test 12: Error logging working
- [ ] Errors don't crash crons

### Future (Pro Plan)

- [ ] Test 11: Pro configuration ready
- [ ] Migration plan documented
- [ ] All 6 crons tested manually

---

## Next Steps

1. Complete local cron testing
2. Deploy to staging (develop branch)
3. Test crons in Vercel environment
4. Monitor for 1 week
5. Plan Pro upgrade when needed
6. Implement `/api/update-spreads` and `/api/update-team-averages` for Pro
