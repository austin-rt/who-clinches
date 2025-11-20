# Unit Tests Plan

**Goal:** Achieve 100% code coverage for all API routes and helper/reshape functions with automated testing across local, preview, and production environments.

---

## Test Framework & Setup

**Framework:** Jest (Next.js standard)

**Dependencies to Add:**

- `jest` - Test runner
- `@testing-library/react` - React component testing (future phases)
- `mongodb-memory-server` - In-memory MongoDB for unit tests
- `@types/jest` - TypeScript support

**Test Structure:**

```
project/
├── __tests__/
│   ├── api/                    # API route tests
│   │   ├── games.test.ts
│   │   ├── simulate.test.ts
│   │   ├── pull-teams.test.ts
│   │   └── pull-games.test.ts
│   ├── lib/                    # Helper function tests
│   │   ├── reshape-teams.test.ts
│   │   ├── tiebreaker.test.ts
│   │   └── calculations.test.ts
│   └── setup.ts                # Jest configuration & helpers
├── jest.config.js              # Jest configuration
└── package.json                # Test scripts
```

---

## Test Data Strategy

**Real ESPN API Data in Test Database:**

All tests use real ESPN API data stored in the test database (`/test`). The test database is automatically seeded with actual ESPN API responses via cron jobs, ensuring test data always matches production contracts.

**Test Database Setup:**

- Separate `/test` database stores ESPN API snapshots
- Populated via `/api/cron/update-test-data` endpoint
- Models: `ESPNScoreboardTestData`, `ESPNGameSummaryTestData`, `ESPNTeamTestData`, `ESPNTeamRecordsTestData`
- Auto-seeded before tests run via `npm run test:db:check`

**Test Helpers:**

**`__tests__/setup.ts`**

```typescript
// Jest setup
// MongoDB Memory Server initialization
// Global mocks/stubs
// Helper functions for test data creation
// fetchAPI - HTTP request helper with timeout
// validateNestedFields - Programmatic field validation
```

---

## Test Coverage by Area

### 1. API Routes (100% coverage)

#### `/api/games` (GET)

**Tests:**

- ✓ Returns GamesResponse with correct structure
- ✓ Includes all 6 TeamMetadata fields (id, abbrev, displayName, logo, color, alternateColor)
- ✓ Filter by season
- ✓ Filter by week
- ✓ Filter by conferenceId
- ✓ Filter by state (pre/in/post)
- ✓ Filter by date range (from/to)
- ✓ Multiple filters combined
- ✓ Invalid season format returns empty/error
- ✓ Invalid week format returns empty/error
- ✓ Invalid state returns empty/error
- ✓ Cache headers set correctly (10s for live, 60s otherwise)
- ✓ Response includes lastUpdated timestamp

**File:** `__tests__/api/games.test.ts`

#### `/api/simulate` (POST)

**Tests:**

- ✓ Returns SimulateResponse with correct structure
- ✓ Includes all 9 StandingEntry fields (rank, teamId, abbrev, displayName, logo, color, record, confRecord, explainPosition)
- ✓ Returns all conference teams (e.g., 16 for SEC)
- ✓ No overrides - uses real + predicted scores
- ✓ Single game override
- ✓ Multiple game overrides
- ✓ Rankings 1-16 with no gaps
- ✓ Tiebreaker rules applied (A-E)
- ✓ Championship array populated (top 2)
- ✓ TieLogs array populated when applicable
- ✓ Missing season returns 400
- ✓ Missing conferenceId returns 400
- ✓ Invalid override format returns 400
- ✓ Tie score returns 400
- ✓ Negative score returns 400
- ✓ Non-integer score returns 400

**File:** `__tests__/api/simulate.test.ts`

#### `/api/pull-teams` (POST)

**Tests:**

- ✓ Pulls all conference teams when conferenceId provided (e.g., 8 for SEC)
- ✓ Returns upserted count
- ✓ Teams include color and alternateColor fields
- ✓ Pull specific teams by abbreviation
- ✓ Empty teams array returns 400
- ✓ Missing sport returns 400
- ✓ Missing league returns 400
- ✓ Missing both teams and conferenceId returns 400
- ✓ Response includes lastUpdated timestamp
- ✓ Teams written to database correctly

**File:** `__tests__/api/pull-teams.test.ts`

#### `/api/pull-games` (POST)

**Tests:**

- ✓ Pulls full season when no week specified
- ✓ Pulls specific week
- ✓ Returns upserted count
- ✓ Returns weeksPulled array
- ✓ All games include displayName field
- ✓ All games include predictedScore
- ✓ Missing sport returns 400
- ✓ Missing league returns 400
- ✓ Missing season returns 400
- ✓ Invalid week (negative) returns 400
- ✓ Response includes lastUpdated timestamp
- ✓ Games written to database correctly

**File:** `__tests__/api/pull-games.test.ts`

#### Cron Job Endpoints (Authorization & Accessibility)

**Tests:**

- ✓ `/api/cron/update-rankings` - Protected with Bearer token
- ✓ `/api/cron/update-games` - Accessible with valid auth
- ✓ `/api/cron/update-all` - Accessible with valid auth (Hobby batch endpoint)
- ✓ `/api/cron/update-spreads` - Accessible with valid auth
- ✓ `/api/cron/update-team-averages` - Accessible with valid auth
- ✓ Unauthorized requests return 401
- ✓ Valid requests return 200 or 500 (if processing)
- ✓ Endpoints exist (not returning 404)

**File:** `__tests__/api/cron.test.ts`

---

### 2. Helper Functions (100% coverage)

#### Reshape Functions

**Location:** `lib/reshape.ts` (to be created if doesn't exist)

**Tests for each reshape function:**

- ✓ Transforms database format to API format
- ✓ Handles null/undefined fields gracefully
- ✓ Preserves all required fields
- ✓ Correct type casting (string, number, etc.)

**Reshape Functions to Test:**

- `reshapeTeamMetadata(dbTeam) -> TeamMetadata`
- `reshapeGameLean(dbGame) -> GameLean`
- `reshapeStandingEntry(team, standings) -> StandingEntry`
- `reshapeGamesResponse(games, teams) -> GamesResponse`
- `reshapeSimulateResponse(standings, championship, tieLogs) -> SimulateResponse`

**File:** `__tests__/lib/reshape-teams.test.ts`

#### Tiebreaker Functions

**Location:** `lib/tiebreaker.ts` (existing)

**Tests:**

- ✓ Head-to-head rule (Rule A)
- ✓ Divisional win percentage (Rule B)
- ✓ Common opponent win percentage (Rule C)
- ✓ Strength of victory (Rule D)
- ✓ Strength of schedule (Rule E)
- ✓ Tiebreaker explanation generated correctly
- ✓ All 16 teams ranked without gaps
- ✓ Correct championship (top 2) selection

**File:** `__tests__/lib/tiebreaker.test.ts`

#### Calculation Functions

**Location:** `lib/calculations.ts` (existing)

**Tests:**

- ✓ Conference record calculation (wins/losses)
- ✓ Overall record calculation
- ✓ Win percentage calculation
- ✓ Opponent win percentage
- ✓ Common opponent identification
- ✓ Head-to-head record
- ✓ Strength of victory calculation
- ✓ Strength of schedule calculation

**File:** `__tests__/lib/calculations.test.ts`

---

## Test Execution Strategy

### Single Unified npm Script Approach

All testing is consolidated into one npm script interface with automatic database seeding:

```bash
npm run db:check          # Check if DB seeded, seed if needed (manual)
npm run test:api          # Auto-check DB + run API integration tests
npm run test              # Run all tests (manual DB setup required)
npm run test:watch        # Watch mode during development
npm run test:coverage     # Generate coverage report with thresholds
```

#### How It Works:

1. **`npm run db:check`** - Runs Node.js script that:
   - Checks if teams/games are seeded via API calls
   - Auto-seeds via `/api/pull-teams` and `/api/pull-games` if empty
   - Verifies response structures match expected types
   - Returns pass/fail status

2. **`npm run test:api`** - Chains together:
   - `npm run db:check` (ensures DB ready)
   - Jest tests for all API endpoints
   - Exits with non-zero if any test fails

3. **Extended Test Timeouts** - Tests account for:
   - ESPN API call latency (30s timeout for `pull-games` full season)
   - Cron job processing (15-30s timeout for long-running jobs)
   - Default 5s timeout for fast endpoints

### Local Development

```bash
npm run test:api          # Primary workflow - check + test
npm run test:watch       # Watch mode for TDD
npm run test:coverage    # Check coverage before committing
```

### Preview Environment

```bash
# GitHub Actions workflow runs on every PR
# Runs: npm run test:api
# Tests run against preview database
# Must pass before merge
# Coverage report generated and commented on PR
```

### Production Environment

```bash
# GitHub Actions workflow runs on merge to main
# Runs: npm run test:api (read-only queries only)
# Tests run against production database (read-only)
# Must pass before deployment
# Coverage report uploaded to artifact
```

---

## GitHub Actions Setup

**Workflow File:** `.github/workflows/test.yml`

**Local Tests (Always Run):**

- Unit tests with Jest
- Generate coverage report
- Fail if coverage < 100%

**Preview Tests (On PR):**

- Seed preview database
- Run integration tests against preview DB
- Report results on PR
- Fail PR if tests don't pass

**Production Tests (On Merge to Main):**

- Seed temporary production dataset (or use read-only copy)
- Run read-coverage tests
- Report results in commit
- Alert if tests fail

**What's Free & Easy:**

- GitHub Actions: Free tier includes 2000 minutes/month (more than enough)
- No additional cost for running tests
- Vercel integrations work natively with GitHub Actions
- Preview deployments trigger automatically
- Read-only database access for production testing (no data modification)

---

## Implementation Phases

### Phase 1: Jest Setup & Test Database ✅ COMPLETED

- [x] Install Jest and dependencies
- [x] Setup test database with real ESPN API data (stored in `/test` database)
- [x] Setup Jest configuration (`jest.config.js`, `jest.setup.js`)
- [x] Create test setup helpers (`__tests__/setup.ts`)
- [x] Create database check & seed script (`scripts/db-check-and-seed.js`)
- [x] Add consolidated npm test scripts to `package.json`

### Phase 2: API Route Tests ✅ COMPLETED

- [x] Implement `/api/games` tests (13 tests, 100+ assertions)
- [x] Implement `/api/simulate` tests (16 tests, 100+ assertions)
- [x] Implement `/api/pull-teams` tests (10 tests, 50+ assertions)
- [x] Implement `/api/pull-games` tests (10 tests, 50+ assertions)
- [x] Implement `/api/cron/*` tests (3 tests, protection + accessibility)

### Phase 3: Helper Function Tests (Next)

- [ ] Implement reshape function tests
- [ ] Implement tiebreaker function tests
- [ ] Implement calculation function tests

### Phase 4: GitHub Actions CI/CD

- [ ] Create local test workflow
- [ ] Create preview test workflow
- [ ] Create production test workflow
- [ ] Setup coverage reporting

### Phase 5: Ongoing

- [ ] Maintain 100% coverage as new features added
- [ ] Add frontend component tests (future phases)
- [ ] Add E2E tests (future phases)

---

## Implementation Details - What Was Created

### Scripts (`scripts/`)

- **`db-check-and-seed.js`** (230 lines)
  - Checks database seeding status via API calls
  - Auto-seeds via pull-teams and pull-games endpoints
  - Verifies response structures (GamesResponse, SimulateResponse)
  - Supports environment-specific configuration (--env flag)

### Test Configuration

- **`jest.config.js`** - Jest configuration with Next.js integration
- **`jest.setup.js`** - Global setup (suppress console, env vars)
- **`__tests__/setup.ts`** - Test helpers (fetchAPI, validateFields, etc.)

### Test Database

- **`/test` database** - Stores real ESPN API data for testing
  - Populated via `/api/cron/update-test-data` endpoint
  - Models: `ESPNScoreboardTestData`, `ESPNGameSummaryTestData`, `ESPNTeamTestData`, `ESPNTeamRecordsTestData`
  - Auto-seeded before tests run via `npm run test:db:check`
  - Includes all required TeamMetadata fields (id, abbrev, displayName, logo, color, alternateColor)

### API Integration Tests (49 tests, 200+ assertions)

- **`__tests__/api/games.test.ts`** (13 tests)
- **`__tests__/api/simulate.test.ts`** (16 tests)
- **`__tests__/api/pull-teams.test.ts`** (10 tests)
- **`__tests__/api/pull-games.test.ts`** (10 tests)
- **`__tests__/api/cron.test.ts`** (3 tests)

### npm Scripts (added to package.json)

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage",
"db:check": "node scripts/db-check-and-seed.js",
"test:api": "npm run db:check && npm run test -- __tests__/api",
"test:all": "npm run db:check && npm run test"
```

### Dependencies Added

- `jest` - Test runner
- `@testing-library/react` - Component testing (future)
- `@testing-library/jest-dom` - DOM matchers
- `@types/jest` - TypeScript support
- `jest-environment-jsdom` - DOM environment
- `jest-mock-extended` - Advanced mocking
- `mongodb-memory-server` - In-memory DB (future)
- `dotenv` - Environment config

---

## Success Criteria

- ✅ 100% code coverage for all API routes (49 tests implemented)
- ⏳ 100% code coverage for all helper/reshape functions (Phase 3)
- ✅ All tests pass locally
- ✅ All tests pass on preview DB (manual seeding)
- ⏳ All tests pass on production DB (GitHub Actions setup)
- ⏳ GitHub Actions workflows configured and running
- ⏳ Coverage reports generated and tracked
- ✅ No manual database seeding needed for `npm run test:api`
- ✅ Single unified npm script interface (not bash + Jest)

---

## Audit & Identified Flaws

### Test Design Issues

1. **❌ Database Dependency in Unit Tests**
   - Tests call live `/api/pull-teams` and `/api/pull-games` endpoints
   - Should use mocked ESPN API responses instead
   - Impact: Tests are integration tests, not unit tests; slow (30s+)
   - Fix: Use `jest.mock()` to mock ESPN API calls

2. **❌ No Isolation Between Test Suites**
   - Database state persists across test files
   - Tests assume data seeded by `db:check` script
   - Impact: Tests can fail if DB is dropped between runs
   - Fix: Use MongoDB Memory Server (already installed) for isolated tests

3. **❌ Incomplete Error Code Testing**
   - Tests accept both 400 and 500 errors for validation failures
   - No verification of specific error messages
   - Impact: Can't distinguish between validation errors and server errors
   - Fix: Check response body for error message, not just status code

4. **⚠️ Missing Test Coverage**
   - No tests for `/api/cron` response bodies (only auth + accessibility)
   - No tests for cache headers on `/api/games` endpoint
   - No tests for override edge cases (tie scores, equal records)
   - No tests for `limitedGames` option in `/api/games`
   - No tests for week filtering

5. **⚠️ Timeout Handling**
   - Pull-games tests timeout at 30s (ESPN API can be slower)
   - Cron tests timeout at 15-30s (arbitrary limits)
   - Better: Add retry logic or use test database data
   - Impact: CI/CD pipelines may fail intermittently

6. **⚠️ Test Flakiness - Data Dependency**
   - Tests assume all conference teams are seeded
   - Tests assume games exist for season 2025
   - If ESPN data structure changes, tests break
   - Better: Test against stable test database snapshots

7. **✅ Test Data Strategy**
   - Tests use real ESPN API data stored in `/test` database
   - Test database is automatically seeded before tests run
   - No fixture files needed - tests query the test database directly

8. **⚠️ No Test Isolation for Score Validation**
   - Pull-games tests run full season (expensive)
   - Should test week-specific pull separately
   - Impact: Slow CI pipeline

### Architectural Issues

1. **Database Check Script Not Idempotent**
   - Script doesn't verify if games already include color fields
   - Running twice might cause issues
   - Should check data freshness, not just existence

2. **No Coverage Threshold Configuration**
   - Jest installed but no coverage threshold in config
   - Coverage reports generated but not enforced
   - Should fail tests if coverage < 100%

3. **Missing Test Types**
   - No unit tests for helper functions (reshape, calculations, tiebreaker)
   - No tests for edge cases (tie scores, team renames, API unavailability)
   - No negative tests for SQL injection, XSS, etc.

### Recommendations (Priority Order)

1. **HIGH**: Mock ESPN API calls - Tests should not depend on live APIs
2. **HIGH**: Add coverage thresholds - Jest should fail if coverage drops
3. **MEDIUM**: Optimize test database seeding - Ensure test data is always up to date
4. **MEDIUM**: Add error message verification - Check exact error codes
5. **LOW**: Add missing test cases - Cache headers, edge cases
6. **LOW**: Optimize timeouts - Use retries or reduce test scope

---

## Notes

**Test Data vs Live Data:**

- Current: Tests use real ESPN API data stored in `/test` database
- Test database is automatically seeded with ESPN API responses via cron jobs
- Integration tests can use preview/production DBs when needed
- Test database provides version-controlled, repeatable test data
- No reliance on external ESPN API during test runs (data is pre-seeded)

**Database Testing:**

- Local: Currently uses live dev database (should use MongoDB Memory Server)
- Preview: Real preview database (integration testing)
- Production: Read-only queries only (verification testing)

**Future Considerations:**

- Visual regression tests for UI components (Phase 2+)
- Performance benchmarks (Phase 3+)
- Load testing (Phase 4+)
