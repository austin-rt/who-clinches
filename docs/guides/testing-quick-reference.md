# Testing Quick Reference

Quick commands and environment setup.

## Common Commands

```bash
# Run all unit/integration tests
npm run test

# Run all tests (alias)
npm run test:all

# Run e2e tests (Playwright, builds + starts server on port 3002)
npm run test:e2e

# Run API tests only
npm run test:api

# Run reshape unit tests
npm run test:reshape

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- __tests__/api/cfb/games-enrichment.test.ts
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

**Unit / Integration (Jest):**

- `__tests__/api/cfb/` - API endpoint tests (predicted scores, games enrichment, override normalization)
- `__tests__/api/cfb/sec/tiebreaker-rules/` - SEC-specific rule tests (rule-e scoring margin)
- `__tests__/api/cfb/tiebreaker-rules/common/` - Common tiebreaker rule tests (rules A-E, divisional, overall win pct, total wins)
- `__tests__/api/cfb/tiebreaker-rules/integration/` - Per-conference integration tests (all 10 conferences)
- `__tests__/app/components/` - Component tests (Score)
- `__tests__/lib/api/` - API utility tests (same-origin gate)
- `__tests__/lib/cfb/helpers/` - Helper unit tests (default season, preprod key rotation, attach-sor, attach-sp-plus, turnover margin, revalidate timing)
- `__tests__/lib/cfb/tiebreaker-rules/` - Core tiebreaker engine tests (breakTie, calculateStandings, core-helpers)
- `__tests__/lib/` - Shared utility tests (reshape-games, getDefaultPick)
- `__tests__/setup.ts` - Test setup (dotenv, BASE_URL)
- `__tests__/mocks/` - Mock data for CFBD API responses (cfbd-rest-client mock)

**E2E (Playwright):**

- `e2e/simulate-happy-path.spec.ts` - Simulate SEC standings and verify results render
- `e2e/share-round-trip.spec.ts` - Share URL renders saved simulation results
- `e2e/reset-flow.spec.ts` - Reset clears simulation results and picks
- `e2e/error-states.spec.ts` - Invalid conference/sport shows error page

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
