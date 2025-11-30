# API Reference: Data Endpoints

Complete reference for data query and ingestion endpoints.

**Related:** [Main API Reference](./api-reference.md)

**Note**: All endpoints now fetch from ESPN, reshape data, upsert to database, and return reshaped data. No separate pull endpoints needed.

---

## GET /api/games/[sport]/[conf]

Queries game data from database (read-only, does not fetch from ESPN). Used for fast initial loads.

**Authentication:** None required

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "sec")  
**Example**: `GET /api/games/cfb/sec?season=2025&week=11&state=in`

**Query Parameters**: 
- `season` (string, optional) - Season year
- `week` (string, optional) - Week number
- `state` (string, optional) - "pre", "in", or "post"
- `from`/`to` (string, optional) - Date range (ISO format)

**Response**: Same as POST endpoint (see below)

**Notes**: 
- Read-only operation - does not fetch from ESPN or update database
- Returns existing data from database only (~50-200ms response time)
- Used by frontend for fast initial loads via `useGetSeasonGameDataFromCacheQuery`
- Use POST endpoint to fetch fresh data from ESPN and update database

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

**GameLean** (in `events` array): Game object with `home` and `away` objects containing `teamEspnId`, `abbrev`, `score`, `rank`. Note: `displayName`, `shortDisplayName`, `logo`, `color`, and `alternateColor` are NOT included in `home`/`away` objects - use the `teams` array (TeamMetadata[]) to look up team display information by `teamEspnId`.

**TeamMetadata** (in `teams` array): Team metadata with `id` (matches `teamEspnId`), `abbrev`, `name`, `displayName`, `logo`, `color`, `alternateColor`, `conferenceStanding`, `conferenceRecord`

**Caching**: Live games (`state: "in"`): 10s, others: 60s

**Notes**: 
- Automatically fetches from ESPN and upserts reshaped data to database
- Returns reshaped games data (not raw ESPN responses)
- Results sorted by date/week, only conference games, team metadata included
- During off-season, returns existing data from database without fetching from ESPN

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

**StandingEntry**: `rank` (number, 1-16), `teamId` (string, ESPN team ID), `abbrev` (string), `displayName` (string), `logo` (string, URL), `color` (string, hex without #), `record` ({wins: number, losses: number}), `confRecord` ({wins: number, losses: number}), `explainPosition` (string)

**TieLog**: `teams` (string[]), `steps` (TieStep[])

**TieStep**: `rule` (string, e.g., "Head-to-Head", "Opponent Win Percentage"), `detail` (string), `survivors` (string[]), `tieBroken` (boolean), `label` ("Advances" | "Remaining")

**Error Responses**: `400` - Missing required fields or invalid score (negative/non-integer), `500` - Database or tiebreaker calculation error

**Tiebreaker Rules**: A (head-to-head, min 2 games), B (common opponents, min 4), C (highest-placed common opponent), D (Opponent Win Percentage), E (scoring margin - relative %-based, offensive cap 200%, defensive min 0%)

**Notes**: Uses `predictedScore` for games without overrides, validates scores, handles ties recursively, returns all 16 teams

---

**See also:** [Main API Reference](./api-reference.md) | [Cron Jobs](./api-reference-cron.md)

