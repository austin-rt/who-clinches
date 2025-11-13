# Test Data Snapshots

## Overview

Instead of using static mock data in unit tests, we store real ESPN API response snapshots in the database. These snapshots are updated daily via cron job to ensure tests always use current API format.

## Architecture

### Database Models

**Location:** `lib/models/test/`

Separate models for each ESPN API response type, stored in dedicated `/test` database:

- `ESPNScoreboardTestData.ts` - ESPNScoreboardResponse (one week's games)
- `ESPNGameSummaryTestData.ts` - ESPNGameSummaryResponse (one game's detailed data)
- `ESPNTeamTestData.ts` - ESPNTeamResponse (one team's metadata)
- `ESPNTeamRecordsTestData.ts` - ESPNCoreRecordResponse (one team's records)

Each model:

- Uses dedicated test database connection (`lib/mongodb-test.ts`)
- Hardcoded to `/test` database
- Unique constraint: one snapshot per `season` ensures we always have exactly one example of each type
- Type-safe: each model enforces the correct response type

### Cron Job

**File:** `app/api/cron/update-test-data/route.ts`

**Pro Tier:** Runs daily at low traffic time (e.g., 3 AM ET)

- Schedule: `0 7 * * *` (7 AM UTC = 3 AM ET)
- Pulls one example of each response type
- Updates database with latest API format

**Hobby Tier:** Runs as part of `update-all` batch cron job (daily)

- Integrated into `/api/cron/update-all` endpoint
- Pulls test data after other updates complete
- Runs daily at 4 AM ET (9 AM UTC) - ensures test data stays current

### Test Helper

**File:** `__tests__/helpers/test-data-loader.ts`

Provides functions to load test data from test database:

- `loadScoreboardTestData()` - Returns ESPNScoreboardResponse
- `loadGameSummaryTestData()` - Returns ESPNGameSummaryResponse
- `loadTeamTestData()` - Returns ESPNTeamResponse
- `loadTeamRecordsTestData()` - Returns ESPNCoreRecordResponse
- `checkTestDataAvailable()` - Verifies all types are available

## Usage in Tests

### Before (Static Mocks)

```typescript
const mockTeamResponse: ESPNTeamResponse = {
  team: {
    id: '25',
    name: 'Alabama Crimson Tide',
    // ... static mock data
  },
};
```

### After (Real Test Data from Test Database)

```typescript
import { loadTeamTestData, loadTeamRecordsTestData } from '../helpers/test-data-loader';

describe('reshapeTeamData', () => {
  let teamResponse: ESPNTeamResponse;
  let recordResponse: ESPNCoreRecordResponse;

  beforeAll(async () => {
    // Loads from /test database, populated by daily cron job
    teamResponse = await loadTeamTestData();
    recordResponse = await loadTeamRecordsTestData();
  });

  it('transforms ESPN team response to internal format', () => {
    const result = reshapeTeamData(teamResponse, recordResponse);
    // Test with real data from ESPN API...
  });
});
```

## Benefits

1. **Real API Format** - Tests use actual ESPN API responses, not approximations
2. **Automatic Updates** - Daily cron job ensures tests stay current with API changes
3. **No Mock Maintenance** - Don't need to manually update mocks when API changes
4. **Catches API Changes** - Tests will fail if ESPN changes their format
5. **Consistent** - All tests use the same real data snapshot

## Setup

1. **Initial Population:**

   ```bash
   # Call the cron endpoint once to populate initial test data
   curl -X GET "http://localhost:3000/api/cron/update-test-data" \
     -H "Authorization: Bearer ${CRON_SECRET}"
   ```

2. **Vercel Cron (Pro Tier):**

   ```json
   {
     "crons": [
       {
         "path": "/api/cron/update-test-data",
         "schedule": "0 7 * * *"
       }
     ]
   }
   ```

3. **Hobby Tier Integration:**
   Add test data pull to existing batch pull endpoint after main data operations complete.

## Migration Plan

1. ✅ Create ESPNTestData model
2. ✅ Create cron endpoint to pull test data
3. ✅ Create test helper functions
4. ⏳ Update reshape-games.test.ts to use real data
5. Update reshape-teams.test.ts to use real data
6. ⏳ Remove static mock data files
7. ⏳ Add cron schedule to vercel.json (Pro tier)
8. ⏳ Integrate into batch pull (Hobby tier)
