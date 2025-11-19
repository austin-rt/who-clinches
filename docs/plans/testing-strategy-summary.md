# Testing Strategy Summary

**Goal:** 100% code coverage for API routes and helper functions with automated testing.

**Full Document:** See [unit-tests.md](./unit-tests.md) for complete test plan.

---

## Test Framework

- **Framework:** Jest (Next.js standard)
- **Database:** Real ESPN API data in `/test` database (auto-seeded)
- **Coverage Threshold:** 80% minimum (branches, functions, lines, statements)

---

## Test Categories

### 1. API Routes (100% coverage target)

| Endpoint | Test Focus | File |
|----------|------------|------|
| `GET /api/games` | Filtering, cache headers, structure | `__tests__/api/games.test.ts` |
| `POST /api/simulate` | Overrides, tiebreakers, validation | `__tests__/api/simulate.test.ts` |
| `POST /api/pull-teams` | Team ingestion, validation | `__tests__/api/pull-teams.test.ts` |
| `POST /api/pull-games` | Game ingestion, validation | `__tests__/api/pull-games.test.ts` |
| Cron endpoints | Auth, accessibility | `__tests__/api/cron.test.ts` |

**Key Tests:** Structure validation, error handling, edge cases, cache headers

### 2. Helper Functions (100% coverage target)

- **Reshape Functions** (`lib/reshape-*.ts`) - Data transformation
- **Tiebreaker Functions** (`lib/tiebreaker-helpers.ts`) - Rules A-E
- **Calculation Functions** - Record calculations, win percentages

**Key Tests:** Transform accuracy, null handling, type casting

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

- **Real ESPN Data:** Test database stores actual ESPN API snapshots
- **Separate Databases:** `/dev` (main), `/test` (reshape tests)
- **Auto-Populated:** Via `/api/cron/update-test-data` endpoint
- **Models:** `ESPNScoreboardTestData`, `ESPNGameSummaryTestData`, `ESPNTeamTestData`, `ESPNTeamRecordsTestData`

---

## Coverage Goals

- **API Endpoints:** 100% coverage (60+ tests)
- **Helper Functions:** 100% coverage (~30 tests)
- **Total:** ~90 tests, 300+ assertions
- **Threshold:** 80% minimum enforced

---

**For detailed test procedures, see [unit-tests.md](./unit-tests.md).**

