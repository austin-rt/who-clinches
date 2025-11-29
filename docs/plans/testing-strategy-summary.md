# Testing Strategy Summary

**Goal:** 100% code coverage for API routes and helper functions with automated testing.

**Full Document:** See [unit-tests.md](./unit-tests.md) for complete test plan.

---

## Test Framework

- **Framework:** Jest (Next.js standard)
- **Database:** MongoDB Memory Server (in-memory) with test data seeded from Atlas `/test` database
- **Coverage Threshold:** 80% minimum (branches, functions, lines, statements)
- **Configuration:** `forceExit: true`, `testTimeout: 120000`, `maxWorkers: 1` (sequential execution)

---

## Test Categories

### 1. API Routes (100% coverage target)

| Endpoint | Test Focus | File |
|----------|------------|------|
| `POST /api/simulate/[sport]/[conf]` | Team rankings, championship validation, tiebreakers, input validation, dynamic routes | `__tests__/api/cfb/sec/simulate.test.ts` |
| `POST /api/games/[sport]/[conf]` | Fetches from ESPN, upserts to database, returns data, dynamic routes | `__tests__/api/cfb/games.test.ts` |
| `POST /api/games/[sport]/[conf]/live` | Live game updates (scores/status only) | `__tests__/api/cfb/games.test.ts` |
| `POST /api/games/[sport]/[conf]/spreads` | Spread/odds updates only | `__tests__/api/cfb/games.test.ts` |
| `POST /api/teams/[sport]/[conf]` | Team count validation, idempotency, dynamic routes | `__tests__/api/cfb/teams.test.ts` |

**Key Tests:** Business logic, error handling, edge cases, API contracts, data integrity

### 2. Helper Functions (100% coverage target)

- **Reshape Functions** (`lib/reshape-*.ts`) - Generic data transformation (sport-agnostic)
- **Tiebreaker Functions** (`lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts`) - SEC Rules A-E
- **Calculation Functions** - Record calculations, win percentages

**Key Tests:** Transform accuracy, null handling, edge cases, error handling

---

## Test Execution

**Commands:**
```bash
npm run db:check          # Check/seed main DB
npm run test:api          # Auto-seed + run API tests
npm run test:reshape      # Auto-seed test DB + run reshape tests
npm run test:all          # Run all tests
npm run test:coverage     # Generate coverage report
```

**Auto-Seeding:** Tests automatically seed databases if empty (main DB for API tests, test DB for reshape tests)

---

## Test Data Strategy

- **Real ESPN Data:** Atlas `/test` database stores actual ESPN API snapshots
- **In-Memory Testing:** All tests use MongoDB Memory Server (isolated, no side effects)
- **Data Seeding:** Test data is copied from Atlas `/test` to memory server at test startup
- **Isolation:** Each test run gets a fresh in-memory database, no cleanup needed
- **Auto-Populated:** Via `/api/cron/update-test-data` endpoint
- **Models:** `ESPNScoreboardTestData`, `ESPNGameSummaryTestData`, `ESPNTeamTestData`, `ESPNTeamRecordsTestData`

---

## Coverage Goals

- **API Endpoints:** Business logic and behavior tests (focus on logic that TypeScript can't validate)
- **Helper Functions:** Edge cases and transformation logic tests
- **Tiebreaker Rules:** Comprehensive Rules A-E tests
- **Threshold:** 80% minimum enforced

---

**For detailed test procedures, see [unit-tests.md](./unit-tests.md).**

