# API Reference: Data Endpoints

Complete reference for data query endpoints.

**Related:** [Main API Reference](./api-reference.md)

**Note**: All endpoints fetch data directly from the CFBD API on each request. No database persistence is used.

---

## GET /api/games/[sport]/[conf]

Fetches game data from CFBD API and returns reshaped data with team metadata.

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "SEC")  
**Example**: `GET /api/games/cfb/SEC?season=2025&week=11`

**Query Parameters**: 
- `season` (string, optional) - Season year. Defaults to current season from CFBD if not provided.
- `week` (string, optional) - Week number. Requires `season` parameter if provided.

**Response**: `{ "events": [GameLean[]], "teams": [TeamMetadata[]], "season": number }`

**GameLean** (in `events` array): Game object with `id`, `_id`, `home` and `away` objects containing `teamId`, `abbrev`, `displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`, `score`, `rank`. All team metadata is included in game objects.

**TeamMetadata** (in `teams` array): Team metadata with `id` (matches `teamId`), `abbrev`, `name`, `displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`, `conferenceStanding`, `conferenceRecord` (string, e.g., "7-1" - calculated from completed conference games), `rank` (number | null)

**Caching**: Live games (`state: "in"`): 10s, others: 60s

**Notes**: Fetches directly from CFBD API on each request. Teams are automatically extracted from CFBD API responses. Conference records are calculated from completed conference games using the modular tiebreaker system. Uses GraphQL when in season and enabled, falls back to REST API otherwise.

---

## GET /api/standings/[sport]/[conf]

Fetches current conference standings calculated from completed conference games.

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "SEC")  
**Example**: `GET /api/standings/cfb/SEC?season=2025`

**Query Parameters**: 
- `season` (string, optional) - Season year. Defaults to current season from CFBD if not provided.

**Response**: `{ "teams": [TeamMetadata[]] }`

**TeamMetadata** (in `teams` array): Team metadata with `id`, `abbrev`, `name`, `displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`, `conferenceStanding` (string, e.g., "1st", "2nd"), `conferenceRecord` (string, e.g., "7-1"), `rank` (number | null)

**Caching**: 60s

**Notes**: Calculates standings from completed conference games using the modular tiebreaker system. Uses conference-specific tiebreaker configuration (currently supports SEC). Returns all teams in the conference with their current standings.

---

## POST /api/simulate/[sport]/[conf]

Simulates conference tiebreaker standings with optional user-provided game outcomes.

**Note**: Dynamic endpoint supporting multiple conferences. The endpoint path is `/api/simulate/[sport]/[conf]` where `sport` is `cfb` and `conf` is the conference abbreviation (e.g., `SEC`).  
**Example**: `/api/simulate/cfb/SEC`

**Request Body**: `{ "season": 2025, "overrides": { "gameId": { "homeScore": 45, "awayScore": 10 } } }`

**Parameters**: 
- `season` (number, required) - Season year
- `overrides` (object, optional) - Game ID → score overrides, defaults to `{}`. Game IDs match the `id` field from GameLean objects.

**Override Format**: 
- Game ID (string) → `{ "homeScore": number, "awayScore": number }`
- `homeScore` (number, non-negative integer, required)
- `awayScore` (number, non-negative integer, required)
- Tie scores are not allowed
- Scores must be whole numbers (integers)

**Response**: `{ "standings": [StandingEntry[]], "championship": [string, string], "tieLogs": [TieLog[]] }`

**Response Fields**: 
- `standings` (StandingEntry[] sorted by rank) - All teams with their final standings
- `championship` ([string, string]) - Top 2 team IDs for championship game
- `tieLogs` (TieLog[]) - Detailed tiebreaker explanations showing which rules were applied

See `lib/api-types.ts` for full type definitions.

**Error Responses**: 
- `400` - Missing required fields, invalid score (negative/non-integer), tie scores not allowed, or conference config error
- `404` - No conference games found for season
- `500` - CFBD API error or tiebreaker calculation error

**Tiebreaker Rules**: Uses modular tiebreaker system with conference-specific configuration. SEC rules: A (head-to-head, min 2 games), B (common opponents, min 4), C (highest-placed common opponent), D (Opponent Win Percentage), E (scoring margin - relative %-based, offensive cap 200%, defensive min 0%)

**Notes**: Fetches games from CFBD API for the specified season. Uses `predictedScore` for games without overrides (calculated from CFBD data). Validates all scores (non-negative integers, no ties). Handles ties recursively using the modular tiebreaker system. Returns all teams in the conference with their final standings.

## Data Model Notes

**Game IDs**: Game IDs in overrides match the `id` field from `GameLean` objects returned by the games endpoint. These are generated from CFBD game data during reshaping.

**Team Enrichment**: Team metadata is enriched at reshape level from CFBD API responses. All team name variations are available in API responses.

---

**See also:** [Main API Reference](./api-reference.md)

