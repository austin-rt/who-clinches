# test-production-espn-pipeline

## Objective

Test the ESPN data pipeline for the production (main branch) deployment.

**CAUTION: This tests production and will modify production data.**

## Environment

- **Branch**: `main`
- **Base URL**: `https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/`
- **Database**: `production`

## Instructions

1. Read `docs/tests/espn-data-pipeline.md`
2. Replace `{BASE_URL}` with `https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/`
3. Replace `{DATABASE}` with `production`
4. Test with a single team first for /api/pull-teams before testing multiple
5. Execute all API endpoint tests using `run_terminal_cmd`:
   - POST /api/pull-teams (single team first, then multiple)
   - POST /api/pull
   - GET /api/games
6. Execute all database verification queries using `run_terminal_cmd`
7. Verify all checks from the "Production (main branch)" checklist
8. Monitor Vercel logs for 5-10 minutes after tests complete
9. Report results in structured format with pass/fail for each test

