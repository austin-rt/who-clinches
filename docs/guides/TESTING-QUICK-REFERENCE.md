# Testing Quick Reference

## Common Commands

```bash
# Check if DB is seeded (auto-seeds if needed)
npm run db:check

# Run all API tests (auto-seeds first)
npm run test:api

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- __tests__/api/games.test.ts

# Run all tests
npm run test:all
```

---

## Test Structure

```
__tests__/
├── api/
│   ├── games.test.ts           (16 tests)
│   ├── simulate.test.ts        (21 tests)
│   ├── pull-teams.test.ts      (10 tests)
│   ├── pull-games.test.ts      (10 tests)
│   └── cron.test.ts            (3 tests)
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
| Cron endpoints       | 3     | ✅     |

**Total: 60 tests, 250+ assertions**

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

## Troubleshooting

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

- **Full Details:** [TESTING-IMPLEMENTATION-COMPLETE.md](TESTING-IMPLEMENTATION-COMPLETE.md)
- **Audit Report:** [docs/TEST-AUDIT.md](docs/TEST-AUDIT.md)
- **Fixes Applied:** [FIXES-APPLIED.md](FIXES-APPLIED.md)
- **Implementation Plan:** [docs/plans/unit-tests.md](docs/plans/unit-tests.md)

---

## Summary

✅ 60 tests covering 5 API endpoints
✅ Automatic database seeding
✅ 80% coverage threshold (enforced)
✅ Cache headers validated
✅ Error messages validated
✅ Edge cases tested
✅ Ready for development and CI/CD
