# API Reference: Data Endpoints

Complete reference for data query and ingestion endpoints.

**Related:** [Main API Reference](./api-reference.md) | [Cron Jobs](./api-reference-cron.md)

---

## GET /api/games/cfb/[conf]

Queries game data from the database for a specific sport and conference.

**Authentication:** None required

**Path Parameters**: `conf` (string) - Conference slug (e.g., "sec")

**Query Parameters**: `season` (string) - Season year, `week` (string) - Week number, `state` (string) - "pre", "in", or "post", `from`/`to` (string) - Date range (ISO format)

**Response**: `{ "events": [GameLean[]], "teams": [TeamMetadata[]], "lastUpdated": "ISO timestamp" }`

**Caching**: Live games (`state: "in"`): 10s, others: 60s

**Notes**: Results sorted by date/week, only conference games, team metadata included, uses lean queries

---

## POST /api/pull-teams/cfb/[conf]

Seeds or updates team data from ESPN API for a specific conference.

**Authentication:** None required

**Path Parameters**: `conf` (string) - Conference slug

**Request Body**: `{}` (empty, conference determined from path)

**Response**: `{ "upserted": 16, "lastUpdated": "ISO timestamp" }`

**Error Responses**: `400` - Missing required fields, `500` - ESPN API or database error

**Notes**: Uses ESPN Site API, upserts teams (create/update), stores name/logo/colors/conference affiliation, conference ID from path, does NOT fetch team stats (use update-rankings cron), not required before pulling games

---

## POST /api/pull-games/cfb/[conf]

Pulls game data from ESPN for a specific season and conference.

**Authentication:** None required

**Path Parameters**: `conf` (string) - Conference slug

**Request Body**: `{ "season": 2025, "week": 1 }` (week optional - if omitted, pulls entire regular season)

**Response**: `{ "upserted": 128, "weeksPulled": [1-14], "lastUpdated": "ISO timestamp", "errors": [] }`

**Error Responses:**
- `400`: Missing required fields
- `500`: ESPN API error or database error

**Game Data Stored**: Basic info (`espnId`, `displayName`, `date`, `week`, `season`), state (`state`, `completed`, `conferenceGame`, `neutralSite`), teams (`home`/`away` with `teamEspnId`, `abbrev`, `score`, `rank`), odds (`spread`, `favoriteTeamEspnId`, `overUnder`), `predictedScore` (calculated: real scores → ESPN odds → team averages + spread → ranking-based → home field advantage)

**Notes**: Dynamically determines season weeks via ESPN calendar API, excludes conference championship, can run independently, optimal order: pull-teams → update-rankings → pull-games for most accurate `predictedScore`

---

## POST /api/simulate/cfb/sec

Simulates conference tiebreaker standings with optional user-provided game outcomes.

**Authentication:** None required

**Path Parameters**: Fixed to "sec" (only SEC supported currently)

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

