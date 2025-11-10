# test-preview-api

## Objective

Test the ESPN data pipeline for the preview (develop branch) deployment.

## Environment

- **Branch**: `develop`
- **Base URL**: `https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/`
- **Database**: `preview`

## Instructions

1. Read `docs/tests/espn-data-pipeline.md`
2. Replace `{BASE_URL}` with `https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/`
3. Replace `{DATABASE}` with `preview`
4. Execute all API endpoint tests using `run_terminal_cmd`:
   - POST /api/pull-teams
   - POST /api/pull
   - GET /api/games
5. Execute all database verification queries using `run_terminal_cmd`
6. Verify all checks from the "Preview (develop branch)" checklist
7. Report results in structured format with pass/fail for each test
