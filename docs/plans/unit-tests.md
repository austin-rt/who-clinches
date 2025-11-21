# Unit Tests Plan

**Goal:** Achieve 100% code coverage for all API routes and helper/reshape functions with automated testing across local, preview, and production environments.

---

## Test Framework & Setup

**Framework:** Jest (Next.js standard)

**Test Structure:**
```
__tests__/
├── api/                    # API route tests
├── lib/                    # Helper function tests
└── setup.ts                # Jest configuration & helpers
```

**Test Data Strategy:**
- Real ESPN API data stored in `/test` database
- Populated via `/api/cron/update-test-data` endpoint
- Auto-seeded before tests run via `npm run test:db:check`
- Models: `ESPNScoreboardTestData`, `ESPNGameSummaryTestData`, `ESPNTeamTestData`, `ESPNTeamRecordsTestData`

---

## Test Coverage

### API Routes (100% coverage)

**`/api/games` (GET):**
- Response structure validation
- Filter by season, week, conferenceId, state, date range
- Cache headers (10s for live, 60s otherwise)
- Invalid parameter handling

**`/api/simulate` (POST):**
- Response structure validation
- No overrides, single/multiple overrides
- Rankings 1-16 with no gaps
- Tiebreaker rules (A-E)
- Invalid score validation (tie, negative, non-integer)

**`/api/pull-teams` (POST):**
- Pull all conference teams or specific teams
- Response structure validation
- Missing field validation

**`/api/pull-games` (POST):**
- Pull full season or specific week
- Response structure validation
- Missing field validation

**Cron Job Endpoints:**
- Authentication required
- Response structure validation

### Helper Functions (Phase 3)

**Reshape Functions:**
- `reshapeScoreboardData()` - ESPN → Database format
- `reshapeTeamData()` - ESPN → Database format

**Tiebreaker Functions:**
- Rules A-E implementation
- Tiebreaker explanation generation
- Championship selection (top 2)

**Calculation Functions:**
- Conference record calculation
- Win percentage calculation
- Opponent win percentage
- Common opponent identification

---

## Test Execution

**Scripts:**
```bash
npm run db:check          # Check if DB seeded, seed if needed
npm run test:api          # Auto-check DB + run API integration tests
npm run test              # Run all tests
npm run test:watch        # Watch mode during development
npm run test:coverage     # Generate coverage report
```

**How It Works:**
1. `npm run db:check` - Checks/seeds database via API calls
2. `npm run test:api` - Chains `db:check` + Jest tests
3. Extended timeouts for ESPN API calls (30s) and cron jobs (15-30s)

**Environments:**
- **Local:** `npm run test:api` (primary workflow)
- **Preview:** GitHub Actions on PR (tests against preview DB)
- **Production:** GitHub Actions on merge (read-only queries)

---

## Implementation Status

### Phase 1: Jest Setup & Test Database ✅ COMPLETED
- Jest configuration
- Test database with real ESPN API data
- Database check & seed script
- Consolidated npm test scripts

### Phase 2: API Route Tests ✅ COMPLETED
- `/api/games` tests (13 tests)
- `/api/simulate` tests (16 tests)
- `/api/pull-teams` tests (10 tests)
- `/api/pull-games` tests (10 tests)
- `/api/cron/*` tests (3 tests)

### Phase 3: Helper Function Tests (Next)
- Reshape function tests
- Tiebreaker function tests
- Calculation function tests

### Phase 4: GitHub Actions CI/CD
- Local test workflow
- Preview test workflow
- Production test workflow

---

## Success Criteria

- ✅ 100% code coverage for all API routes (49 tests implemented)
- ⏳ 100% code coverage for all helper/reshape functions (Phase 3)
- ✅ All tests pass locally
- ✅ Single unified npm script interface
- ⏳ GitHub Actions workflows configured
- ⏳ Coverage reports generated and tracked

---

## Known Issues & Recommendations

**HIGH Priority:**
1. Mock ESPN API calls - Tests should not depend on live APIs
2. Add coverage thresholds - Jest should fail if coverage drops

**MEDIUM Priority:**
3. Optimize test database seeding - Ensure test data is always up to date
4. Add error message verification - Check exact error codes

**LOW Priority:**
5. Add missing test cases - Cache headers, edge cases
6. Optimize timeouts - Use retries or reduce test scope

---

## Notes

**Test Data:**
- Tests use real ESPN API data stored in `/test` database
- Test database automatically seeded with ESPN API responses via cron jobs
- No reliance on external ESPN API during test runs (data is pre-seeded)

**Database Testing:**
- Local: Uses live dev database (should use MongoDB Memory Server)
- Preview: Real preview database (integration testing)
- Production: Read-only queries only (verification testing)
