# API Reference

Complete reference for all SEC Tiebreaker API endpoints.

## Table of Contents

- [Data Endpoints](#data-endpoints)
  - [Get Games](#get-apigames)
  - [Pull Teams](#post-apipull-teams)
  - [Pull Games](#post-apipull-games)
  - [Simulate Tiebreaker](#post-apisimulate)
- [Cron Jobs](#cron-jobs)
  - [Update Games](#get-apicronupdate-games)
  - [Update All (Batch)](#get-apicronupdate-all)
  - [Update Spreads](#get-apicronupdate-spreads)
  - [Update Rankings](#get-apicronupdate-rankings)
  - [Update Team Averages](#get-apicronupdate-team-averages)
  - [Update Test Data](#get-apicronupdate-test-data)
  - [Run Reshape Tests](#get-apicronrun-reshape-tests)

---

## Data Endpoints

### GET /api/games

Queries game data from the database with optional filtering.

**Authentication:** None required

**Query Parameters:**

| Parameter      | Type   | Description                                   |
| -------------- | ------ | --------------------------------------------- |
| `conferenceId` | string | If provided, filters to conference games only |
| `season`       | string | Filter by season year (e.g., "2025")          |
| `week`         | string | Filter by week number (e.g., "1")             |
| `state`        | string | Filter by game state: "pre", "in", or "post"  |
| `from`         | string | Filter games from this date (ISO format)      |
| `to`           | string | Filter games to this date (ISO format)        |
| `sport`        | string | Filter by sport (e.g., "football")            |
| `league`       | string | Filter by league (e.g., "college-football")   |

**Response:**

```json
{
  "events": [
    {
      "_id": "...",
      "espnId": "401752772",
      "displayName": "UGA @ ALA",
      "date": "2025-11-15T19:30:00Z",
      "week": 12,
      "season": 2025,
      "sport": "football",
      "league": "college-football",
      "state": "pre",
      "completed": false,
      "conferenceGame": true,
      "neutralSite": false,
      "home": {
        "teamEspnId": "333",
        "abbrev": "ALA",
        "score": null,
        "rank": 8
      },
      "away": {
        "teamEspnId": "61",
        "abbrev": "UGA",
        "score": null,
        "rank": 1
      },
      "odds": {
        "favoriteTeamEspnId": "61",
        "spread": -3.5,
        "overUnder": 52.5
      },
      "predictedScore": {
        "home": 24,
        "away": 28
      },
      "lastUpdated": "2025-11-12T01:40:07.408Z"
    }
  ],
  "teams": [
    {
      "id": "333",
      "abbrev": "ALA",
      "displayName": "Alabama Crimson Tide",
      "logo": "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png",
      "color": "9e1632",
      "alternateColor": "ffffff"
    }
  ],
  "lastUpdated": "2025-11-12T01:40:07.408Z"
}
```

**Response Fields:**

| Field         | Type           | Description                                 |
| ------------- | -------------- | ------------------------------------------- |
| `events`      | GameLean[]     | Array of game objects matching query        |
| `teams`       | TeamMetadata[] | Array of team metadata for teams in results |
| `lastUpdated` | string         | ISO timestamp of response                   |

**Caching:**

- Games with live state (`state: "in"`): 10 seconds cache
- All other games: 60 seconds cache

**Notes:**

- Results sorted by date, then week
- If `conferenceId` is provided, only returns conference games
- Team metadata included for all teams referenced in game results
- Uses lean queries for performance (no Mongoose hydration)

---

### POST /api/pull-teams

Seeds or updates team data from ESPN API.

**Authentication:** None required

**Request Body:**

```json
{
  "sport": "football",
  "league": "college-football",
  "conferenceId": 8
}
```

**Alternative Request (Specific Teams):**

```json
{
  "sport": "football",
  "league": "college-football",
  "teams": ["UGA", "ALA", "TEX"]
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sport` | string | Yes | Sport type (e.g., "football") |
| `league` | string | Yes | League identifier (e.g., "college-football") |
| `conferenceId` | number | Conditional | Conference ID (8 for SEC). Required if `teams` not provided |
| `teams` | string[] | Conditional | Array of team abbreviations. Required if `conferenceId` not provided |

**Response:**

```json
{
  "upserted": 16,
  "lastUpdated": "2025-11-12T01:39:26.469Z"
}
```

**Error Responses:**

- `400`: Missing required fields
- `500`: ESPN API error or database error

**Notes:**

- Uses ESPN Site API to fetch team metadata
- Upserts teams (creates new or updates existing)
- Stores: name, logo, colors, conference affiliation
- Does NOT fetch team stats (use `/api/cron/update-rankings` for that)
- **Not required before pulling games** - games can be seeded independently

---

### POST /api/pull-games

Pulls game data from ESPN for a specific season/conference.

**Authentication:** None required

**Request Body:**

```json
{
  "sport": "football",
  "league": "college-football",
  "season": 2025,
  "conferenceId": 8
}
```

**Request Body (Specific Week):**

```json
{
  "sport": "football",
  "league": "college-football",
  "season": 2025,
  "conferenceId": 8,
  "week": 1
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sport` | string | Yes | Sport type |
| `league` | string | Yes | League identifier |
| `season` | number | Yes | Season year (e.g., 2025) |
| `conferenceId` | number | Yes | Conference ID (8 for SEC) |
| `week` | number | No | Specific week number. If omitted, pulls entire regular season |

**Response:**

```json
{
  "upserted": 128,
  "weeksPulled": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  "lastUpdated": "2025-11-12T01:40:07.408Z"
}
```

**Response (With Errors):**

```json
{
  "upserted": 120,
  "weeksPulled": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  "lastUpdated": "2025-11-12T01:40:07.408Z",
  "errors": ["Failed to fetch week 14: Network timeout"]
}
```

**Error Responses:**

- `400`: Missing required fields
- `500`: ESPN API error or database error

**Game Data Stored:**

- Basic info: `espnId`, `displayName` ("{away abbrev} @ {home abbrev}", e.g., "UGA @ ALA"), `date`, `week`, `season`
- State: `state` (pre/in/post), `completed`, `conferenceGame`, `neutralSite`
- Teams: `home`/`away` with `teamEspnId`, `abbrev`, `displayName`, `logo`, `color`, `score`, `rank`
- Odds: `spread`, `favoriteTeamEspnId`, `overUnder`
- **`predictedScore`**: Always calculated for all games
  - Completed games: Uses real scores
  - Incomplete games with spread: Uses spread + team averages (or defaults)
  - Incomplete games without spread: Uses team averages + home field advantage (or defaults)
  - Default average: 28 points per team if no team data available

**Notes:**

- Dynamically determines season weeks using ESPN calendar API
- Excludes SEC Championship game
- **Can run independently** - does not require teams to be seeded first
- **Optimal order**: Run `/api/pull-teams` → `/api/cron/update-rankings` → `/api/pull-games` for most accurate `predictedScore` calculations
- Upserts games (updates if exists, creates if new)

---

### POST /api/simulate

Simulates SEC tiebreaker standings with optional user-provided game outcomes.

**Authentication:** None required

**Request Body:**

```json
{
  "season": 2025,
  "conferenceId": "8",
  "overrides": {}
}
```

**Request Body (With Overrides):**

```json
{
  "season": 2025,
  "conferenceId": "8",
  "overrides": {
    "401752772": {
      "homeScore": 45,
      "awayScore": 10
    },
    "401752686": {
      "homeScore": 24,
      "awayScore": 21
    }
  }
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `season` | number | Yes | Season year |
| `conferenceId` | string | Yes | Conference ID as string ("8" for SEC) |
| `overrides` | object | No | Game ID → score overrides. Defaults to `{}` if omitted |

**Override Format:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `homeScore` | number | Yes | Home team score (must be non-negative integer) |
| `awayScore` | number | Yes | Away team score (must be non-negative integer) |

**Response:**

```json
{
  "standings": [
    {
      "rank": 1,
      "teamId": "333",
      "abbrev": "ALA",
      "displayName": "Alabama Crimson Tide",
      "logo": "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png",
      "color": "9e1632",
      "record": {
        "wins": 6,
        "losses": 2
      },
      "confRecord": {
        "wins": 6,
        "losses": 2
      },
      "explainPosition": "Conference record: 6-2"
    }
  ],
  "championship": ["333", "145"],
  "tieLogs": [
    {
      "teams": ["333", "145", "251"],
      "steps": [
        {
          "rule": "A",
          "detail": "Head-to-head record (min 2 games)",
          "survivors": ["333", "145"]
        }
      ]
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `standings` | StandingEntry[] | Full conference standings (sorted by rank) |
| `championship` | [string, string] | Top 2 team IDs (SEC Championship matchup) |
| `tieLogs` | TieLog[] | Detailed tiebreaker explanations |

**StandingEntry:**
| Field | Type | Description |
|-------|------|-------------|
| `rank` | number | Standing position (1-16) |
| `teamId` | string | ESPN team ID |
| `abbrev` | string | Team abbreviation (e.g., "ALA") |
| `displayName` | string | Full team name |
| `logo` | string | Team logo URL |
| `color` | string | Team primary color (hex without #) |
| `record` | {wins, losses} | Overall season record |
| `confRecord` | {wins, losses} | Conference record |
| `explainPosition` | string | Human-readable explanation of standing |

**TieLog:**
| Field | Type | Description |
|-------|------|-------------|
| `teams` | string[] | Team IDs involved in tie |
| `steps` | TieStep[] | Tiebreaker rules applied |

**TieStep:**
| Field | Type | Description |
|-------|------|-------------|
| `rule` | string | Rule identifier (A-E) |
| `detail` | string | Rule description |
| `survivors` | string[] | Teams remaining after rule application |

**Error Responses:**

- `400`: Missing required fields (`season`, `conferenceId`)
- `400`: Invalid score (negative or non-integer)
- `500`: Database error or tiebreaker calculation error

**Tiebreaker Rules Applied:**

- **Rule A**: Head-to-head record (minimum 2 games)
- **Rule B**: Record vs common conference opponents (minimum 4)
- **Rule C**: Record within division
- **Rule D**: Conference win percentage
- **Rule E**: Scoring margin (offensive cap: 42 points, defensive cap: 48 points)

**Notes:**

- Uses `predictedScore` for games without user overrides
- Validates scores (non-negative integers)
- Handles ties recursively (cascading tiebreakers)
- Returns all 16 teams in standings array (full conference standings)

---

## Cron Jobs

All cron jobs require Bearer token authentication.

**Authentication Header:**

```
Authorization: Bearer {CRON_SECRET}
```

**401 Response (Unauthorized):**

```json
{
  "error": "Unauthorized"
}
```

---

### GET /api/cron/update-games

Updates scores, states, and odds for games. Can update all games or just incomplete ones.

**Authentication:** Required (Bearer token)

**Query Parameters:**

- `allGames` (boolean, optional): If `true`, updates all games in current week (completed, in-progress, pre-game). If `false` or missing, only updates incomplete games.

**Schedule:**

- **Hobby Plan**: Called via `/api/cron/update-all` daily at 7:45 PM ET (`45 23 * * *` UTC) with `allGames=true`
- **Pro Plan**: Every 5 minutes Thu-Fri 9PM-2AM ET, Sat 4PM-2AM ET (without `allGames`, only incomplete games)

**Response:**

```json
{
  "updated": 6,
  "gamesChecked": 6,
  "activeGames": 16,
  "espnCalls": 1,
  "lastUpdated": "2025-11-12T01:40:28.882Z"
}
```

**Response (With Errors):**

```json
{
  "updated": 0,
  "gamesChecked": 0,
  "activeGames": 16,
  "espnCalls": 0,
  "lastUpdated": "2025-11-12T01:40:28.882Z",
  "errors": ["ESPN API timeout"]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `updated` | number | Number of games updated in database |
| `gamesChecked` | number | Number of games checked from ESPN |
| `activeGames` | number | Total incomplete games in database |
| `espnCalls` | number | Number of ESPN API calls made |
| `lastUpdated` | string | ISO timestamp of cron execution |
| `errors` | string[] | Optional array of error messages |

**Updates:**

- `state` (pre/in/post)
- `completed` (boolean)
- `home.score`, `away.score`
- `home.rank`, `away.rank`
- `odds.spread`, `odds.favoriteTeamEspnId`, `odds.overUnder`
- `predictedScore` (recalculated based on current data)

**Logic:**

- If `allGames=true`: Queries all conference games in current week
- If `allGames=false` or missing: Queries only incomplete conference games for current season
- Fetches current week's scoreboard from ESPN
- Compares ESPN data with database
- Updates only if changes detected
- Recalculates `predictedScore` for all games (uses real scores if game started scoring)

**Error Handling:**

- Logs errors to `errors` collection
- Returns gracefully if ESPN API fails
- Skips non-conference games (missing team data)

---

### GET /api/cron/update-spreads

**Pro Mode Only**: Updates betting odds and recalculates predicted scores for upcoming games.

**Authentication:** Required (Bearer token)

**Schedule:**

- **Pro Plan**: Every hour 1PM-5AM ET (`0 13-5 * * *` - runs at minute 0 of hours 13-23,0-5 UTC)
- **Hobby Plan**: Not used (combined with `update-games` in batch endpoint)

**Response:**

```json
{
  "updated": 0,
  "gamesChecked": 6,
  "activeGames": 16,
  "espnCalls": 1,
  "lastUpdated": "2025-11-12T01:40:29.174Z"
}
```

**Response Fields:** Same as `update-games`

**Updates:**

- `odds.spread`
- `odds.favoriteTeamEspnId`
- `odds.overUnder`
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

### GET /api/cron/update-all

**Hobby Plan Only**: Batch endpoint that orchestrates multiple cron jobs in a single call.

**Authentication:** Required (Bearer token)

**Schedule:**

- **Hobby Plan**: Daily at 7:45 PM ET (`45 23 * * *` UTC)
- **Pro Plan**: Not used (individual cron jobs run separately)

**Response:**

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
  "lastUpdated": "2025-11-13T04:00:00.000Z",
  "note": "update-test-data automatically triggers reshape tests in background"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether all jobs succeeded |
| `jobsRun` | number | Total number of jobs executed |
| `jobsSucceeded` | number | Number of jobs that succeeded |
| `totalDuration` | number | Total execution time in milliseconds |
| `results` | array | Array of job results with `job`, `success`, `status`, `duration` |
| `lastUpdated` | string | ISO timestamp of batch execution |
| `note` | string | Optional informational message |

**Jobs Executed:**

1. **update-games** (with `allGames=true`): Updates all games for current week
2. **update-rankings**: Updates team rankings and standings
3. **update-test-data**: Updates test data snapshots and triggers reshape tests

**Error Handling:**

- If a job fails, it's included in `results` with `success: false`
- Returns 200 if all jobs succeed, 207 (Multi-Status) if some jobs fail (check `jobsSucceeded` vs `jobsRun`)
- Individual job errors are logged to the `errors` collection

---

### GET /api/cron/update-rankings

Updates team rankings, standings, and season statistics.

**Authentication:** Required (Bearer token)

**Schedule:**

- **Hobby Plan**: Called via `/api/cron/update-all` daily at 7:45 PM ET (`45 23 * * *` UTC)
- **Pro Plan**: Sunday 3 AM ET + Wednesday 3 AM ET (`0 3 * * 0` + `0 3 * * 3`)

**Response:**

```json
{
  "updated": 16,
  "teamsChecked": 16,
  "espnCalls": 16,
  "lastUpdated": "2025-11-12T01:39:46.147Z"
}
```

**Response (With Errors):**

```json
{
  "updated": 14,
  "teamsChecked": 16,
  "espnCalls": 32,
  "lastUpdated": "2025-11-12T01:39:46.147Z",
  "errors": ["MSST", "VAN"]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `updated` | number | Number of teams successfully updated |
| `teamsChecked` | number | Total teams attempted (should be 16) |
| `espnCalls` | number | Number of ESPN API calls made |
| `lastUpdated` | string | ISO timestamp |
| `errors` | string[] | Optional array of failed team abbreviations |

**Updates:**

- `nationalRanking` (CFP/AP ranking)
- `conferenceStanding` (e.g., "3rd in SEC")
- `record.overall` (e.g., "8-1")
- `record.conference` (e.g., "6-1")
- `record.home`, `record.away`
- `record.stats.wins`, `losses`, `winPercent`
- `record.stats.pointsFor`, `pointsAgainst`, `pointDifferential`
- **`record.stats.avgPointsFor`**, **`avgPointsAgainst`** (used for `predictedScore`)

**Logic:**

- Loops through all 16 SEC teams
- Calls ESPN Site API (team metadata + rankings)
- Calls ESPN Core API (detailed stats + season averages)
- Fallback: Uses Site API stats if Core API returns null
- Retries failed teams once after 5-second delay
- 500ms rate limit between teams (2 calls per team = ~16 seconds total)

**Notes:**

- Critical for `predictedScore` calculation (provides team averages)
- Should run weekly (Tuesday night after rankings release)
- Core API may return null for future seasons (falls back to Site API)

---

### GET /api/cron/update-team-averages

**Pro Mode Only**: Updates team season statistics more frequently than rankings cron.

**Authentication:** Required (Bearer token)

**Schedule:**

- **Pro Plan**: Sunday 1 AM ET (`0 6 * * 0` UTC)
- **Hobby Plan**: Not used (combined with `update-rankings`)

**Response:**

```json
{
  "updated": 16,
  "teamsChecked": 16,
  "espnCalls": 32,
  "lastUpdated": "2025-11-12T01:34:36.290Z"
}
```

**Response Fields:** Same as `update-rankings`

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

### GET /api/cron/update-test-data

Updates test data snapshots from ESPN API for unit testing. Pulls one example of each ESPN API response type.

**Authentication:** Required (Bearer token)

**Schedule:**

- **Hobby Plan**: Called via `/api/cron/update-all` daily at 7:45 PM ET (`45 23 * * *` UTC)
- **Pro Plan**: Not scheduled separately (can be called manually or via update-all)

**Response:**

```json
{
  "updated": 4,
  "total": 4,
  "results": [
    {
      "type": "scoreboard",
      "success": true
    },
    {
      "type": "gameSummary",
      "success": true
    },
    {
      "type": "team",
      "success": true
    },
    {
      "type": "teamRecords",
      "success": true
    }
  ],
  "lastUpdated": "2025-11-13T04:00:00.000Z",
  "testsTriggered": true
}
```

**Response (With Errors):**

```json
{
  "updated": 3,
  "total": 4,
  "results": [
    {
      "type": "scoreboard",
      "success": true
    },
    {
      "type": "gameSummary",
      "success": false,
      "error": "No games in scoreboard"
    },
    {
      "type": "team",
      "success": true
    },
    {
      "type": "teamRecords",
      "success": true
    }
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
- Automatically triggers `/api/cron/run-reshape-tests` on success (non-blocking, fire-and-forget)

**Notes:**

- Used for unit testing reshape functions
- Test data stored in separate test database
- Automatically triggers reshape tests after successful update
- Test failures logged to ErrorLog collection

---

### GET /api/cron/run-reshape-tests

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
    },
    {
      "test": "reshapeTeamData",
      "passed": true,
      "duration": 70
    }
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
  "results": [
    {
      "test": "reshapeScoreboardData",
      "passed": true,
      "duration": 80
    },
    {
      "test": "reshapeTeamData",
      "passed": false,
      "error": "Reshaped team missing required fields",
      "duration": 0
    }
  ],
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

## Error Logging

All endpoints log errors to MongoDB `errors` collection:

```typescript
{
  timestamp: Date,
  endpoint: string,      // e.g., "/api/cron/update-rankings"
  payload: object,       // Request details
  error: string,         // Error message
  stackTrace: string,    // Full stack trace
  createdAt: Date,
  updatedAt: Date
}
```

**Query Errors:**

```javascript
db.errors.find({ endpoint: '/api/cron/update-rankings' }).sort({ timestamp: -1 });
```

---

## Common Response Codes

| Code | Meaning      | Common Causes                          |
| ---- | ------------ | -------------------------------------- |
| 200  | Success      | Request completed successfully         |
| 400  | Bad Request  | Missing required fields, invalid input |
| 401  | Unauthorized | Missing or invalid `CRON_SECRET`       |
| 500  | Server Error | Database error, ESPN API timeout       |

---

## Rate Limiting

**ESPN API:**

- Site API: ~500ms between requests
- Core API: ~500ms between requests
- Scoreboard API: No rate limit (batched by week)

**Our APIs:**

- Data endpoints: No rate limit
- Cron jobs: Scheduled (see individual endpoints)

---

## Environment Variables

| Variable      | Required | Description                          |
| ------------- | -------- | ------------------------------------ |
| `CRON_SECRET` | Yes      | Bearer token for cron authentication |
| `MONGODB_URI` | Yes      | MongoDB connection string            |

---

## Notes

- All timestamps in ISO 8601 format (UTC)
- Season is hardcoded to 2025 in some cron jobs
- Conference ID 8 = SEC
- Team IDs are ESPN team IDs (e.g., "333" = Alabama)
- Game IDs are ESPN event IDs (e.g., "401752772")
