# Migrate to On-Demand API Architecture

## Overview

Complete architectural shift from scheduled cron jobs to on-demand API endpoints. All endpoints that need ESPN data will fetch it, reshape it, upsert to database, and return reshaped data to the frontend. Frontend polling drives all updates. Only one scheduled workflow remains: type generation (10 PM ET daily).

## Key Architectural Principle

**Dev/prod/preview databases store reshaped data (Game, Team models), not raw ESPN responses.** Only the test database stores raw ESPN responses for type generation.

All endpoints that need ESPN data follow this pattern:
1. **Fetch** from ESPN API
2. **Reshape** data using existing reshape functions (`reshapeScoreboardData()`, `reshapeTeamData()`)
3. **Upsert** reshaped data to database (Game/Team models)
4. **Return** reshaped data to frontend

Frontend polling drives all updates. No scheduled jobs except type generation.

## Current State

### Cron Endpoints (to be removed)
- `GET /api/cron/[sport]/[conf]/update-games` - Updates game scores/states/odds
- `GET /api/cron/[sport]/[conf]/update-spreads` - Updates betting odds
- `GET /api/cron/[sport]/[conf]/update-rankings` - Updates team rankings/stats
- `GET /api/cron/[sport]/[conf]/update-team-averages` - Updates team stats
- `GET /api/cron/update-all` - Orchestrates all jobs (Hobby only)
- `GET /api/cron/update-test-data` - Updates test database snapshots
- `GET /api/cron/run-reshape-tests` - Runs reshape function tests

### Existing API Endpoints (to be updated)
- `GET /api/games/[sport]/[conf]` - Currently reads from DB only, returns data
- `POST /api/pull-games/[sport]/[conf]` - Fetches ESPN, upserts DB, returns metadata only
- `POST /api/pull-teams/[sport]/[conf]` - Fetches ESPN, upserts DB, returns metadata only

### Keep As-Is
- `POST /api/simulate/cfb/sec` - Simulation logic (no changes)
- `.github/workflows/update-espn-types.yml` - Type generation (only remaining scheduled job)

## Implementation Tasks

### 1. Update Existing Game Endpoint

**File**: `app/api/games/[sport]/[conf]/route.ts`

**Changes**:
- Add logic to fetch from ESPN scoreboard API using `createESPNClient()`
- Call `reshapeScoreboardData()` to reshape the response
- Upsert reshaped games to database (Game model - reshaped data, not raw)
- Return reshaped games data (same format as currently)
- Keep existing query parameters (season, week, state, from, to)
- Add optional `?update=live` query param for lightweight updates (scores/status only)
- Add optional `?update=spreads` query param for odds updates only

**Reference**: Look at `app/api/pull-games/[sport]/[conf]/route.ts` for ESPN fetching and upsert logic, and `app/api/cron/[sport]/[conf]/update-games/route.ts` for update patterns.

### 2. Create New Team Endpoint

**File**: `app/api/teams/[sport]/[conf]/route.ts` (new file)

**Functionality**:
- Fetch team data from ESPN using `createESPNClient()` (getTeam, getTeamRecords)
- Call `reshapeTeamData()` to reshape the response
- Upsert reshaped teams to database (Team model - reshaped data, not raw)
- Return reshaped team data
- Add optional `?update=rankings` query param for rankings/stats updates
- Add optional `?update=stats` query param for team averages updates

**Reference**: Look at `app/api/pull-teams/[sport]/[conf]/route.ts` and `app/api/cron/[sport]/[conf]/update-rankings/route.ts` for patterns.

### 3. Remove Pull Endpoints

**Files to delete**:
- `app/api/pull-games/[sport]/[conf]/route.ts` (functionality merged into GET /api/games)
- `app/api/pull-teams/[sport]/[conf]/route.ts` (replaced by GET /api/teams)

### 4. Remove All Cron Endpoints

**Directory to delete**:
- `app/api/cron/` (entire directory)

**Files to modify**:
- `vercel.json` - Remove `crons` array
- `vercel.pro.json` - Remove `crons` array (or delete file if not needed)

**Environment variables**:
- `CRON_SECRET` can be removed (endpoints are now public)

### 5. Update Frontend Polling

**File**: `app/store/apiSlice.ts`

**Changes**:
- Update RTK Query endpoints to use new GET endpoints
- Add conditional polling logic:
  - Poll `/api/games?update=live` every 5 min during game windows
  - Poll `/api/games?update=spreads` every 5 min when viewing games
  - Poll `/api/teams?update=rankings` when viewing standings
  - Only poll when games are active (not all 'post')
  - Start polling 5 min before first scheduled game (use `game.date` field)
  - Stop polling when all games are 'post'

**Conditional polling logic**:
- Check game start times from `game.date` field (includes time, ISO format)
- Check game states (`game.state` - 'pre', 'in', 'post')
- Use RTK Query `pollingInterval` with conditional skip logic

### 6. Type Generation Workflow

**File**: `.github/workflows/update-espn-types.yml`

**Status**: No changes needed - this is the only remaining scheduled workflow
- Runs daily at 10:00 PM ET
- Fetches fresh ESPN responses for test database
- Generates types and creates PR if changes detected

### 7. Update Documentation

**Files to update**:
- `docs/guides/api-reference.md` - Update endpoint documentation
- `docs/guides/api-reference-data.md` - Update data endpoint docs
- `docs/guides/api-reference-cron.md` - Note that cron endpoints are removed
- `README.md` - Update API documentation section

## Data Flow

### Current Flow (Cron-based)
```
ESPN API → Cron Endpoint → Database → Frontend (separate GET)
```

### New Flow (On-demand)
```
Frontend Poll → API Endpoint → ESPN API → Reshape → Database → Return to Frontend
```

## Important Notes

### Data Storage
- **Dev/prod/preview databases**: Store reshaped data (Game, Team models)
- **Test database**: Stores raw ESPN responses for type generation only
- Always call reshape functions before upserting to main databases

### Error Handling
- Endpoints must handle ESPN API failures gracefully
- Return partial data if possible (don't fail entire request)
- Log errors to ErrorLog model
- Consider stale-while-revalidate pattern for performance

### Performance
- Conditional polling prevents unnecessary API calls
- Only poll when users are viewing relevant pages
- Only poll during active game windows
- Use query params to control update scope (`?update=live` vs full update)

## Files Summary

### Files to Create
- `app/api/teams/[sport]/[conf]/route.ts`

### Files to Delete
- `app/api/cron/` (entire directory)
- `app/api/pull-games/[sport]/[conf]/route.ts`
- `app/api/pull-teams/[sport]/[conf]/route.ts`

### Files to Modify
- `app/api/games/[sport]/[conf]/route.ts` - Add ESPN fetch and upsert logic
- `app/store/apiSlice.ts` - Update RTK Query endpoints for new polling
- `vercel.json` - Remove crons array
- `vercel.pro.json` - Remove crons array
- Documentation files (update API references)

## Benefits

- **Simpler architecture**: No cron infrastructure to maintain
- **On-demand updates**: Data fetched only when needed
- **Reduced API calls**: Conditional polling prevents unnecessary requests
- **Better UX**: Fresh data when users are viewing
- **No Vercel limits**: No cron job restrictions
- **Fewer endpoints**: Consolidation reduces API surface area (~9 endpoints removed)

## Testing Checklist

- [ ] Game endpoint fetches from ESPN and returns data
- [ ] Game endpoint upserts reshaped data to database
- [ ] Team endpoint fetches from ESPN and returns data
- [ ] Team endpoint upserts reshaped data to database
- [ ] Query params (`?update=live`, `?update=spreads`) work correctly
- [ ] Frontend polling works with conditional logic
- [ ] Polling starts/stops based on game times and states
- [ ] Error handling works when ESPN API fails
- [ ] All cron endpoints removed
- [ ] All pull endpoints removed
- [ ] Vercel cron configs removed
- [ ] Documentation updated

## Reference Files

### Reshape Functions
- `lib/reshape-games.ts` - `reshapeScoreboardData()`
- `lib/reshape-teams.ts` - `reshapeTeamData()`
- `lib/reshape-teams-from-scoreboard.ts` - `extractTeamsFromScoreboard()`

### ESPN Client
- `lib/cfb/espn-client.ts` - `createESPNClient()`, `getScoreboard()`, `getTeam()`, `getTeamRecords()`

### Models
- `lib/models/Game.ts` - Game model (reshaped data)
- `lib/models/Team.ts` - Team model (reshaped data)

### Existing Endpoints (for reference)
- `app/api/pull-games/[sport]/[conf]/route.ts` - ESPN fetch and upsert pattern
- `app/api/pull-teams/[sport]/[conf]/route.ts` - Team fetch and upsert pattern
- `app/api/cron/[sport]/[conf]/update-games/route.ts` - Update patterns
- `app/api/cron/[sport]/[conf]/update-rankings/route.ts` - Rankings update pattern

