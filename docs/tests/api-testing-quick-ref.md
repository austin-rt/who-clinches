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

### POST /api/games/[sport]/[conf]

**Example**: `/api/games/cfb/sec`
- Path: `sport` (e.g., "cfb"), `conf` (e.g., "sec")
- Body params: `season`, `week`, `state` (pre/in/post), `from`, `to`, `force`
- Fetches from ESPN, upserts to database, returns reshaped data
- Verify: `TeamMetadata` fields (id, abbrev, displayName, logo, color, alternateColor)
- Response: `{ events: [...], teams: [...], lastUpdated: "..." }`

### POST /api/games/[sport]/[conf]/live

**Example**: `/api/games/cfb/sec/live`
- Lightweight live game updates (scores/status only)
- Body params: `season`, `week`, `force`
- Used by frontend polling when games are in progress

### POST /api/games/[sport]/[conf]/spreads

**Example**: `/api/games/cfb/sec/spreads`
- Spread/odds updates only
- Body params: `season`, `week`, `force`
- Used by frontend polling for pre-game games

### POST /api/teams/[sport]/[conf]

**Example**: `/api/teams/cfb/sec`
- Fetches team data from ESPN, upserts to database, returns data
- Body params: `update` (rankings/stats/full), `force`
- Response: `{ teams: [...], teamsMetadata: [...], lastUpdated: "..." }`

### POST /api/simulate/[sport]/[conf]

**Example**: `/api/simulate/cfb/sec`
- Input: `{ season, overrides }`
- Verify: 16 teams, rankings 1-16, tiebreaker rules (A-E), championship array
- Validation: Non-negative integers, no ties, required fields

**Note**: Cron endpoints have been removed. All data updates are now handled via on-demand API endpoints with frontend polling.

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

