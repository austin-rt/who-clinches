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

**Example**: `/api/games/cfb/sec`
- Path: `conf` (conference slug, e.g., "sec")
- Filter by: `season`, `week`, `state`, `from`, `to`
- Verify: `TeamMetadata` fields (id, abbrev, displayName, logo, color, alternateColor)
- Cache: 10s for live games, 60s otherwise

### POST /api/simulate/[sport]/[conf]

**Example**: `/api/simulate/cfb/sec`
- Input: `{ season, overrides }`
- Verify: 16 teams, rankings 1-16, tiebreaker rules (A-E), championship array
- Validation: Non-negative integers, no ties, required fields

### Cron Endpoints
- Auth: `Authorization: Bearer ${CRON_SECRET}`
- Endpoints: `/api/cron/[sport]/[conf]/update-games`, `/api/cron/[sport]/[conf]/update-rankings`, `/api/cron/[sport]/[conf]/update-spreads`, `/api/cron/[sport]/[conf]/update-team-averages`
- Examples: `/api/cron/cfb/sec/update-games`, `/api/cron/cfb/sec/update-rankings`
- Verify: 401 without auth, 200/500 with valid auth

---

## Authentication Requirements

- **Cron Jobs:** `Authorization: Bearer ${CRON_SECRET}` header required
- **Data Endpoints:** No authentication required
- **Vercel Deployments:** `X-Vercel-Automation-Bypass: ${VERCEL_AUTOMATION_BYPASS_SECRET}` for protected deployments

---

## Quick Commands

```bash
# Check/seed database
npm run db:check

# Run API tests
npm run test:api

# Run specific test file
npm run test -- __tests__/api/cfb/pull-games.test.ts
```

---

**For comprehensive testing procedures, see [comprehensive-api-testing.md](./comprehensive-api-testing.md).**

