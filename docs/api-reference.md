# API Reference

Complete reference for all SEC Tiebreaker API endpoints.

## Table of Contents

- [Data Endpoints](#data-endpoints)
  - [Pull Teams](#post-apipull-teams)
  - [Pull Games](#post-apipull-games)
  - [Simulate Tiebreaker](#post-apisimulate)
- [Cron Jobs](#cron-jobs)
  - [Update Live Games](#get-apicronupdate-live-games)
  - [Update Spreads](#get-apicronupdate-spreads)
  - [Update Rankings](#get-apicronupdate-rankings)
  - [Update Team Averages](#get-apicronupdate-team-averages)

---

## Data Endpoints

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

### GET /api/cron/update-live-games

Updates scores, states, and odds for active (incomplete) games.

**Authentication:** Required (Bearer token)

**Schedule:**
- **Hobby Plan**: Daily at 6 AM ET (`0 6 * * *`)
- **Pro Plan**: Every 5 minutes Thu-Fri 9PM-2AM ET, Sat 4PM-2AM ET

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
- Queries incomplete conference games for current season
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
- **Hobby Plan**: Not used (combined with `update-live-games`)

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

**Response Fields:** Same as `update-live-games`

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
- More frequent than `update-live-games` to catch line movements
- Only updates odds, not scores/states
- Pro-only feature for more granular updates

---

### GET /api/cron/update-rankings

Updates team rankings, standings, and season statistics.

**Authentication:** Required (Bearer token)

**Schedule:**
- **Hobby Plan**: Wednesday 4 AM ET (`0 4 * * 3`)
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
- **Pro Plan**: Sunday 6 AM ET (`0 6 * * 0`)
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
db.errors.find({endpoint: "/api/cron/update-rankings"}).sort({timestamp: -1})
```

---

## Common Response Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing required fields, invalid input |
| 401 | Unauthorized | Missing or invalid `CRON_SECRET` |
| 500 | Server Error | Database error, ESPN API timeout |

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

| Variable | Required | Description |
|----------|----------|-------------|
| `CRON_SECRET` | Yes | Bearer token for cron authentication |
| `MONGODB_URI` | Yes | MongoDB connection string |

---

## Notes

- All timestamps in ISO 8601 format (UTC)
- Season is hardcoded to 2025 in some cron jobs
- Conference ID 8 = SEC
- Team IDs are ESPN team IDs (e.g., "333" = Alabama)
- Game IDs are ESPN event IDs (e.g., "401752772")

