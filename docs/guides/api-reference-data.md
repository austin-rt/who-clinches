# API Reference: Data Endpoints

Complete reference for data query and ingestion endpoints.

**Related:** [Main API Reference](./api-reference.md) | [Cron Jobs](./api-reference-cron.md)

---

## GET /api/games

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
  "events": [/* GameLean[] */],
  "teams": [/* TeamMetadata[] */],
  "lastUpdated": "2025-11-12T01:40:07.408Z"
}
```

**Response Fields:**

| Field         | Type           | Description                                 |
| ------------- | -------------- | ------------------------------------------- |
| `events`      | GameLean[]     | Array of game objects matching query        |
| `teams`       | TeamMetadata[] | Array of team metadata for teams in results |
| `lastUpdated` | string         | ISO timestamp of when scoreboard was last pulled from ESPN API |

**Caching:**
- Games with live state (`state: "in"`): 10 seconds cache
- All other games: 60 seconds cache

**Notes:**
- Results sorted by date, then week
- If `conferenceId` is provided, only returns conference games
- Team metadata included for all teams referenced in game results
- Uses lean queries for performance

---

## POST /api/pull-teams

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
- Not required before pulling games - games can be seeded independently

---

## POST /api/pull-games

Pulls game data from ESPN for a specific season/conference.

**Authentication:** None required

**Request Body:**

```json
{
  "sport": "football",
  "league": "college-football",
  "season": 2025,
  "conferenceId": 8,
  "week": 1  // Optional: specific week number
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
  "lastUpdated": "2025-11-12T01:40:07.408Z",
  "errors": []  // Optional: array of error messages
}
```

**Error Responses:**
- `400`: Missing required fields
- `500`: ESPN API error or database error

**Game Data Stored:**
- Basic info: `espnId`, `displayName`, `date`, `week`, `season`
- State: `state` (pre/in/post), `completed`, `conferenceGame`, `neutralSite`
- Teams: `home`/`away` with `teamEspnId`, `abbrev`, `score`, `rank`
- Odds: `spread`, `favoriteTeamEspnId`, `overUnder`
- `predictedScore`: Always calculated (uses real scores for completed games, spread + averages for incomplete)

**Notes:**
- Dynamically determines season weeks using ESPN calendar API
- Excludes SEC Championship game
- Can run independently - does not require teams to be seeded first
- Optimal order: `/api/pull-teams` → `/api/cron/update-rankings` → `/api/pull-games` for most accurate `predictedScore`

---

## POST /api/simulate

Simulates SEC tiebreaker standings with optional user-provided game outcomes.

**Authentication:** None required

**Request Body:**

```json
{
  "season": 2025,
  "conferenceId": "8",
  "overrides": {
    "401752772": {
      "homeScore": 45,
      "awayScore": 10
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
  "standings": [/* StandingEntry[] */],
  "championship": ["333", "145"],
  "tieLogs": [/* TieLog[] */]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `standings` | StandingEntry[] | Full conference standings (sorted by rank) |
| `championship` | [string, string] | Top 2 team IDs (SEC Championship matchup) |
| `tieLogs` | TieLog[] | Detailed tiebreaker explanations |

**StandingEntry Fields:**

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

**TieLog Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `teams` | string[] | Team IDs involved in tie |
| `steps` | TieStep[] | Tiebreaker rules applied |

**TieStep Fields:**

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
- Returns all 16 teams in standings array

---

**See also:** [Main API Reference](./api-reference.md) | [Cron Jobs](./api-reference-cron.md)

