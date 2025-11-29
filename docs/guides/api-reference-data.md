# API Reference: Data Endpoints

Complete reference for data query and ingestion endpoints.

**Related:** [Main API Reference](./api-reference.md)

**Note**: All endpoints now fetch from ESPN, reshape data, upsert to database, and return reshaped data. No separate pull endpoints needed.

---

## POST /api/games/[sport]/[conf]

Fetches game data from ESPN API, upserts to database, and returns reshaped data.

**Authentication:** None required

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "sec")  
**Example**: `POST /api/games/cfb/sec`

**Request Body**: 
```json
{
  "season": "2025",
  "week": "11",
  "state": "in",
  "from": "2025-11-01",
  "to": "2025-11-30",
  "update": "live",
  "force": true
}
```

**Body Parameters**: 
- `season` (string | number, optional) - Season year
- `week` (string | number, optional) - Week number
- `state` (string, optional) - "pre", "in", or "post"
- `from`/`to` (string, optional) - Date range (ISO format)
- `update` (string, optional) - "live" (scores/status only), "spreads" (odds only), or undefined (full update)
- `force` (boolean, optional) - `true` to bypass season check

**Response**: `{ "events": [GameLean[]], "teams": [TeamMetadata[]], "lastUpdated": "ISO timestamp" }`

**Caching**: Live games (`state: "in"`): 10s, others: 60s

**Notes**: 
- Automatically fetches from ESPN and upserts reshaped data to database
- Returns reshaped games data (not raw ESPN responses)
- Results sorted by date/week, only conference games, team metadata included
- During off-season, returns existing data from database without fetching from ESPN

---

## POST /api/teams/[sport]/[conf]

Fetches team data from ESPN API, upserts to database, and returns reshaped data.

**Authentication:** None required

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "sec")  
**Example**: `POST /api/teams/cfb/sec`

**Request Body**: 
```json
{
  "update": "rankings",
  "force": true
}
```

**Body Parameters**:
- `update` (string, optional) - "rankings" (rankings/stats only), "stats" (team averages only), or undefined (full update)
- `force` (boolean, optional) - `true` to bypass season check

**Response**: `{ "teams": [TeamLean[]], "teamsMetadata": [TeamMetadata[]], "lastUpdated": "ISO timestamp" }`

**Error Responses**: `400` - No teams found (must seed teams first), `500` - ESPN API or database error

**Notes**: 
- Automatically fetches from ESPN and upserts reshaped data to database
- Returns reshaped team data (not raw ESPN responses)
- Uses ESPN Site API and Core Records API
- During off-season, returns existing data from database without fetching from ESPN
- Teams must be seeded first (via games endpoint which extracts teams from scoreboard)

---

## POST /api/simulate/[sport]/[conf]

Simulates conference tiebreaker standings with optional user-provided game outcomes.

**Authentication:** None required

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "sec")  
**Example**: `/api/simulate/cfb/sec`

**Request Body**: `{ "season": 2025, "overrides": { "gameEspnId": { "homeScore": 45, "awayScore": 10 } } }`

**Parameters**: `season` (number, required) - Season year, `overrides` (object, optional) - Game ID → score overrides, defaults to `{}`

**Override Format**: `homeScore` (number, non-negative integer), `awayScore` (number, non-negative integer)

**Response**: `{ "standings": [StandingEntry[]], "championship": [string, string], "tieLogs": [TieLog[]] }`

**Response Fields**: `standings` (StandingEntry[] - sorted by rank), `championship` ([string, string] - top 2 team IDs), `tieLogs` (TieLog[] - tiebreaker explanations)

**StandingEntry**: `rank` (1-16), `teamId`, `abbrev`, `displayName`, `logo`, `color` (hex without #), `record` ({wins, losses}), `confRecord` ({wins, losses}), `explainPosition` (string)

**TieLog**: `teams` (string[]), `steps` (TieStep[])

**TieStep**: `rule` (A-E), `detail` (string), `survivors` (string[])

**Error Responses**: `400` - Missing required fields or invalid score (negative/non-integer), `500` - Database or tiebreaker calculation error

**Tiebreaker Rules**: A (head-to-head, min 2 games), B (common opponents, min 4), C (highest-placed common opponent), D (conference win %), E (scoring margin - relative %-based, offensive cap 200%, defensive min 0%)

**Notes**: Uses `predictedScore` for games without overrides, validates scores, handles ties recursively, returns all 16 teams

---

**See also:** [Main API Reference](./api-reference.md) | [Cron Jobs](./api-reference-cron.md)

