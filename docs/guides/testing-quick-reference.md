# Testing Quick Reference

Quick commands and environment setup.

## Common Commands

```bash
# Run all API tests
npm run test:api

# Run reshape unit tests
npm run test:reshape

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- __tests__/api/cfb/games.test.ts

# Run all tests
npm run test

# Run all tests (alias)
npm run test:all
```

## Environment Files

- **`.env.local`** - Local dev (default): `DEV_CFBD_API_KEY`, `DEV_CFBD_API_KEY_2`, `VERCEL_AUTOMATION_BYPASS_SECRET` (for protected Vercel deployments)
- **`.env.preview`** - Preview/staging environment variables
- **`.env.production`** - Production environment variables

**Usage:**
- Bypass token (`VERCEL_AUTOMATION_BYPASS_SECRET`) auto-handled by Jest tests
- Manual curl requires explicit bypass token (see comprehensive-api-testing.md)
- All tests use mocks - no external API calls or database required

---

## Test Structure

- `__tests__/api/cfb/` - API endpoint tests (simulate, predicted scores)
- `__tests__/api/cfb/sec/tiebreaker-rules/` - Tiebreaker rule tests (rule-a through rule-e, integration tests including async rules)
- `__tests__/lib/` - Unit tests (reshape-games, reshape-teams-from-cfbd) using mocks
- `__tests__/setup.ts` - Test helpers (fetchAPI)
- `__tests__/mocks/` - Mock data for CFBD API responses (including SP+ and FPI mocks)

---

## Test Coverage

- API endpoints: Business logic and behavior tests (simulate, multi-conference support)
- Reshape functions: Edge cases and transformation logic
- Tiebreaker rules: Comprehensive rule tests including async rules (e.g., SP+ and FPI fetching for MWC)
- **Coverage threshold:** 80% minimum (branches, functions, lines, statements)
- **What's tested:** Business logic, edge cases, error handling, API contracts, data integrity, async tiebreaker rules

---

## Test Data

**Mock Data** - All tests use mocks based on CFBD TypeScript types.

**Test Data Source:**
- `__tests__/mocks/cfbd-rest-client.ts` - Mock CFBD API responses
- Uses `Partial<>` types for flexible test overrides
- No external API calls during tests

**Benefits:** Fast execution, no external dependencies, complete isolation.

---

## Troubleshooting

- **Tests hanging**: Check logs for teardown issues. `forceExit: true` in Jest config prevents hanging
- **Timeouts**: Test timeout is 120s per test
- **Empty coverage**: Run `npm run test:coverage`, open `coverage/index.html`

---

## Preview Deployment Testing

The preview deployment at `preview.whoclinches.com` has Vercel Protection enabled. API-only testing works with a query parameter, but browser testing requires a cookie.

### API testing (curl)

Append the bypass token as a query parameter:

```bash
curl -s "https://preview.whoclinches.com/api/games/cfb/sec?x-vercel-protection-bypass=6AH0C61v0ABPo07CLh3rJ5l8s1rSahm3"
```

### Browser testing (agent or manual)

Static assets (JS, CSS, fonts) are blocked unless the bypass token is set as a cookie. Navigate to this URL first to set the cookie, then all subsequent page loads work:

```
https://preview.whoclinches.com/?x-vercel-protection-bypass=6AH0C61v0ABPo07CLh3rJ5l8s1rSahm3&x-vercel-set-bypass-cookie=samesitenone
```

The `x-vercel-set-bypass-cookie=samesitenone` parameter tells Vercel to persist the token as a `SameSite=None` cookie, which applies to all asset requests on the domain.

### POST endpoints

POST endpoints (e.g., simulate) require both the bypass token and a same-origin header:

```bash
curl -s "https://preview.whoclinches.com/api/simulate/cfb/sec?x-vercel-protection-bypass=6AH0C61v0ABPo07CLh3rJ5l8s1rSahm3" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://preview.whoclinches.com" \
  -d '{"overrides":{},"season":2026}'
```
