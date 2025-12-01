<!-- 54f26c7d-e2b0-465e-98a1-0a90b7d51d1c ecae63a2-1001-4dbc-9fed-07aad3a12f8e -->
# Calculate Conference Records from Game Data

## Overview

Replace ESPN Core Records API calls with local calculation of conference records from completed conference games. Calculate records during the reshape process and update teams in the database.

## Changes

### 1. Create Helper Function to Calculate Conference Records

**File:** `lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts`

**Note:** This is CFB-specific. The `conferenceGame` flag and conference record calculation structure is specific to college football. NFL uses divisions (not conferences in the same way), and other sports have different structures. The function should remain in the CFB-specific location.

Add a function `calculateConferenceRecord` that:

- Takes a teamId and array of completed conference games
- Filters to only conference games involving the team that are completed
- Calculates wins/losses from games with scores
- Returns record string in format "W-L" (e.g., "7-1")
```typescript
export const calculateConferenceRecord = (
  teamId: string,
  games: GameLean[]
): string => {
  const conferenceGames = games.filter(
    (g) => 
      g.conferenceGame === true &&
      (g.home.teamEspnId === teamId || g.away.teamEspnId === teamId) &&
      g.completed === true &&
      g.home.score !== null &&
      g.away.score !== null
  );

  let wins = 0;
  let losses = 0;

  for (const game of conferenceGames) {
    const isHome = game.home.teamEspnId === teamId;
    const teamScore = isHome ? game.home.score : game.away.score;
    const oppScore = isHome ? game.away.score : game.home.score;

    if (teamScore > oppScore) wins++;
    else losses++;
  }

  return `${wins}-${losses}`;
};
```


### 2. Update Games Endpoint to Calculate Records

**File:** `app/api/games/[sport]/[conf]/route.ts`

In the `fetchFromESPN` function, after reshaping scoreboard data and saving games:

1. **Fetch All Completed Conference Games**: Query database for all completed conference games for the same `seasonYear` that was used to fetch the scoreboard (filter by `season: seasonYear` and `completed: true`)
2. **Calculate Records for All Teams**: For each conference team, calculate their conference record using the helper function
3. **Update Team Records**: Update team records in database with calculated values (always update - MongoDB handles it efficiently)
4. **Remove ESPN API Calls**: Remove all `client.getTeamRecords()` calls (lines 359-378)

Key changes:

- After games are saved to database, fetch all completed conference games
- Loop through all conference teams and calculate their records
- Always update database with calculated records (MongoDB handles updates efficiently)
- Keep team metadata updates from scoreboard (name, logo, colors, etc.)

### 3. Update Team Metadata Construction

**File:** `app/api/games/[sport]/[conf]/route.ts`

In `queryGamesFromDatabase` function:

- When building `TeamMetadata`, use the `record.conference` from database (which is now calculated from games)
- No changes needed to the response structure - frontend continues to consume the same format

### 4. Optional: Create Dedicated Standings Endpoint

**File:** `app/api/standings/[sport]/[conf]/route.ts` (new file)

Create a lightweight endpoint that:

- Fetches all conference teams from database
- Fetches all completed conference games
- Calculates conference records for each team
- Returns team metadata with: name variations, record, conference record, rank, standing

This endpoint can be used by CurrentStandings if we want to optimize further, but frontend doesn't need to change if we update the existing games endpoint.

## Benefits

1. **Scalability**: Eliminates 16 API calls to ESPN Core Records API per request
2. **Performance**: Local calculation is faster than external API calls
3. **Reliability**: No dependency on ESPN Core Records API availability
4. **Accuracy**: Records calculated from actual game data in our database
5. **Cost**: Reduces external API usage

## Files Modified

- `lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts` - Add `calculateConferenceRecord` helper function
- `app/api/games/[sport]/[conf]/route.ts` - Replace ESPN API calls with local calculation
- `app/api/standings/[sport]/[conf]/route.ts` - New optional dedicated endpoint (if desired)

## Testing & Cleanup Phases

### Phase 1: Agent Testing

After implementing the changes:

- Run `npm run lint` to check for linting errors
- Run `npx tsc --noEmit` to check for TypeScript errors
- Run `npm run build` to ensure build succeeds
- Run `npm run test:all` to ensure all tests pass
- Verify the endpoint returns correct conference records calculated from games

### Phase 2: User Testing (PAUSE HERE)

**STOP and wait for user confirmation** before proceeding:

- User tests the functionality manually
- User verifies conference records are correct
- User confirms all is working as expected

### Phase 3: Cleanup (After User Confirmation)

Once user confirms everything works, delete all Core Records API related code, types, test data, and dependencies:

**Code Deletions:**
- Delete `getTeamRecords()` method from `lib/cfb/espn-client.ts`
- Remove `EspnTeamRecordsGenerated` import from `lib/cfb/espn-client.ts`
- Remove `coreRecordResponse` parameter entirely from `reshapeTeamData()` in `lib/reshape-teams.ts` (it's only used for Core Records API which we're removing)
- Remove all logic in `reshapeTeamData()` that uses `coreRecordResponse` (lines 17-43) - the function will fall back to `espnTeamResponse.team.record?.items` which doesn't include conference records
- Remove `recordData?: EspnTeamRecordsGenerated | null` from `TeamDataResponse` interface in `lib/types.ts`
- Remove `EspnTeamRecordsGenerated` import from `lib/types.ts`
- Update `reshapeTeamsData()` to not pass `recordData` (remove `recordData || undefined` from the call)

**Type File Deletions:**
- Delete `lib/espn/espn-team-records-generated.ts` entirely

**Test Data & Mock Deletions:**
- Delete `lib/models/test/ESPNTeamRecordsTestData.ts` model file
- Remove `loadTeamRecordsTestData()` function from `__tests__/helpers/test-data-loader.ts`
- Remove `ESPNTeamRecordsTestData` references from `checkTestDataAvailable()` in test-data-loader.ts
- Remove `getTeamRecords()` mock implementation from `__tests__/mocks/espn-client.mock.ts`
- Remove `EspnTeamRecordsGenerated` import from `__tests__/mocks/espn-client.mock.ts`
- Remove `loadTeamRecordsTestData` import from `__tests__/mocks/espn-client.mock.ts`

**Type Generation Script Cleanup:**
- Remove `teamRecords` typeSet from `scripts/extract-used-types.ts`:
  - Remove `teamRecords` from `TypeSnapshot` interface
  - Remove `teamRecords` patterns array (lines 177-191)
  - Remove `teamRecords` from `extractTypeFromGeneratedTypes()` calls
  - Remove `teamRecords` from field count logging
- Remove `teamRecords` file reference from `scripts/verify-espn-types.ts`:
  - Remove `teamRecords` from files object
  - Remove TeamRecords verification logic (lines 111-136)
- Remove `teamRecords` handling from `scripts/extract-espn-types.ts`:
  - Remove `ESPNTeamRecordsTestData` import
  - Remove TeamRecords model loading and type generation
- Remove `teamRecords` handling from `scripts/analyze-test-data.ts`:
  - Remove `ESPNTeamRecordsTestData` import
  - Remove TeamRecords model analysis

**Type Snapshot Cleanup:**
- Remove `teamRecords` entry from `lib/espn/used-types-snapshot.json`

**Documentation Updates:**
- Remove references to Core Records API from `docs/ai-guide.md`
- Remove references to `getTeamRecords()` from `docs/ai-guide.md`
- Remove references to `ESPNTeamRecordsTestData` from testing docs
- Update `docs/tests/espn-api-testing.md` to remove Core Records API section
- Update `docs/tests/espn-testing-quick-ref.md` to remove Core Records API references
- Update any other docs that mention Core Records API or team records

### Phase 4: Documentation Analysis & Update (Start Fresh)

After cleanup is complete, start fresh with documentation analysis:

- Analyze current documentation structure
- Update API documentation to reflect record calculation from games
- Update guides that mention Core Records API
- Update any architecture diagrams or data flow documentation
- Ensure all docs accurately reflect the new implementation

### To-dos

**Implementation:**
- [ ] Create calculateConferenceRecord helper function in tiebreaker-helpers.ts
- [ ] Update fetchFromESPN to fetch all completed conference games after saving scoreboard data
- [ ] Calculate conference records for all teams using the helper function
- [ ] Update team records in database with calculated values (always update)
- [ ] Remove all client.getTeamRecords() API calls from the update loop
- [ ] Create optional dedicated /api/standings/[sport]/[conf] endpoint

**Cleanup (After User Confirmation):**
- [ ] Delete getTeamRecords() method from lib/cfb/espn-client.ts
- [ ] Remove coreRecordResponse parameter entirely from reshapeTeamData() and update reshapeTeamsData()
- [ ] Delete lib/espn/espn-team-records-generated.ts
- [ ] Delete lib/models/test/ESPNTeamRecordsTestData.ts
- [ ] Remove teamRecords test data loading and mocks
- [ ] Remove teamRecords from type generation scripts
- [ ] Remove teamRecords from used-types-snapshot.json
- [ ] Update documentation to remove Core Records API references

