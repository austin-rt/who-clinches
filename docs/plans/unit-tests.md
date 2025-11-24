# Unit Tests Plan

**Goal:** Achieve 100% code coverage for all API routes and helper/reshape functions with automated testing across local, preview, and production environments.

---

## Test Framework & Setup

**Framework:** Jest (Next.js standard)

**Test Structure**: `__tests__/api/` (API route tests), `__tests__/lib/` (helper function tests), `__tests__/setup.ts` (Jest configuration)

**Test Data Strategy**: Real ESPN API data in `/test` database, populated via `/api/cron/update-test-data`, auto-seeded via `npm run test:db:check`, models: `ESPNScoreboardTestData`, `ESPNGameSummaryTestData`, `ESPNTeamTestData`, `ESPNTeamRecordsTestData`

---

## Test Coverage

### API Routes (100% coverage)

**`/api/games` (GET)**: Response structure, filters (season/week/conferenceId/state/date range), cache headers (10s live, 60s otherwise), invalid parameter handling

**`/api/simulate` (POST)**: Response structure, no/single/multiple overrides, rankings 1-16, tiebreaker rules A-E, invalid score validation (tie/negative/non-integer)

**`/api/pull-teams` (POST)**: Pull all/specific teams, response structure, missing field validation

**`/api/pull-games` (POST)**: Pull full season/specific week, response structure, missing field validation

**Cron Job Endpoints**: Authentication required, response structure validation

### Helper Functions (Phase 3)

**Reshape**: `reshapeScoreboardData()`, `reshapeTeamData()` (ESPN → Database format)

**Tiebreaker**: Rules A-E, explanation generation, championship selection (top 2)

**Calculation**: Conference record, win percentage, opponent win percentage, common opponent identification

---

## Test Execution

**Scripts**: `npm run db:check` (check/seed DB), `npm run test:api` (auto-check DB + API tests), `npm run test` (all tests), `npm run test:watch` (watch mode), `npm run test:coverage` (coverage report)

**How It Works**: `db:check` checks/seeds via API calls, `test:api` chains `db:check` + Jest tests, extended timeouts (30s ESPN API, 15-30s cron jobs)

**Environments**: Local (`npm run test:api`), Preview (GitHub Actions on PR), Production (GitHub Actions on merge, read-only)

---

## Implementation Status

**Phase 1: Jest Setup & Test Database** ✅ COMPLETED - Jest config, test database with real ESPN API data, database check & seed script, consolidated npm scripts

**Phase 2: API Route Tests** ✅ COMPLETED - `/api/games` (13), `/api/simulate` (16), `/api/pull-teams` (10), `/api/pull-games` (10), `/api/cron/*` (3)

**Phase 3: Helper Function Tests** (Next) - Reshape, tiebreaker, calculation function tests

**Phase 4: GitHub Actions CI/CD** - Local, preview, production test workflows

---

## Success Criteria

✅ 100% code coverage for API routes (49 tests), ⏳ 100% coverage for helper/reshape functions (Phase 3), ✅ All tests pass locally, ✅ Single unified npm script interface, ⏳ GitHub Actions workflows, ⏳ Coverage reports

## Known Issues & Recommendations

**HIGH**: Mock ESPN API calls (tests shouldn't depend on live APIs), add coverage thresholds (Jest should fail if coverage drops)

**MEDIUM**: Optimize test database seeding, add error message verification

**LOW**: Add missing test cases (cache headers, edge cases), optimize timeouts

## Notes

**Test Data**: Real ESPN API data in `/test` database, auto-seeded via cron jobs, no reliance on external API during test runs

**Database Testing**: Local (live dev database, should use MongoDB Memory Server), Preview (real preview DB), Production (read-only queries)
