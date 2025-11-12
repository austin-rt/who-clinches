# Automated Cron Jobs Implementation Plan

> **⚠️ PLANNING DOCUMENT - IMPLEMENTATION MAY DIFFER**
> This document was created during planning phase. For actual implementation details, refer to:
> - Actual code in `/app/api/cron/` endpoints
> - `/docs/api-reference.md` for current API documentation
> - `/vercel.json` and `/vercel.pro.json` for actual cron schedules

## Overview
Implement smart, efficient Vercel Cron jobs that minimize ESPN API calls while maintaining data accuracy. Priority: only fetch data when needed, only for active/changed entities.

## Vercel Pro Plan Constraints
- **Function timeout**: 60 seconds maximum
- **Cron jobs**: Up to 40 cron jobs
- **Invocations**: Unlimited
- **Cron frequency**: Every 1 minute minimum
- **Strategy**: Fast DB queries, minimal ESPN calls, early exits for efficiency

## Design Principles
1. Query DB first to determine what needs updating
2. Only call ESPN API for active games or changed data
3. Early exit if no updates needed (0 ESPN calls when no active games)
4. Batch updates when possible
5. Use game state (`pre`, `in`, `post`) to avoid unnecessary calls
6. Keep execution time efficient (well under 60s Vercel Pro limit)

## ESPN API Endpoints Reference

### Site API (`site.api.espn.com`)
**Purpose:** Consumer-facing data (what you see on ESPN.com)

**Endpoints we use:**
- `/scoreboard` - Game scores, states, basic team info
- `/teams/{abbrev}` - Team metadata, rankings, standings

**Data provided:**
- Team metadata (name, logo, colors) - STATIC
- National rankings (`team.rank`)
- Conference standings (`team.standingSummary`)
- Overall record only (no conference/home/away breakdown)
- Live game scores and states
- Next game ID

**When to use:** Initial team setup, rankings updates, live game tracking

### Core API (`sports.core.api.espn.com`)
**Purpose:** Detailed statistical data

**Endpoints we use:**
- `/v2/.../teams/{id}/record` - Detailed record breakdowns

**Data provided:**
- Detailed records: overall, conference, home, away
- Detailed stats (points for/against, win %, point differential, etc.)
- NO rankings
- NO standings

**When to use:** Only when we need detailed record breakdowns (conference/home/away)

### Our Usage Strategy

1. **Initial Setup (one-time):** Site API for team metadata + Core API for detailed records
2. **Live Games:** Scoreboard API only - has everything (scores, states, rankings)
3. **Rankings Updates:** Site API only - has rankings and standings
4. **Detailed Records:** Core API only when needed - provides conference/home/away breakdowns

**Key Insight:** Scoreboard API includes team records and rankings, so post-game updates don't need separate team API calls.

## Implementation Plan

### 1. Document ESPN API Endpoint Strategy
**File:** `docs/ESPN_API_GUIDE.md` (new file)

Create comprehensive documentation explaining ESPN's different API endpoints and our usage strategy:

**Content:**
- Distinction between Site API vs Core API vs Scoreboard API
- What data each provides
- Why we use each endpoint
- When to call each endpoint
- Data dependencies and overlaps
- Optimization strategies (e.g., Scoreboard includes rankings, so no need for separate team calls post-game)

**Key sections:**
1. Site API (`site.api.espn.com`) - Consumer-facing data
2. Core API (`sports.core.api.espn.com`) - Detailed statistics
3. Scoreboard API - Live games and included team data
4. Our cron job strategy and why it minimizes API calls
5. Data flow diagrams showing which endpoint provides which data

This documentation will serve as reference for future development and explain the rationale behind our cron job design.

### 2. Add Cron Schedule Constants (OPTIONAL)
**File:** `lib/constants.ts`

Optionally add scheduling constants for reference:

```typescript
export const CRON_SCHEDULES = {
  LIVE_GAMES_INTERVAL: '5 minutes',
  LIVE_GAMES_DAYS: 'Thursday-Saturday',
  LIVE_GAMES_HOURS_ET: 'Thu/Fri 5PM-1AM, Sat 12PM-1AM',
  RANKINGS_UPDATE_DAY: 'Tuesday',
  RANKINGS_UPDATE_TIME_ET: '10:00 PM',
  SEASON_START: '08-15', // Aug 15
  SEASON_END: '12-15'    // Dec 15
} as const;
```

**Note:** This is optional - cron schedules are defined in `vercel.json`.

### 3. Create Live Game Updates Cron Endpoint
**File:** `app/api/cron/update-live-games/route.ts` (TO BE CREATED)

**Schedule:** Every 5 minutes during game windows:
- **Thursday:** 5 PM ET → 1 AM Friday ET
- **Friday:** 5 PM ET → 1 AM Saturday ET  
- **Saturday:** 12 PM ET → 1 AM Sunday ET
- **Season:** August 15 - December 15

**Logic:**
```typescript
// 1. Connect to database
await dbConnect();

// 2. Query DB for incomplete games (games that need checking)
const games = await Game.find({
  season: 2025,
  conferenceGame: true,
  completed: false
}).lean();

// 3. Early exit if all games are completed (no ESPN calls!)
if (games.length === 0) {
  return NextResponse.json({ 
    updated: 0,
    gamesChecked: 0,
    activeGames: 0,
    espnCalls: 0,
    lastUpdated: new Date().toISOString()
  });
}

// 4. Get week number from first game (all games should be in same week)
const currentWeek = games[0].week;
const currentSeason = 2025; // Hardcoded for now

// Validate week number exists
if (currentWeek === null) {
  await ErrorLog.create({
    timestamp: new Date(),
    endpoint: '/api/cron/update-live-games',
    payload: { season: currentSeason },
    error: 'Games in database missing week number',
    stackTrace: ''
  });
  
  return NextResponse.json({ 
    updated: 0,
    gamesChecked: 0,
    activeGames: games.length,
    espnCalls: 0,
    lastUpdated: new Date().toISOString()
  });
}

// 5. Fetch scoreboard from ESPN (one call for entire week)
let espnResponse;
try {
  espnResponse = await espnClient.getScoreboard({
    groups: SEC_CONFERENCE_ID, // 8
    season: currentSeason,
    week: currentWeek
  });
} catch (error) {
  // Log error and return, will retry in 5 minutes
  await ErrorLog.create({
    timestamp: new Date(),
    endpoint: '/api/cron/update-live-games',
    payload: { season: currentSeason, week: currentWeek },
    error: error instanceof Error ? error.message : String(error),
    stackTrace: error instanceof Error ? error.stack || '' : ''
  });
  
  return NextResponse.json({ 
    updated: 0,
    gamesChecked: 0,
    activeGames: games.length,
    espnCalls: 0,
    lastUpdated: new Date().toISOString(),
    errors: [error instanceof Error ? error.message : String(error)]
  });
}

// 6. Reshape ESPN response
const result = reshapeScoreboardData(espnResponse, 'football', 'college-football');
const reshapedGames = result.games || [];

// 7. Update each game with new data from ESPN
let updateCount = 0;
const gameIds = new Set(games.map(g => g.espnId));
const gamesToUpdate = reshapedGames.filter(game => gameIds.has(game.espnId));

for (const reshapedGame of gamesToUpdate) {
  const currentGame = games.find(g => g.espnId === reshapedGame.espnId);
  
  // Check if anything changed
  if (reshapedGame.state !== currentGame.state || 
      reshapedGame.completed !== currentGame.completed ||
      reshapedGame.home.score !== currentGame.home.score ||
      reshapedGame.away.score !== currentGame.away.score ||
      reshapedGame.home.rank !== currentGame.home.rank ||
      reshapedGame.away.rank !== currentGame.away.rank) {
    
    // Update only game fields (not team display fields like displayName, logo, color)
    await Game.updateOne(
      { espnId: reshapedGame.espnId }, 
      { 
        $set: {
          state: reshapedGame.state,
          completed: reshapedGame.completed,
          'home.score': reshapedGame.home.score,
          'home.rank': reshapedGame.home.rank,
          'away.score': reshapedGame.away.score,
          'away.rank': reshapedGame.away.rank,
          lastUpdated: new Date()
        }
      }
    );
    updateCount++;
  }
}

return NextResponse.json({
  updated: updateCount,
  gamesChecked: gamesToUpdate.length,
  activeGames: games.length,
  espnCalls: 1,
  lastUpdated: new Date().toISOString()
});
```

**ESPN API calls:** 1 per 5-min interval when games are not completed (fetches entire week scoreboard once)
**Execution time:** <5s typical (DB query + 1 ESPN call + batch updates, well under 60s Pro limit)
**Error handling:** ESPN API failures are logged and cron returns gracefully, will retry in 5 minutes

### 4. ~~Create Post-Game Team Updates Cron Endpoint~~ [REMOVED]
**OPTIMIZATION:** This endpoint is not needed. The live games cron already updates all game data including final scores, and rankings are updated separately on Tuesdays. No implementation needed.

### 5. Create Weekly Rankings Update Cron Endpoint
**File:** `app/api/cron/update-rankings/route.ts` (TO BE CREATED)

**Schedule:** Tuesday 10:00 PM ET (after AP Poll/CFP rankings release)
**Active:** August 15 - December 15 only

**Logic:**
```typescript
// 1. Connect to database
await dbConnect();

// 2. Check if in season
const now = new Date();
const year = now.getFullYear();
const seasonStart = new Date(`${year}-08-15`);
const seasonEnd = new Date(`${year}-12-15`);

if (now < seasonStart || now > seasonEnd) {
  return NextResponse.json({ 
    message: 'Out of season', 
    updated: 0,
    espnCalls: 0,
    lastUpdated: new Date().toISOString()
  });
}

// 3. Update rankings and standings for all 16 SEC teams
// Site API provides: nationalRanking, conferenceStanding
// ESPN doesn't have a rankings-only endpoint, so we must call team endpoint

const failedTeams = [];

for (const teamAbbrev of SEC_TEAMS) {
  try {
    const teamData = await espnClient.getTeam(teamAbbrev);
    
    // Extract only ranking fields (no full team reshape)
    const nationalRanking = teamData.team.rank && teamData.team.rank !== 99 
      ? teamData.team.rank 
      : null;
    const conferenceStanding = teamData.team.standingSummary;
    
    // Update only ranking-related fields
    await Team.updateOne(
      { _id: teamData.team.id }, 
      { 
        $set: {
          nationalRanking,
          conferenceStanding,
          lastUpdated: new Date()
        }
      }
    );
    
    // Rate limit between calls
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    // Log error and track failed team for retry
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: '/api/cron/update-rankings',
      payload: { team: teamAbbrev },
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack || '' : ''
    });
    failedTeams.push(teamAbbrev);
  }
}

// 4. Retry failed teams once (after 5 second delay)
if (failedTeams.length > 0) {
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  for (const teamAbbrev of failedTeams) {
    try {
      const teamData = await espnClient.getTeam(teamAbbrev);
      
      const nationalRanking = teamData.team.rank && teamData.team.rank !== 99 
        ? teamData.team.rank 
        : null;
      const conferenceStanding = teamData.team.standingSummary;
      
      await Team.updateOne(
        { _id: teamData.team.id }, 
        { 
          $set: {
            nationalRanking,
            conferenceStanding,
            lastUpdated: new Date()
          }
        }
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      // Log retry failure - will be handled by next week's cron
      await ErrorLog.create({
        timestamp: new Date(),
        endpoint: '/api/cron/update-rankings',
        payload: { team: teamAbbrev, retry: true },
        error: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack || '' : ''
      });
    }
  }
}

return NextResponse.json({
  updated: SEC_TEAMS.length,
  teamsChecked: SEC_TEAMS.length,
  espnCalls: SEC_TEAMS.length + failedTeams.length, // Original attempts + retries
  lastUpdated: new Date().toISOString(),
  errors: failedTeams.length > 0 ? failedTeams : undefined
});
```

**ESPN API calls:** 16 per week (Site API only), plus retries for any failures
**Execution time:** ~9s base + retries (16 teams × 500ms + API latency, well under 60s Pro limit)
**Error handling:** Failed team API calls are logged and retried once after 5 seconds, then skipped until next week

### 6. Create Vercel Cron Configuration
**File:** `vercel.json` (TO BE CREATED OR UPDATED)

```json
{
  "crons": [
    {
      "path": "/api/cron/update-live-games",
      "schedule": "*/5 21-23,0-6 * * 4-5"
    },
    {
      "path": "/api/cron/update-live-games",
      "schedule": "*/5 16-23,0-6 * * 6"
    },
    {
      "path": "/api/cron/update-rankings",
      "schedule": "0 3 * * 3"
    }
  ]
}
```

**Schedule breakdown (all times UTC, converted from ET):**

**Live Games (3 separate schedules):**
- **Thu-Fri:** `*/5 21-23,0-6 * * 4-5`
  - Every 5 minutes, 5 PM ET Thursday → 1 AM ET Saturday
  - 21:00 UTC - 06:59 UTC (covers both EDT and EST)
  
- **Saturday:** `*/5 16-23,0-6 * * 6`
  - Every 5 minutes, 12 PM ET Saturday → 1 AM ET Sunday
  - 16:00 UTC - 06:59 UTC (covers both EDT and EST)

**Rankings:**
- **Tuesday nights:** `0 3 * * 3`
  - Tuesday 10 PM ET = Wednesday 02:00 UTC (EDT) or 03:00 UTC (EST)
  - Runs at 03:00 UTC to safely cover both EDT (11 PM) and EST (10 PM)

**Note:** Extended UTC windows cover both Daylight (EDT) and Standard (EST) time zones throughout the season (August-December).

### 7. Add Cron Secret Authentication
All cron endpoints must verify request authenticity using Vercel's recommended authentication method:

```typescript
// Check Vercel cron secret or authorization header
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Environment variable needed:** `CRON_SECRET`
- Set in `.env.local` for local testing
- Set in Vercel environment variables for production
- Generate secure random string and store in environment configuration

### 8. Update Response Types
**File:** `lib/api-types.ts`

Add cron-specific response types:

```typescript
export interface CronLiveGamesResponse {
  updated: number;
  gamesChecked: number;
  activeGames: number;
  espnCalls: number;
  lastUpdated: string;
  errors?: string[];
}

export interface CronRankingsResponse {
  updated: number;
  teamsChecked: number;
  espnCalls: number;
  lastUpdated: string;
  errors?: string[];
}

export interface CronHealthCheckResponse {
  endpoint: string;
  lastRun: string | null;
  status: 'healthy' | 'warning' | 'error';
  executionTime?: number;
  details?: string;
}
```

### 9. Create Cron Health Check Endpoint (OPTIONAL)
**File:** `app/api/cron/health/route.ts` (TO BE CREATED)

**Purpose:** Monitor cron job execution status (optional utility endpoint)

**Logic:**
```typescript
await dbConnect();

// Query ErrorLog for recent cron errors
const recentErrors = await ErrorLog.find({
  endpoint: { $regex: /^\/api\/cron\// },
  timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
}).lean();

// Query Game model for last update timestamp
const lastGameUpdate = await Game.findOne({})
  .sort({ lastUpdated: -1 })
  .select('lastUpdated')
  .lean();

// Query Team model for last ranking update
const lastTeamUpdate = await Team.findOne({})
  .sort({ lastUpdated: -1 })
  .select('lastUpdated')
  .lean();

return NextResponse.json({
  liveGames: {
    endpoint: '/api/cron/update-live-games',
    lastRun: lastGameUpdate?.lastUpdated?.toISOString() || null,
    recentErrors: recentErrors.filter(e => e.endpoint.includes('live-games')).length
  },
  rankings: {
    endpoint: '/api/cron/update-rankings',
    lastRun: lastTeamUpdate?.lastUpdated?.toISOString() || null,
    recentErrors: recentErrors.filter(e => e.endpoint.includes('rankings')).length
  }
});
```

**Note:** This endpoint is optional and can be implemented later if monitoring is needed.

### 10. Create ESPN API Documentation (OPTIONAL)
**File:** `docs/ESPN_API_GUIDE.md` (TO BE CREATED)

Optional comprehensive documentation explaining ESPN API strategy:

**Proposed sections:**
1. Site API (`site.api.espn.com`) - Consumer-facing data (team metadata, rankings, standings)
2. Core API (`sports.core.api.espn.com`) - Detailed statistics (conference/home/away records)
3. Scoreboard API - Live games and included team data (scores, states, rankings in one call)
4. Our cron job strategy and why it minimizes API calls
5. Data flow showing which endpoint provides which data
6. Examples of each API response structure

**Note:** This documentation is optional and can be created later for reference.

## ESPN API Call Minimization Strategy

### Per Week Estimates:
1. **Live Games (Thu-Sat):**
   - Cron fires: ~288 times per week
     - Thursday: 5 PM → 1 AM Friday = 8 hours × 12 invocations/hour = 96
     - Friday: 5 PM → 1 AM Saturday = 8 hours × 12 invocations/hour = 96  
     - Saturday: 12 PM → 1 AM Sunday = 13 hours × 12 invocations/hour = 156
     - Total: 96 + 96 + 156 = 348 invocations
   - Actual ESPN calls: ~100-200 (1 scoreboard call per 5-min when games not completed)
   - Many invocations are fast DB checks with 0 ESPN calls (early exit when all games completed)
   - **Execution time:** <5s per invocation (well under 60s Vercel Pro limit)

2. **Rankings Update (Tuesday):**
   - ESPN calls: 16 (Site API only, 16 SEC teams) + retries for failures
   - Runs once per week during season (Aug 15 - Dec 15)
   - **Execution time:** ~9-15s (16 teams × 500ms + retries + API latency, well under 60s limit)

**Total ESPN calls per week: ~116-216** (vs naive approach: 1,000+)

### Key Optimizations:
- Query DB for incomplete games before calling ESPN (early exit = 0 API calls when all games completed)
- Fetch entire week scoreboard once, filter in memory (not 1 call per game!)
- Only update games with `completed: false` (skip finished games)
- Use existing `reshapeScoreboardData()` function for data transformation
- Rankings update minimal fields only (not full team reshape)
- Rate limiting (500ms between team calls) prevents API throttling
- Retry logic for failed team updates (1 retry after 5 seconds)
- All operations stay well under Vercel Pro 60s timeout limit
- Error logging to DB allows graceful degradation and monitoring
- Season date check (Aug 15 - Dec 15) prevents unnecessary off-season API calls

### Vercel Pro Plan Compliance:
✅ **Timeout:** All operations well under 60s limit (live games ~5s, rankings ~9-15s)
✅ **Cron jobs:** Using 3 cron schedules (Thu-Fri, Sat, Tuesday) of 40 available
✅ **Invocations:** ~350 per week, unlimited available on Pro plan
✅ **Frequency:** Every 5 minutes (within 1-minute minimum requirement)
✅ **Early exits:** DB queries return immediately when all games completed (0 ESPN calls)
✅ **Error handling:** Failed API calls logged to ErrorLog model, cron continues gracefully
✅ **Retry logic:** Rankings cron retries failed teams once after 5 second delay

## Testing Strategy

1. **Local testing:** Manually trigger cron endpoints with `Authorization: Bearer $CRON_SECRET` header
2. **Verify early exit:** Call when all games are completed, confirm 0 ESPN calls and fast return
3. **Verify active game logic:** Call during live games, confirm `completed: false` games are updated
4. **Test error handling:** Simulate ESPN API failure, verify ErrorLog entry created
5. **Test retry logic:** Simulate team API failure in rankings cron, verify retry attempt
6. **Monitor Vercel logs:** Check execution time stays <60s and success rate after deployment
7. **Verify season dates:** Test rankings cron outside Aug 15 - Dec 15, confirm early exit

## Files To Be Created

**Required:**
- `app/api/cron/update-live-games/route.ts` - Live game updates endpoint
- `app/api/cron/update-rankings/route.ts` - Weekly rankings update endpoint  
- `vercel.json` - Vercel cron configuration

**Optional:**
- `app/api/cron/health/route.ts` - Health monitoring endpoint
- `docs/ESPN_API_GUIDE.md` - ESPN API documentation

## Implementation Notes

- All endpoints need: `dbConnect()`, auth check, error handling
- Import `espnClient` from `@/lib/espn-client`
- Import `ErrorLog` from `@/lib/models/Error` (default export: `import ErrorLog from '@/lib/models/Error'`)
- Import `SEC_CONFERENCE_ID`, `SEC_TEAMS` from `@/lib/constants`
- Season hardcoded to `2025` throughout
- Week comes from first game in DB query results (assumes games were seeded with week numbers from ESPN)
- Team display fields (displayName, logo, color) are NOT stored in Game schema, only Team schema
- `reshapeScoreboardData` returns `ReshapeResult<ReshapedGame>` with optional `games` array

## Prerequisites

Before cron jobs can run successfully:
1. **Teams must be seeded:** Run `/api/pull-teams` to seed all SEC teams in database
2. **Games must be seeded:** Run `/api/pull-games` to seed games with week numbers
3. **Environment variables:** Set `CRON_SECRET` in Vercel environment and `.env.local`

Rankings cron uses `updateOne` (not upsert), so teams must exist before it runs. If teams are missing, updates will silently affect 0 documents and be logged as failed team updates.

