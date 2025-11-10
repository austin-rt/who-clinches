# test-api

## Objective

Test both preview (develop) and production (main) deployments by executing all testing procedures from `docs/TESTING.md`.

## Instructions

1. Read `docs/TESTING.md`
2. Test preview deployment first (develop branch)
   - Base URL: `https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/`
   - Expected database: `preview`
3. Test production deployment second (main branch)
   - Base URL: `https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/`
   - Expected database: `production`
4. For each deployment:
   - Execute all API endpoint tests using `run_terminal_cmd`
   - Verify database state with mongosh queries
   - Compare responses against expected results
5. Report results for both environments in structured format
