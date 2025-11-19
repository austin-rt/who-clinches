# API Reference: Cron Jobs

Complete reference for scheduled update endpoints.

**Related:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)

---

## Authentication

All cron jobs require Bearer token authentication:

```
Authorization: Bearer {CRON_SECRET}
```

**401 Response:**
```json
{
  "error": "Unauthorized"
}
```

---

## GET /api/cron/update-games

Updates scores, states, and odds for games.

**Authentication:** Required (Bearer token)

**Query Parameters:**

| Parameter | Type   | Description                                   |
| --------- | ------ | --------------------------------------------- |
| `mode`    | string | `active` (default), `week`, or `season`       |

**Modes:**
- `active`: Only updates incomplete games for current season
- `week`: Pulls/updates current week only
- `season`: Pulls/updates entire season (all weeks, creates new games)

**Schedule:**
- **Hobby Plan**: Called via `/api/cron/update-all` daily at 10:00 PM ET (`0 2 * * *` UTC) with `mode=season`
- **Pro Plan**: Every 5 minutes Thu-Fri 9PM-2AM ET, Sat 4PM-2AM ET (default `active` mode)

**Response:**

```json
{
  "updated": 6,
  "gamesChecked": 6,
  "activeGames": 16,
  "espnCalls": 1,
  "lastUpdated": "2025-11-12T01:40:28.882Z",
  "errors": []  // Optional
}
```

**Response Fields:**

| Field         | Type    | Description                           |
| ------------- | ------- | ------------------------------------- |
| `updated`     | number  | Number of games updated in database   |
| `gamesChecked`| number  | Number of games checked from ESPN     |
| `activeGames` | number  | Total incomplete games in database    |
| `espnCalls`   | number  | Number of ESPN API calls made         |
| `lastUpdated` | string  | ISO timestamp of cron execution       |
| `errors`      | string[] | Optional array of error messages     |

**Updates:**
- `state` (pre/in/post), `completed`, `home.score`, `away.score`
- `home.rank`, `away.rank`
- `odds.spread`, `odds.favoriteTeamEspnId`, `odds.overUnder`
- `predictedScore` (recalculated)

**Logic:**
- If `mode=season`: Pulls entire season (all weeks) from ESPN and upserts all games
- If `mode=week`: Pulls current week only from ESPN and upserts games
- If `mode=active` or missing: Queries only incomplete conference games, fetches current week's scoreboard
- Compares ESPN data with database, updates only if changes detected
- Recalculates `predictedScore` for all games

---

## GET /api/cron/update-spreads

**Pro Mode Only**: Updates betting odds and recalculates predicted scores for upcoming games.

**Authentication:** Required (Bearer token)

**Schedule:**
- **Pro Plan**: Every hour 1PM-5AM ET (`0 13-5 * * *` UTC)
- **Hobby Plan**: Not used (combined with `update-games` in batch endpoint)

**Response:** Same format as `update-games`

**Updates:**
- `odds.spread`, `odds.favoriteTeamEspnId`, `odds.overUnder`
- `predictedScore` (recalculated)

**Logic:**
- Queries upcoming SEC games (not yet started)
- Fetches current odds from ESPN
- Updates if odds changed
- Recalculates `predictedScore` using new spread

**Notes:**
- More frequent than `update-games` to catch line movements
- Only updates odds, not scores/states
- Pro-only feature for more granular updates

---

## GET /api/cron/update-all

**Hobby Plan Only**: Batch endpoint that orchestrates multiple cron jobs in a single call.

**Authentication:** Required (Bearer token)

**Schedule:**
- **Hobby Plan**: Daily at 10:00 PM ET (`0 2 * * *` UTC)
- **Pro Plan**: Not used (individual cron jobs run separately)

**Response:**

```json
{
  "success": true,
  "jobsRun": 4,
  "jobsSucceeded": 4,
  "totalDuration": 15000,
  "results": [
    {
      "job": "pull-teams",
      "success": true,
      "status": 200,
      "duration": 200
    }
    // ... more jobs
  ],
  "lastUpdated": "2025-11-13T04:00:00.000Z"
}
```

**Response Fields:**

| Field           | Type    | Description                                    |
| --------------- | ------- | ---------------------------------------------- |
| `success`       | boolean | Whether all jobs succeeded                     |
| `jobsRun`       | number  | Total number of jobs executed                  |
| `jobsSucceeded`  | number  | Number of jobs that succeeded                  |
| `totalDuration` | number  | Total execution time in milliseconds           |
| `results`       | array   | Array of job results with `job`, `success`, `status`, `duration` |
| `lastUpdated`   | string  | ISO timestamp of batch execution               |

**Jobs Executed:**
1. **pull-teams**: Pulls all SEC teams from ESPN API
2. **update-games** (with `mode=season`): Pulls/updates entire season
3. **update-rankings**: Updates team rankings and standings
4. **update-spreads**: Updates game spreads and betting odds

**Error Handling:**
- If a job fails, it's included in `results` with `success: false`
- Returns 200 if all jobs succeed, 207 (Multi-Status) if some jobs fail
- Individual job errors are logged to the `errors` collection

---

## GET /api/cron/update-rankings

Updates team rankings, standings, and season statistics.

**Authentication:** Required (Bearer token)

**Schedule:**
- **Hobby Plan**: Called via `/api/cron/update-all` daily at 10:00 PM ET (`0 2 * * *` UTC)
- **Pro Plan**: Sunday 3 AM ET + Wednesday 3 AM ET (`0 3 * * 0` + `0 3 * * 3`)

**Response:**

```json
{
  "updated": 16,
  "teamsChecked": 16,
  "espnCalls": 32,
  "lastUpdated": "2025-11-12T01:39:46.147Z",
  "errors": []  // Optional: array of failed team abbreviations
}
```

**Response Fields:**

| Field         | Type    | Description                           |
| ------------- | ------- | ------------------------------------- |
| `updated`     | number  | Number of teams successfully updated  |
| `teamsChecked`| number  | Total teams attempted (should be 16)  |
| `espnCalls`   | number  | Number of ESPN API calls made         |
| `lastUpdated` | string  | ISO timestamp                         |
| `errors`      | string[] | Optional array of failed team abbreviations |

**Updates:**
- `nationalRanking` (CFP/AP ranking)
- `conferenceStanding` (e.g., "3rd in SEC")
- `record.overall`, `record.conference`, `record.home`, `record.away`
- `record.stats.wins`, `losses`, `winPercent`
- `record.stats.pointsFor`, `pointsAgainst`, `pointDifferential`
- **`record.stats.avgPointsFor`**, **`avgPointsAgainst`** (used for `predictedScore`)

**Logic:**
- Loops through all 16 SEC teams
- Calls ESPN Site API (team metadata + rankings)
- Calls ESPN Core API (detailed stats + season averages)
- Fallback: Uses Site API stats if Core API returns null
- Retries failed teams once after 5-second delay
- 500ms rate limit between teams

**Notes:**
- Critical for `predictedScore` calculation (provides team averages)
- Should run weekly (Tuesday night after rankings release)
- Core API may return null for future seasons (falls back to Site API)

---

## GET /api/cron/update-team-averages

**Pro Mode Only**: Updates team season statistics more frequently than rankings cron.

**Authentication:** Required (Bearer token)

**Schedule:**
- **Pro Plan**: Sunday 1 AM ET (`0 6 * * 0` UTC)
- **Hobby Plan**: Not used (combined with `update-rankings`)

**Response:** Same format as `update-rankings`

**Updates:** Same fields as `update-rankings` but focused on stats

**Logic:**
- Same as `update-rankings` but separate endpoint for Pro mode
- Allows more frequent stat updates without full rankings sync
- Ensures `avgPointsFor`/`avgPointsAgainst` stay current

**Notes:**
- Pro-only optimization
- Runs Sunday morning after week's games complete
- Rankings cron still runs Wed for mid-week updates

---

## GET /api/cron/update-test-data

Updates test data snapshots from ESPN API for unit testing.

**Authentication:** Required (Bearer token)

**Schedule:**
- **Hobby Plan**: Called via `/api/cron/update-all` daily at 10:00 PM ET (`0 2 * * *` UTC)
- **Pro Plan**: Not scheduled separately (can be called manually)

**Response:**

```json
{
  "updated": 4,
  "total": 4,
  "results": [
    {
      "type": "scoreboard",
      "success": true
    }
    // ... more types
  ],
  "lastUpdated": "2025-11-13T04:00:00.000Z",
  "testsTriggered": true
}
```

**Response Fields:**

| Field            | Type    | Description                                                          |
| ---------------- | ------- | -------------------------------------------------------------------- |
| `updated`        | number  | Number of test data types successfully updated                       |
| `total`          | number  | Total number of test data types attempted (4)                        |
| `results`        | array   | Array of update results with `type`, `success`, optional `error`     |
| `lastUpdated`    | string  | ISO timestamp of update execution                                    |
| `testsTriggered` | boolean | Whether reshape tests were triggered (true if any updates succeeded) |

**Test Data Types Updated:**
1. **scoreboard**: One week's scoreboard data (week 1, season 2025)
2. **gameSummary**: Game summary for first game from scoreboard
3. **team**: Team data for first SEC team
4. **teamRecords**: Team records for same team as above

**Logic:**
- Connects to test database (separate from production)
- Pulls example data from ESPN API for each type
- Stores snapshots in test database collections
- Automatically triggers `/api/cron/run-reshape-tests` on success (non-blocking)

**Notes:**
- Used for unit testing reshape functions
- Test data stored in separate test database
- Automatically triggers reshape tests after successful update
- Test failures logged to ErrorLog collection

---

## GET /api/cron/run-reshape-tests

Runs reshape function tests against test data snapshots. Called automatically by `update-test-data` after successful data updates.

**Authentication:** Required (Bearer token)

**Schedule:**
- Not scheduled directly
- Triggered automatically by `/api/cron/update-test-data` after successful updates
- Can be called manually for testing

**Response (Success):**

```json
{
  "success": true,
  "passed": 2,
  "failed": 0,
  "total": 2,
  "duration": 150,
  "results": [
    {
      "test": "reshapeScoreboardData",
      "passed": true,
      "duration": 80
    }
    // ... more tests
  ],
  "message": "All reshape tests passed"
}
```

**Response (Failure):**

```json
{
  "success": false,
  "passed": 1,
  "failed": 1,
  "total": 2,
  "duration": 150,
  "results": [/* ... */],
  "message": "RESHAPE_TEST_FAILURE | FAILED_TESTS:1 | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Review failed tests and update reshape functions if API format changed"
}
```

**Response (Test Data Missing):**

```json
{
  "success": false,
  "error": "TEST_DATA_MISSING",
  "missing": ["scoreboard", "team"],
  "message": "Test data not available - reshape tests cannot run"
}
```

**Response Fields:**

| Field      | Type    | Description                                                               |
| ---------- | ------- | ------------------------------------------------------------------------- |
| `success`  | boolean | Whether all tests passed                                                  |
| `passed`   | number  | Number of tests that passed                                               |
| `failed`   | number  | Number of tests that failed                                               |
| `total`    | number  | Total number of tests run (2)                                             |
| `duration` | number  | Total execution time in milliseconds                                      |
| `results`  | array   | Array of test results with `test`, `passed`, optional `error`, `duration` |
| `message`  | string  | Human-readable status message                                             |

**Tests Performed:**
1. **reshapeScoreboardData**: Tests reshaping ESPN scoreboard data to game format
2. **reshapeTeamData**: Tests reshaping ESPN team data to team format

**Logic:**
- Connects to test database
- Verifies test data snapshots are available
- Runs reshape functions against test data
- Validates reshaped output has required fields
- Logs failures to ErrorLog collection
- Returns 200 if all pass, 500 if any fail

**Error Handling:**
- If test data missing: Returns 500 with `TEST_DATA_MISSING` error
- If reshape fails: Logs to ErrorLog, returns 500 with failure details
- Test failures don't block deployment (non-blocking design)

**Notes:**
- Internal endpoint (called by update-test-data, not scheduled)
- Failures indicate ESPN API format may have changed
- Results logged to ErrorLog for monitoring
- Used to catch API format changes early

---

**See also:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)

