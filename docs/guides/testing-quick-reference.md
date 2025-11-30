# Testing Quick Reference

Quick commands and environment setup.

## Common Commands

```bash
# Check if main DB is seeded (auto-seeds if needed)
npm run db:check                    # Uses .env.local (dev database)
npm run db:check -- --env preview   # Uses .env.preview (preview database)
npm run db:check -- --env production # Uses .env.production (production database)

# Check if test DB is seeded (auto-seeds if needed)
npm run test:db:check

# Run all API tests (auto-seeds main DB first)
npm run test:api

# Run reshape unit tests (auto-seeds test DB first)
npm run test:reshape

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- __tests__/api/cfb/games.test.ts

# Run all tests
npm run test
```

## Environment Files

- **`.env.local`** - Local dev (default): `MONGODB_DB=dev`, credentials, `VERCEL_AUTOMATION_BYPASS_SECRET`, read-only credentials
- **`.env.preview`** - Preview/staging: `MONGODB_DB=preview`
- **`.env.production`** - Production: `MONGODB_DB=production`

**Usage:**
- `db:check` uses `--env` param to load `.env.{envName}` and check corresponding database
- Uses read-only credentials (`MONGODB_USER_READONLY`, `MONGODB_PASSWORD_READONLY`) for verification
- Bypass token (`VERCEL_AUTOMATION_BYPASS_SECRET`) auto-handled by `db:check` script and Jest tests
- Manual curl requires explicit bypass token (see comprehensive-api-testing.md)

---

## Test Structure

- `__tests__/api/cfb/` - API endpoint tests (simulate, teams, games, calculate-predicted-score)
- `__tests__/api/cfb/sec/tiebreaker-rules/` - Tiebreaker rule tests (rule-a through rule-e, integration)
- `__tests__/lib/` - Unit tests (reshape-games, reshape-teams, extract-teams-from-scoreboard) using MongoDB Memory Server with real ESPN data
- `__tests__/setup.ts` - Test helpers (fetchAPI)
- `jest.server-setup.js` - Global setup (starts MongoDB Memory Server, seeds test data, starts Next.js dev server)
- `jest.server-teardown.js` - Global teardown (stops memory server and dev server)

---

## Test Coverage

- API endpoints: Business logic and behavior tests (simulate, teams, games, calculate-predicted-score)
- Reshape functions: Edge cases and transformation logic
- Tiebreaker rules: Comprehensive Rules A-E tests
- **Coverage threshold:** 80% minimum (branches, functions, lines, statements)
- **What's tested:** Business logic, edge cases, error handling, API contracts, data integrity

---

## Test Database

**MongoDB Memory Server** - All tests run against an in-memory database (isolated, no side effects).

**Test Data Source:**
- Atlas `/test` database stores ESPN API snapshots
- Data is copied to MongoDB Memory Server at test startup (via `jest.server-setup.js`)
- Populated via `/api/cron/update-test-data` endpoint
- Models: `ESPNScoreboardTestData`, `ESPNGameSummaryTestData`, `ESPNTeamTestData`, `ESPNTeamRecordsTestData`

**Setup Process:**
1. Global setup starts MongoDB Memory Server
2. Test data is copied from Atlas `/test` database to memory server
3. Next.js dev server is started for API route testing
4. Tests run against isolated in-memory database
5. Global teardown stops memory server and dev server

**Benefits:** Complete isolation, fast execution, no cleanup required.

---

## Troubleshooting

- **TEST_DATA_ERROR**: Run `npm run test:db:check` (ensures Atlas `/test` database has data)
- **Tests hanging**: Check logs for teardown issues. `forceExit: true` in Jest config prevents hanging
- **Timeouts**: Test timeout is 120s per test
- **Memory server errors**: Check Atlas `/test` database accessibility
- **Empty coverage**: Run `npm run test:coverage`, open `coverage/index.html`
- **Port conflicts**: Global teardown should free port 3000
