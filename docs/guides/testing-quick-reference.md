# Testing Quick Reference

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

The project uses environment-specific configuration files for testing different databases:

- **`.env.local`** - Local development (default)
  - Used by: Next.js dev server, API endpoints, Jest tests
  - Contains: `MONGODB_DB=dev`, `CRON_SECRET`, `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_HOST`, `MONGODB_APP_NAME`
  - Also contains: `VERCEL_AUTOMATION_BYPASS_SECRET` (required for preview/production testing), `MONGODB_USER_READONLY`, `MONGODB_PASSWORD_READONLY`
- **`.env.preview`** - Preview/staging environment
  - Used by: `npm run db:check -- --env preview`
  - Contains: `MONGODB_DB=preview` and preview-specific config
- **`.env.production`** - Production environment
  - Used by: `npm run db:check -- --env production`
  - Contains: `MONGODB_DB=production` and production-specific config

The `db:check` script loads the appropriate `.env.{envName}` file based on the `--env` parameter to determine which database to check. The script uses MongoDB read-only credentials (`MONGODB_USER_READONLY`, `MONGODB_PASSWORD_READONLY`) for database verification.

**Bypass Token Authentication:**

- `VERCEL_AUTOMATION_BYPASS_SECRET` is required in `.env.local` for preview/production operations
- The `db:check` script automatically handles bypass token injection when targeting preview/production deployments
- Jest tests (via `__tests__/setup.ts`) automatically handle bypass token injection when `BASE_URL` points to vercel.app URLs
- Manual curl commands require explicit bypass token in query parameters (see `docs/tests/comprehensive-api-testing.md`)

**Note:** Seeding via API endpoints uses the server's `.env.local` configuration. See `docs/tests/comprehensive-api-testing.md` for full environment file documentation.

---

## Test Structure

```
__tests__/
├── api/
│   ├── games.test.ts           (16 tests)
│   ├── simulate.test.ts        (21 tests)
│   ├── pull-teams.test.ts      (10 tests)
│   ├── pull-games.test.ts      (10 tests)
│   └── cron.test.ts            (4 tests - includes update-all)
├── lib/
│   ├── reshape-teams.test.ts   (uses test DB)
│   └── reshape-games.test.ts   (uses test DB)
├── fixtures/
│   ├── teams.fixture.ts        (16 SEC teams)
│   └── games.fixture.ts        (4 games)
└── setup.ts                     (helpers)
```

---

## Test Coverage

| Endpoint             | Tests | Status |
| -------------------- | ----- | ------ |
| GET /api/games       | 16    | ✅     |
| POST /api/simulate   | 21    | ✅     |
| POST /api/pull-teams | 10    | ✅     |
| POST /api/pull-games | 10    | ✅     |
| Cron endpoints       | 4     | ✅     |
| Reshape functions    | ~30   | ✅     |

**Total: ~90 tests, 300+ assertions**

---

## What's Tested

### Cache Headers

- ✅ Non-live games have 60s cache
- ✅ Live games have shorter cache
- ✅ Content-Type is JSON

### Error Messages

- ✅ Missing season/conferenceId
- ✅ Invalid parameters
- ✅ Negative scores
- ✅ Non-integer scores
- ✅ Invalid overrides

### Data Validation

- ✅ Required fields present
- ✅ Color fields are valid hex
- ✅ Team count is 16
- ✅ Rankings 1-16 without gaps
- ✅ Championship entries present

### Edge Cases

- ✅ Week filtering
- ✅ Multiple overrides
- ✅ Tie score handling
- ✅ State filtering (pre/in/post)

---

## Coverage Threshold

```
Minimum: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%
```

Tests fail if coverage drops below threshold.

---

## Test Database

The test database (`/test`) stores ESPN API response snapshots for reshape unit tests. This is separate from the main database.

**Before running reshape tests:**

- Run `npm run test:db:check` to ensure test data is seeded
- Test data is populated via `/api/cron/update-test-data` endpoint
- If test DB is empty, the script will automatically seed it

**Test data models:**

- `ESPNScoreboardTestData` - Scoreboard responses
- `ESPNGameSummaryTestData` - Game summary responses
- `ESPNTeamTestData` - Team metadata responses
- `ESPNTeamRecordsTestData` - Team records responses

**Note:** Test database is separate from main database. Dropping the main database does not affect test database.

---

## Troubleshooting

### Reshape tests fail with "TEST_DATA_ERROR"

The test database may be empty. Run:

```bash
npm run test:db:check
```

This will automatically seed the test database if needed.

### Tests timeout

```bash
# Check if server is running
npm run dev

# If running, wait 5-10 seconds for ESPN API calls
# Pull-games tests take 30+ seconds
```

### Tests fail with 401 (unauthorized)

```bash
# Verify CRON_SECRET in .env.local
# It's needed for cron endpoint tests
```

### Database errors

```bash
# Reset and reseed
npm run db:check

# Or just seed
curl -X POST http://localhost:3000/api/pull-teams \
  -H "Content-Type: application/json" \
  -d '{"sport":"football","league":"college-football","conferenceId":8}'
```

### Coverage report empty

```bash
# Generate fresh report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

---

## For CI/CD

### GitHub Actions Command

```bash
npm run test:api
```

### Expected Output

```
PASS __tests__/api/games.test.ts
PASS __tests__/api/simulate.test.ts
PASS __tests__/api/pull-teams.test.ts
PASS __tests__/api/pull-games.test.ts
PASS __tests__/api/cron.test.ts

Test Suites: 5 passed, 5 total
Tests: 60 passed, 60 total
Snapshots: 0 total
Time: ~70s
```

---

## Documentation

- **Full Details:** [Testing Implementation Complete](../plans/archive/testing-implementation-complete.md)
- **Fixes Applied:** [Fixes Applied 2025-11-12](../plans/archive/fixes-applied-2025-11-12.md)
- **Implementation Plan:** [Unit Tests Plan](../plans/unit-tests.md)

---

## Summary

✅ 60 tests covering 5 API endpoints
✅ Automatic database seeding
✅ 80% coverage threshold (enforced)
✅ Cache headers validated
✅ Error messages validated
✅ Edge cases tested
✅ Ready for development and CI/CD
