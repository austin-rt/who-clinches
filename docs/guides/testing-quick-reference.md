# Testing Quick Reference

Quick commands and environment setup.

## Common Commands

```bash
# Run all API tests
npm run test:api

# Run reshape unit tests
npm run test:reshape

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- __tests__/api/cfb/games.test.ts

# Run all tests
npm run test

# Run all tests (alias)
npm run test:all
```

## Environment Files

- **`.env.local`** - Local dev (default): `CFBD_API_KEY` (comma-separated for preprod rotation), `VERCEL_AUTOMATION_BYPASS_SECRET` (for protected Vercel deployments)
- **`.env.preview`** - Preview/staging environment variables
- **`.env.production`** - Production environment variables

**Usage:**

- Bypass token (`VERCEL_AUTOMATION_BYPASS_SECRET`) auto-handled by Jest tests
- Manual curl requires explicit bypass token (see Preview Deployment Testing section below)
- All tests use mocks - no external API calls or database required

---

## Test Structure

- `__tests__/api/cfb/` - API endpoint tests (predicted scores)
- `__tests__/api/cfb/sec/tiebreaker-rules/` - SEC-specific rule tests (rule-e scoring margin, integration tests)
- `__tests__/api/cfb/tiebreaker-rules/common/` - Common tiebreaker rule tests (rules A-E, divisional, overall win pct, total wins)
- `__tests__/lib/cfb/helpers/` - Helper unit tests (default season, preprod key rotation)
- `__tests__/setup.ts` - Test setup (dotenv, BASE_URL)
- `__tests__/mocks/` - Mock data for CFBD API responses (cfbd-rest-client mock)

---

## Test Coverage

- API endpoints: Business logic and behavior tests (simulate, multi-conference support)
- Reshape functions: Edge cases and transformation logic
- Tiebreaker rules: Comprehensive rule tests including async rules (e.g., SP+ and FPI fetching for MWC)
- **Coverage threshold:** 80% minimum (branches, functions, lines, statements)
- **What's tested:** Business logic, edge cases, error handling, API contracts, data integrity, async tiebreaker rules

---

## Test Data

**Mock Data** - All tests use mocks based on CFBD TypeScript types.

**Test Data Source:**

- `__tests__/mocks/cfbd-rest-client.ts` - Mock CFBD API responses
- Uses `Partial<>` types for flexible test overrides
- No external API calls during tests

**Benefits:** Fast execution, no external dependencies, complete isolation.

---

## Troubleshooting

- **Tests hanging**: Check logs for teardown issues. `forceExit: true` in Jest config prevents hanging
- **Timeouts**: Test timeout is 120s per test
- **Empty coverage**: Run `npm run test:coverage`, open `coverage/index.html`

---

## Preview Deployment Testing

The preview deployment at `preview.whoclinches.com` has Vercel Protection enabled. API-only testing works with a query parameter, but browser testing requires a cookie. The bypass token is stored in `.env.local` as `VERCEL_AUTOMATION_BYPASS_SECRET`.

### API testing (curl)

Append the bypass token as a query parameter:

```bash
curl -s "https://preview.whoclinches.com/api/games/cfb/sec?x-vercel-protection-bypass=$VERCEL_AUTOMATION_BYPASS_SECRET"
```

### Browser testing (Playwright MCP)

The repo includes `.mcp.json` which configures Playwright MCP to inject the bypass header via `.playwright-mcp-config.json`. This automatically sets `x-vercel-protection-bypass` on all browser requests.

For manual Playwright sessions without the MCP config, inject the header before navigating:

```js
await page.setExtraHTTPHeaders({
  'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
});
```

**Note:** Cookie-based and query-parameter-based bypass approaches do not reliably work for browser testing because Vercel redirects server-side before checking cookies/params, causing sub-resource (CSS, JS, font) requests to fail with 401.

### POST endpoints

POST endpoints (e.g., simulate) require both the bypass token and a same-origin header:

```bash
curl -s "https://preview.whoclinches.com/api/simulate/cfb/sec?x-vercel-protection-bypass=$VERCEL_AUTOMATION_BYPASS_SECRET" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://preview.whoclinches.com" \
  -d '{"season":2026,"games":[],"teams":[],"overrides":{}}'
```
