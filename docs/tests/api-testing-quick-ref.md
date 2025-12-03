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

**Example**: `GET /api/games/cfb/sec?season=2025&week=11`
- Path: `sport` (e.g., "cfb"), `conf` (e.g., "sec")
- Query params: `season`, `week`, `state` (pre/in/post), `from`, `to`
- Read-only: Queries database only, does not fetch from ESPN
- Response: Same format as POST endpoint

### POST /api/games/[sport]/[conf]

**Example**: `POST /api/games/cfb/sec`
- Path: `sport` (e.g., "cfb"), `conf` (e.g., "sec")
- Body params: `season`, `week`, `state` (pre/in/post), `from`, `to`, `force`
- Fetches from ESPN, upserts to database, returns reshaped data
- Verify: `TeamMetadata` fields (id, abbrev, name, displayName, logo, color, alternateColor, conferenceStanding, conferenceRecord)
- Verify: `GameLean` events with `home`/`away` containing `teamEspnId`, `abbrev`, `score`, `rank` (note: `displayName`, `logo`, `color` are NOT in game objects - use `teams` array to look up by `teamEspnId`)
- Response: `{ events: [...], teams: [...], lastUpdated: "..." }`

### POST /api/games/[sport]/[conf]/live

**Example**: `/api/games/cfb/sec/live`
- Lightweight live game updates (scores/status only)
- Body params: `season`, `force` (no `week` parameter - always queries current week)
- Used by frontend polling when games are in progress or starting within 5 minutes of kickoff
- Polls every 60 seconds (disabled in development)
- Upserts games (creates if they don't exist, updates if they do)
- Recalculates predicted scores using full method (team stats, rankings, odds)

### POST /api/games/[sport]/[conf]/spreads

**Example**: `/api/games/cfb/sec/spreads`
- Spread/odds updates only
- Body params: `season`, `week`, `force`
- Used by frontend polling for pre-game games (only in production, only when not starting within 5 minutes)

### Teams Data

**Note**: There is no separate `/api/teams/[sport]/[conf]` endpoint. Teams are automatically extracted and upserted when fetching games via `POST /api/games/[sport]/[conf]`. Team metadata is included in the `teams` array of the games endpoint response.

### POST /api/simulate/cfb/sec

**Note**: Currently hardcoded to `cfb/sec` (not dynamic `[sport]/[conf]`).

**Example**: `/api/simulate/cfb/sec`
- Input: `{ season, overrides }`
- Verify: 16 teams, rankings 1-16, tiebreaker rules (A-E), championship array
- Validation: Non-negative integers, no ties, required fields


---

## Authentication Requirements

- **Data Endpoints:** No authentication required (public endpoints)
- **Vercel Deployments:** `X-Vercel-Automation-Bypass: ${VERCEL_AUTOMATION_BYPASS_SECRET}` for protected deployments

---

## Quick Commands

```bash
# Check/seed database
npm run db:check

# Run API tests
npm run test:api

# Run specific test file
npm run test -- __tests__/api/cfb/games.test.ts
```

---

**For comprehensive testing procedures, see [comprehensive-api-testing.md](./comprehensive-api-testing.md).**

