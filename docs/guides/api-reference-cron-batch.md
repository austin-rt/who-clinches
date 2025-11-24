# API Reference: Cron Jobs - Batch & Testing

Reference for batch orchestration and testing cron endpoints.

**Related:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md) | [Data Update Jobs](./api-reference-cron-data.md)

---

**Authentication:** All cron jobs require `Authorization: Bearer {CRON_SECRET}`. See [Cron Jobs API Reference](./api-reference-cron.md) for details.

---

## GET /api/cron/update-all

**Hobby Plan Only**: Batch endpoint that orchestrates multiple cron jobs in a single call.

**Schedule:** Hobby: Daily 10PM ET (`0 2 * * *` UTC). Pro: Not used (individual jobs run separately).

**Response:**

```json
{
  "success": true,
  "jobsRun": 4,
  "jobsSucceeded": 4,
  "totalDuration": 15000,
  "results": [
    {
      "job": "pull-teams",
      "success": true,
      "status": 200,
      "duration": 200
    }
  ],
  "lastUpdated": "2025-11-13T04:00:00.000Z"
}
```

**Response Fields:** `success`, `jobsRun`, `jobsSucceeded`, `totalDuration`, `results[]`, `lastUpdated`

**Jobs Executed:** For each supported sport/conf combination: pull-teams, pull-games (season), update-rankings, update-spreads, update-team-averages, update-test-data

**Error Handling:** Failed jobs in `results` with `success: false`. Returns 200 if all succeed, 207 if some fail.

---

## GET /api/cron/update-test-data

Updates test data snapshots from ESPN API for unit testing.

**Schedule:** Hobby: via `update-all` daily 10PM ET (`0 2 * * *` UTC). Pro: Not scheduled (can be called manually).

**Response:**

```json
{
  "updated": 4,
  "total": 4,
  "results": [
    {
      "type": "scoreboard",
      "success": true
    }
  ],
  "lastUpdated": "2025-11-13T04:00:00.000Z",
  "testsTriggered": true
}
```

**Response Fields:** `updated`, `total` (4), `results[]`, `lastUpdated`, `testsTriggered`

**Test Data Types:** scoreboard (week 1, season 2025), gameSummary, team, teamRecords

**Logic:** Connects to test database, pulls example data from ESPN, stores snapshots. Auto-triggers `run-reshape-tests` on success (non-blocking).

**Notes:** For unit testing reshape functions. Test data in separate database.

---

## GET /api/cron/run-reshape-tests

Runs reshape function tests against test data snapshots. Called automatically by `update-test-data` after successful data updates.

**Schedule:** Not scheduled directly. Auto-triggered by `update-test-data` after successful updates. Can be called manually.

**Response Examples:**

Success: `{ "success": true, "passed": 2, "failed": 0, "total": 2, "duration": 150, "results": [...], "message": "All reshape tests passed" }`

Failure: `{ "success": false, "passed": 1, "failed": 1, "total": 2, "message": "RESHAPE_TEST_FAILURE | FAILED_TESTS:1 | ..." }`

Missing Data: `{ "success": false, "error": "TEST_DATA_MISSING", "missing": ["scoreboard", "team"], "message": "Test data not available" }`

**Response Fields:** `success`, `passed`, `failed`, `total` (2), `duration`, `results[]`, `message`

**Tests:** reshapeScoreboardData, reshapeTeamData

**Logic:** Connects to test database, verifies test data, runs reshape functions, validates output. Returns 200 if all pass, 500 if any fail.

**Error Handling:** Missing test data returns 500 with `TEST_DATA_MISSING`. Reshape failures logged to ErrorLog. Non-blocking.

**Notes:** Internal endpoint (called by update-test-data). Failures indicate ESPN API format may have changed.

---

**See also:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md) | [Data Update Jobs](./api-reference-cron-data.md)

