# API Testing Quick Reference

**Note:** Full guide in [comprehensive-api-testing.md](./comprehensive-api-testing.md)

---

## Critical Test Patterns

1. **Business Logic** - Verify calculations, transformations, and domain-specific rules
2. **Error Handling** - Test 400/401/500 responses with invalid inputs
3. **Edge Cases** - Boundary conditions, null handling, empty arrays
4. **API Contracts** - Verify HTTP status codes, error response formats, authentication

---

## Key Endpoints to Test

### GET /api/games/[sport]/[conf]

**Example**: `GET /api/games/cfb/SEC?season=2025&week=11`
- Path: `sport` (e.g., "cfb"), `conf` (e.g., "SEC")
- Query params: `season` (optional, defaults to current season), `week` (optional, requires season if provided)
- Fetches from CFBD API on each request - no database persistence
- Response: `{ events: GameLean[], teams: TeamMetadata[], season: number }`
- Verify: `TeamMetadata` fields (id, abbrev, name, displayName, shortDisplayName, logo, color, alternateColor, conferenceStanding, conferenceRecord, rank)
- Verify: `GameLean` events with `home`/`away` containing `teamId`, `abbrev`, `displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`, `score`, `rank`
- Caching: Live games (state: "in"): 10s, others: 60s

### GET /api/standings/[sport]/[conf]

**Example**: `GET /api/standings/cfb/SEC?season=2025`
- Path: `sport` (e.g., "cfb"), `conf` (e.g., "SEC")
- Query params: `season` (optional, defaults to current season)
- Fetches from CFBD API and calculates standings from completed conference games
- Response: `{ teams: TeamMetadata[] }`
- Verify: `TeamMetadata` with `conferenceStanding` (e.g., "1st", "2nd"), `conferenceRecord` (e.g., "7-1"), `rank` (number | null)
- Caching: 60s

### Teams Data

**Note**: There is no separate `/api/teams/[sport]/[conf]` endpoint. Teams are automatically extracted from CFBD API responses when fetching games. Team metadata is included in the `teams` array of the games endpoint response.

### POST /api/simulate/[sport]/[conf]

**Note**: Dynamic endpoint supporting multiple conferences (e.g., `/api/simulate/cfb/SEC`, `/api/simulate/cfb/MWC`).

**Example**: `/api/simulate/cfb/SEC`
- Path: `sport` (e.g., "cfb"), `conf` (e.g., "SEC", "MWC", "ACC", etc.)
- Input: `{ season: number, overrides?: { [gameId: string]: { homeScore: number, awayScore: number } } }`
- Game IDs in overrides match the `id` field from GameLean objects
- Verify: All teams in conference, rankings 1-N, tiebreaker rules (varies by conference), championship array (top 2)
- Validation: Non-negative integers, no ties, required fields (season)
- Response: `{ standings: StandingEntry[], championship: [string, string], tieLogs: TieLog[] }`
- **Note**: Some conferences use async tiebreaker rules that fetch external data (SP+ and FPI ratings) on demand. Some conferences may display a simulation disclaimer when external data (e.g., KPI, SportSource) is not available.


---

## Authentication Requirements

- **Data Endpoints:** No authentication required (public endpoints)
- **Vercel Deployments:** `X-Vercel-Automation-Bypass: ${VERCEL_AUTOMATION_BYPASS_SECRET}` for protected deployments

---

## Quick Commands

```bash
# Run API tests
npm run test:api

# Run specific test file
npm run test -- __tests__/api/cfb/games.test.ts
```

---

**For comprehensive testing procedures, see [comprehensive-api-testing.md](./comprehensive-api-testing.md).**

