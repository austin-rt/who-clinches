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

- `__tests__/api/cfb/` - API endpoint tests (simulate, standings)
- `__tests__/api/cfb/sec/tiebreaker-rules/` - Tiebreaker rule tests (rule-a through rule-e, integration tests including async rules)
- `__tests__/lib/` - Unit tests (reshape-games, reshape-teams-from-cfbd) using mocks
- `__tests__/setup.ts` - Test helpers (fetchAPI)
- `__tests__/mocks/` - Mock data for CFBD API responses (including SP+ and FPI mocks)

---

## Test Coverage

- API endpoints: Business logic and behavior tests (simulate, standings, multi-conference support)
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
