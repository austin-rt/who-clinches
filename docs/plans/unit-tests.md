# Unit Tests Plan

**Goal:** Achieve 100% code coverage for all API routes and helper/reshape functions with automated testing across local, preview, and production environments.

---

## Test Framework & Setup

**Framework:** Jest (Next.js standard)

**Test Structure**: `__tests__/api/` (API route tests), `__tests__/lib/` (helper function tests), `__tests__/setup.ts` (Jest configuration)

**Test Database**: MongoDB Memory Server (in-memory) - All tests run against isolated in-memory database. Test data is seeded from Atlas `/test` database at test startup.

**Test Data Strategy**: Real ESPN API data from Atlas `/test` database is copied to MongoDB Memory Server at startup. Data is populated via `/api/cron/update-test-data`, models: `ESPNScoreboardTestData`, `ESPNGameSummaryTestData`, `ESPNTeamTestData`, `ESPNTeamRecordsTestData`

**Jest Configuration**:
- `forceExit: true` - Prevents Jest from hanging on open handles
- `testTimeout: 120000` - 2 minutes per test to account for sequential execution
- `maxWorkers: 1` - Sequential execution to avoid race conditions with shared memory server
- Global setup/teardown manages MongoDB Memory Server lifecycle and Next.js dev server

---

## Test Coverage

### API Routes (100% coverage)

**`/api/games/[sport]/[conf]` (GET)**: Endpoint tested via integration with pull-games and simulate endpoints. Business logic validation covered in other test files.

**`/api/simulate/[sport]/[conf]` (POST)**: Team rankings (16 teams, ranks 1-16), championship array validation, tiebreaker rules A-E, invalid score validation (tie/negative/non-integer), input validation, dynamic sport/conf parameters. Test file: `__tests__/api/cfb/sec/simulate.test.ts`

**`/api/pull-teams/[sport]/[conf]` (POST)**: Team count validation, idempotency (existing teams), dynamic sport/conf parameters. Test file: `__tests__/api/cfb/pull-teams.test.ts`

**`/api/pull-games/[sport]/[conf]` (POST)**: Full season pull validation, input validation (missing season), dynamic sport/conf parameters. Test file: `__tests__/api/cfb/pull-games.test.ts`

**Cron Job Endpoints**: Authentication required, response structure validation. Test file: `__tests__/api/cron.test.ts`

**Predicted Score Calculation**: Tests for `calculatePredictedScore()` and helper functions. Test file: `__tests__/api/cfb/calculate-predicted-score.test.ts`

**Reshape Functions**: Tests for `reshapeScoreboardData()`, `reshapeTeamData()`, `extractTeamsFromScoreboard()`. Focus on edge cases, error handling, and business logic. Test files: `__tests__/lib/reshape-games.test.ts`, `__tests__/lib/reshape-teams.test.ts`, `__tests__/lib/extract-teams-from-scoreboard.test.ts`

### Helper Functions (Phase 3)

**Reshape**: `reshapeScoreboardData()`, `reshapeTeamData()` (ESPN → Database format)

**Tiebreaker**: Rules A-E, explanation generation, championship selection (top 2)

**Calculation**: Conference record, win percentage, opponent win percentage, common opponent identification

---

## Test Execution

**Scripts**: `npm run db:check` (check/seed DB), `npm run test:api` (auto-check DB + API tests), `npm run test` (all tests), `npm run test:watch` (watch mode), `npm run test:coverage` (coverage report)

**How It Works**: 
- Global setup (`jest.server-setup.js`) starts MongoDB Memory Server and seeds it with data from Atlas `/test` database
- Global setup also starts Next.js dev server for API route testing
- Tests run against in-memory database (isolated, no side effects)
- Global teardown (`jest.server-teardown.js`) stops memory server and dev server
- Extended timeouts (30s ESPN API, 15-30s cron jobs, 120s per test)

**Environments**: Local (`npm run test:api`), Preview (GitHub Actions on PR), Production (GitHub Actions on merge, read-only)

---

## Implementation Status

**Phase 1: Jest Setup & Test Database** ✅ COMPLETED - Jest config, test database with real ESPN API data, database check & seed script, consolidated npm scripts

**Phase 2: API Route Tests** ✅ COMPLETED - `/api/simulate/[sport]/[conf]`, `/api/pull-teams/[sport]/[conf]`, `/api/pull-games/[sport]/[conf]`, `/api/cron/[sport]/[conf]/*`. Tests focus on business logic, edge cases, and API contracts rather than redundant TypeScript type validation.

**Phase 3: Helper Function Tests** (Next) - Reshape, tiebreaker, calculation function tests

**Phase 4: GitHub Actions CI/CD** - Local, preview, production test workflows

---

## Success Criteria

✅ Business logic and API contract tests for API routes, ⏳ 100% coverage for helper/reshape functions (Phase 3), ✅ All tests pass locally, ✅ Single unified npm script interface, ⏳ GitHub Actions workflows, ⏳ Coverage reports

## Known Issues & Recommendations

**HIGH**: Mock ESPN API calls (tests shouldn't depend on live APIs), add coverage thresholds (Jest should fail if coverage drops)

**MEDIUM**: Optimize test database seeding, add error message verification

**LOW**: Add missing test cases (cache headers, edge cases), optimize timeouts

## Notes

**Test Data**: Real ESPN API data in `/test` database, auto-seeded via cron jobs, no reliance on external API during test runs

**Database Testing**: All tests use MongoDB Memory Server (in-memory, isolated). Test data is seeded from Atlas `/test` database at startup. No tests write to live databases.
