# API Testing Quick Reference

**Note:** Full guide in [comprehensive-api-testing.md](./comprehensive-api-testing.md)

---

## Critical Test Patterns

1. **Structure Validation** - Verify response matches `lib/api-types.ts` types
2. **Error Handling** - Test 400/401/500 responses with invalid inputs
3. **Cache Headers** - Verify `Cache-Control` headers (60s non-live, shorter for live)
4. **Edge Cases** - Empty arrays, missing fields, invalid formats

---

## Key Endpoints to Test

### GET /api/games/cfb/[conf]
- Path: `conf` (conference slug, e.g., "sec")
- Filter by: `season`, `week`, `state`, `from`, `to`
- Verify: `TeamMetadata` fields (id, abbrev, displayName, logo, color, alternateColor)
- Cache: 10s for live games, 60s otherwise

### POST /api/simulate/cfb/sec
- Input: `{ season, overrides }`
- Verify: 16 teams, rankings 1-16, tiebreaker rules (A-E), championship array
- Validation: Non-negative integers, no ties, required fields

### Cron Endpoints
- Auth: `Authorization: Bearer ${CRON_SECRET}`
- Endpoints: `/api/cron/cfb/[conf]/update-games`, `/api/cron/cfb/[conf]/update-rankings`, `/api/cron/cfb/[conf]/update-spreads`, `/api/cron/cfb/[conf]/update-team-averages`
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
npm run test -- __tests__/api/cfb/games.test.ts
```

---

**For comprehensive testing procedures, see [comprehensive-api-testing.md](./comprehensive-api-testing.md).**

