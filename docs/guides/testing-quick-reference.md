# Testing Quick Reference

Quick commands and environment setup. Detailed procedures: [Comprehensive API Testing](../tests/comprehensive-api-testing.md).

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
npm run test -- __tests__/api/games.test.ts

# Run all tests (auto-seeds main DB first)
npm run test:all
```

## Environment Files

- **`.env.local`** - Local dev (default): `MONGODB_DB=dev`, `CRON_SECRET`, credentials, `VERCEL_AUTOMATION_BYPASS_SECRET`, read-only credentials
- **`.env.preview`** - Preview/staging: `MONGODB_DB=preview`
- **`.env.production`** - Production: `MONGODB_DB=production`

**Usage:**
- `db:check` uses `--env` param to load `.env.{envName}` and check corresponding database
- Uses read-only credentials (`MONGODB_USER_READONLY`, `MONGODB_PASSWORD_READONLY`) for verification
- Bypass token (`VERCEL_AUTOMATION_BYPASS_SECRET`) auto-handled by `db:check` script and Jest tests
- Manual curl requires explicit bypass token (see comprehensive-api-testing.md)

---

## Test Structure

- `__tests__/api/` - API endpoint tests (games, simulate, pull-teams, pull-games, cron)
- `__tests__/lib/` - Reshape function tests (uses test DB)
- `__tests__/fixtures/` - Test data (teams, games)
- `__tests__/setup.ts` - Test helpers

---

## Test Coverage

- API endpoints: 60 tests (games: 16, simulate: 21, pull-teams: 10, pull-games: 10, cron: 4)
- Reshape functions: ~30 tests
- **Total: ~90 tests, 300+ assertions**

---

## What's Tested

- Cache headers (60s non-live, shorter for live)
- Error messages (missing params, invalid scores, etc.)
- Data validation (required fields, hex colors, team count, rankings)
- Edge cases (week/state filtering, multiple overrides, tie scores)

---

## Coverage Threshold

Minimum 80% (branches, functions, lines, statements). Tests fail if below threshold.

---

## Test Database

Separate `/test` database stores ESPN API snapshots for reshape unit tests.

**Setup:**
- Run `npm run test:db:check` before reshape tests (auto-seeds if empty)
- Populated via `/api/cron/update-test-data` endpoint
- Models: `ESPNScoreboardTestData`, `ESPNGameSummaryTestData`, `ESPNTeamTestData`, `ESPNTeamRecordsTestData`
- Separate from main database (dropping main DB doesn't affect test DB)

---

## Troubleshooting

- **TEST_DATA_ERROR**: Run `npm run test:db:check` (auto-seeds test DB)
- **Timeouts**: Ensure dev server running (`npm run dev`), wait 5-10s for ESPN API calls
- **401 Unauthorized**: Verify `CRON_SECRET` in `.env.local`
- **Database errors**: Run `npm run db:check` or seed via API
- **Empty coverage**: Run `npm run test:coverage`, open `coverage/index.html`

---

## CI/CD

Command: `npm run test:api`  
Expected: 5 test suites, 60 tests, ~70s execution

---

## Summary

✅ 60 API tests (5 endpoints)  
✅ Auto database seeding  
✅ 80% coverage threshold enforced  
✅ Cache headers, error messages, edge cases validated  
✅ Ready for development and CI/CD
