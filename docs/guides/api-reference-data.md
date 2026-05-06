# API Reference: Data Endpoints

Complete reference for data query endpoints. See [Main API Reference](./api-reference.md) for caching and rate limiting details.

---

## GET /api/games/[sport]/[conf]

Fetches game data from CFBD API and returns reshaped data with team metadata.

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "SEC")  
**Example**: `GET /api/games/cfb/SEC?season=2025&week=11`

**Query Parameters**:

- `season` (string, optional) - Season year. Defaults to current season from CFBD if not provided.
- `week` (string, optional) - Week number. Requires `season` parameter if provided.

**Response**: `{ "events": [GameLean[]], "teams": [TeamMetadata[]], "season": number }`

**GameLean** (in `events` array): Game object with `id`, `_id`, `home` and `away` objects containing `teamId`, `abbrev`, `displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`, `score`, `rank`.

**TeamMetadata** (in `teams` array): Team metadata with `id`, `abbrev`, `name`, `displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`, `conferenceId`, `conferenceStanding`, `conferenceRecord` (string, e.g., "7-1"), `record` (full record object), `rank` (number | null), `division` (string | null), `nationalRank` (number | null), `spPlusRating` (number | null), `sor` (number | null)

**Caching**: Live games (`state: "in"`): 10s, others: 60s

**Notes**: CFBD games and teams are cached in Upstash Redis (production and preview when configured). Teams are fetched once per season and grouped by conference. Conference records are calculated from completed conference games using the modular tiebreaker system.

---

## POST /api/simulate/[sport]/[conf]

Simulates conference tiebreaker standings with optional user-provided game outcomes.

**Note**: Dynamic endpoint supporting multiple conferences. The endpoint path is `/api/simulate/[sport]/[conf]` where `sport` is `cfb` and `conf` is the conference abbreviation (e.g., `SEC`).  
**Example**: `/api/simulate/cfb/SEC`

**Request Body**: `{ "season": 2025, "games": [GameLean[]], "teams": [TeamMetadata[]], "overrides": { "gameId": { "homeScore": 45, "awayScore": 10 } } }`

**Parameters**:

- `season` (number, required) - Season year
- `games` (GameLean[], required) - All conference games from the games endpoint
- `teams` (TeamMetadata[], required) - All conference teams from the games endpoint
- `overrides` (object, optional) - Game ID → score overrides, defaults to `{}`. Game IDs match the `id` field from GameLean objects.

**Override Format**:

- Game ID (string) → `{ "homeScore": number, "awayScore": number }`
- `homeScore` (number, non-negative integer, required)
- `awayScore` (number, non-negative integer, required)
- Tie scores are not allowed
- Scores must be whole numbers (integers)

**Response**: `{ "standings": [StandingEntry[]], "championship": [string, string], "tieLogs": [TieLog[]], "tieFlowGraphs": [TieFlowGraph[]] }`

**Response Fields**:

- `standings` (StandingEntry[] sorted by rank) - All teams with their final standings
- `championship` ([string, string]) - Top 2 team IDs for championship game
- `tieLogs` (TieLog[]) - Detailed tiebreaker explanations showing which rules were applied
- `tieFlowGraphs` (TieFlowGraph[]) - React Flow decision tree data for visualizing tiebreaker steps

See `app/store/api.ts` for full type definitions (generated types used by API routes).

**Error Responses**:

- `400` - Missing required fields, invalid score (negative/non-integer), tie scores not allowed, or conference config error
- `404` - No conference games found for season
- `500` - CFBD API error or tiebreaker calculation error

**Notes**: Accepts client-provided `games` and `teams` data (from the games endpoint) — does not fetch from CFBD. Uses `predictedScore` for games without overrides. Non-SEC overrides are normalized to 1-0 W/L for hashing (only SEC Rule E uses exact margin).

## POST /api/share/[sport]/[conf]

Creates or retrieves a shareable simulation snapshot. Stores pre-computed results in PostgreSQL with hash-based deduplication — does not re-run the simulation pipeline.

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "sec")
**Example**: `POST /api/share/cfb/sec`

**Request Body**: `{ season (number), overrides (object, optional), results: { standings, championship, tieLogs, games } }`

**Response**: `{ "id": "nanoid", "url": "https://origin/results/nanoid" }`

**Deduplication**: Uses `hashPayload(sport, conf, { season, overrides })` to produce a unique hash. If a snapshot with the same hash already exists, returns the existing record (HTTP 200) instead of creating a new one (HTTP 201).

**Security**: Same-origin validation via `checkSameOrigin()`. Rejects requests from different origins.

**Error Responses**:

- `400` - Missing season, missing results, invalid sport/conference
- `403` - Cross-origin request rejected
- `500` - Database error

---

## GET /api/games/[sport]/[conf]/subscribe

Server-Sent Events (SSE) endpoint for real-time game score updates via GraphQL subscription.

**Path Parameters**: `sport` (string), `conf` (string)
**Query Parameters**: `season` (number, required)

**Response**: SSE stream with `GamesResponse` objects (`{ events: GameLean[], teams: TeamMetadata[], season: number }`)

**Notes**: Used by `useGamesData` hook when games are live or starting within 5 minutes. Falls back to REST polling when out of season or GraphQL is disabled.

---

**See also:** [Main API Reference](./api-reference.md) | [Stats Endpoints](./api-reference-stats.md)
