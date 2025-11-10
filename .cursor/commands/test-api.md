# test-api

## Objective

Test the ESPN data pipeline (ingestion, transformation, persistence, retrieval) for deployed environments by executing procedures from `docs/tests/api/espn-data-pipeline.md`.

## Instructions

1. Read `docs/tests/api/espn-data-pipeline.md`
2. Determine target environment from user input:
   - "test preview", "test develop", or "test dev" → Preview deployment (`preview` database)
   - "test prod" or "test production" → Production deployment (`production` database)
3. Replace `{BASE_URL}` and `{DATABASE}` in all commands based on environment
4. Execute all API endpoint tests using `run_terminal_cmd`
5. Verify database state with mongosh queries
6. Report results in structured format with pass/fail for each check
