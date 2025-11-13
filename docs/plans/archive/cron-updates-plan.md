# Cron Job Updates: Spreads & Predicted Scores

> **⚠️ PLANNING DOCUMENT - IMPLEMENTATION MAY DIFFER**
> This document was created during planning phase. For actual implementation details, refer to:
>
> - Actual code in `/app/api/cron/` endpoints
> - `/docs/api-reference.md` for current API documentation
> - `/lib/constants.ts` for actual constant definitions

## Overview

Enhance existing cron jobs to update game spreads and calculate `predictedScore` fields for all games. Spreads move throughout the week, so daily updates are needed to keep prefill suggestions accurate.

## Vercel Plan Constraints

Per [Vercel Cron Documentation](https://vercel.com/docs/cron-jobs/usage-and-pricing#hobby-scheduling-limits):

**Hobby Plan:**

- **2 cron jobs max** per account
- **Once per day** scheduling only
- **Imprecise timing**: Cron set for `0 1 * * *` will trigger anywhere between 1:00 AM - 1:59 AM

**Pro Plan:**

- **40 cron jobs** per account
- **Unlimited invocations** (any frequency)
- **Precise timing**

**Strategy:** Design separate config files for Hobby vs Pro, no code changes needed to upgrade.

## Current State

**Existing Crons:**

- `update-live-games`: Updates scores/ranks during game windows (Thu-Sat)
- `update-rankings`: Updates team rankings/standings weekly (Tuesday night)

**Problem:**

- Spreads not being updated after initial game seed
- No `predictedScore` field calculated for frontend prefills
- Live games cron only runs during game windows, misses mid-week spread changes

## Goals

1. Update spreads daily from ESPN scoreboard data
2. Calculate and store `predictedScore` for all games:
   - Use real scores if available (completed or live games)
   - Calculate from spread + team averages if no scores yet (pre-state games)
3. Run within Hobby mode constraints (2 crons, daily)
4. Easy upgrade path to Pro mode (more frequent, granular crons)

## 1. Update Game Model (Prerequisite)

**File:** `/Users/austin/code/github/sec-tiebreaker/lib/models/Game.ts`

Ensure `predictedScore` field exists:

```typescript
export interface IGame extends Document {
  // ... existing fields
  predictedScore?: {
    home: number;
    away: number;
  };
  // ... rest
}
```

Add to schema:

```typescript
predictedScore: {
  home: { type: Number },
  away: { type: Number },
},
```

## 2. Create Prefill Calculation Helper

**File:** `/Users/austin/code/github/sec-tiebreaker/lib/prefill-helpers.ts`

```typescript
import { ReshapedGame } from './types';
import { ITeam } from './models/Team';

export const calculatePredictedScore = (
  game: ReshapedGame,
  homeTeam: ITeam,
  awayTeam: ITeam
): { home: number; away: number } => {
  // If real scores exist, use them
  if (game.home.score !== null && game.away.score !== null) {
    return {
      home: game.home.score,
      away: game.away.score,
    };
  }

  // Calculate from spread + ESPN team averages
  const homeAvg = homeTeam.record?.stats?.avgPointsFor ?? 28;
  const awayAvg = awayTeam.record?.stats?.avgPointsFor ?? 28;

  // Priority 1: Use spread if available
  if (game.odds.spread !== null && game.odds.favoriteTeamEspnId) {
    const isFavoriteHome = game.odds.favoriteTeamEspnId === game.home.teamEspnId;
    const favoriteAvg = isFavoriteHome ? homeAvg : awayAvg;

    const favoriteScore = Math.round(favoriteAvg);
    const underdogScore = Math.ceil(favoriteScore - Math.abs(game.odds.spread));

    return isFavoriteHome
      ? { home: favoriteScore, away: underdogScore }
      : { home: underdogScore, away: favoriteScore };
  }

  // Priority 2: Use ranks (higher ranked = favorite)
  if (game.home.rank || game.away.rank) {
    const homeIsFavorite = !game.away.rank || (game.home.rank && game.home.rank < game.away.rank);

    const favoriteAvg = homeIsFavorite ? homeAvg : awayAvg;
    const favoriteScore = Math.round(favoriteAvg);
    const underdogScore = favoriteScore - 7; // Default 7-point margin

    return homeIsFavorite
      ? { home: favoriteScore, away: underdogScore }
      : { home: underdogScore, away: favoriteScore };
  }

  // Priority 3: Home field advantage (3 points)
  const homeScore = Math.round(homeAvg);
  const awayScore = homeScore - 3;

  return { home: homeScore, away: awayScore };
};
```

## 3. Update Live Games Cron

**File:** `/Users/austin/code/github/sec-tiebreaker/app/api/cron/update-live-games/route.ts`

### Changes:

1. **Add spread to change detection** (line ~151):

```typescript
if (
  reshapedGame.state !== currentGame.state ||
  reshapedGame.completed !== currentGame.completed ||
  reshapedGame.home.score !== currentGame.home.score ||
  reshapedGame.away.score !== currentGame.away.score ||
  reshapedGame.home.rank !== currentGame.home.rank ||
  reshapedGame.away.rank !== currentGame.away.rank ||
  reshapedGame.odds?.spread !== currentGame.odds?.spread ||           // ADD
  reshapedGame.odds?.favoriteTeamEspnId !== currentGame.odds?.favoriteTeamEspnId  // ADD
) {
```

2. **Fetch teams for prefill calculation** (after line ~143):

```typescript
// Fetch teams for predictedScore calculation
import Team from '@/lib/models/Team';
import { calculatePredictedScore } from '@/lib/prefill-helpers';

const teamIds = [
  ...new Set([
    ...gamesToUpdate.map((g) => g.home.teamEspnId),
    ...gamesToUpdate.map((g) => g.away.teamEspnId),
  ]),
];

const teams = await Team.find({ _id: { $in: teamIds } }).lean();
const teamMap = new Map(teams.map((t) => [t._id, t]));
```

3. **Calculate and update predictedScore** (inside update loop, line ~160):

```typescript
const homeTeam = teamMap.get(reshapedGame.home.teamEspnId);
const awayTeam = teamMap.get(reshapedGame.away.teamEspnId);

if (!homeTeam || !awayTeam) {
  console.warn(`Missing team data for game ${reshapedGame.espnId}`);
  continue;
}

const predictedScore = calculatePredictedScore(reshapedGame, homeTeam, awayTeam);

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
      'odds.spread': reshapedGame.odds?.spread, // ADD
      'odds.favoriteTeamEspnId': reshapedGame.odds?.favoriteTeamEspnId, // ADD
      'odds.overUnder': reshapedGame.odds?.overUnder, // ADD
      'predictedScore.home': predictedScore.home, // ADD
      'predictedScore.away': predictedScore.away, // ADD
      lastUpdated: new Date(),
    },
  }
);
```

## 4. Update Rankings Cron to Fetch Team Averages

**File:** `/Users/austin/code/github/sec-tiebreaker/app/api/cron/update-rankings/route.ts`

### Changes:

1. **Add Core API call** (inside team loop, after `getTeam()` call):

```typescript
import { espnClient } from '@/lib/espn-client';

// Existing: const teamData = await espnClient.getTeam(abbrev);
const teamId = teamData.team.id;

// ADD: Fetch detailed records from Core API
let recordData;
try {
  recordData = await espnClient.getTeamRecords(teamId, 2025, 2);
  espnCalls++;
} catch (error) {
  console.warn(`Failed to fetch Core API records for ${abbrev}:`, error);
  recordData = null;
}

// Reshape with Core API data
const reshapedTeam = reshapeTeamData(teamData, recordData);
```

2. **Update Team document with averages** (in updateOne call):

```typescript
await Team.updateOne(
  { _id: teamId },
  {
    $set: {
      nationalRanking: reshapedTeam.nationalRanking,
      conferenceStanding: reshapedTeam.conferenceStanding,
      'record.overall': reshapedTeam.record?.overall, // ADD
      'record.conference': reshapedTeam.record?.conference, // ADD
      'record.stats.avgPointsFor': reshapedTeam.record?.stats?.avgPointsFor, // ADD
      'record.stats.avgPointsAgainst': reshapedTeam.record?.stats?.avgPointsAgainst, // ADD
      'record.stats.pointsFor': reshapedTeam.record?.stats?.pointsFor, // ADD
      'record.stats.pointsAgainst': reshapedTeam.record?.stats?.pointsAgainst, // ADD
      lastUpdated: new Date(),
    },
  }
);
```

3. **Update response type** to include `espnCalls` count.

## 5. Update Vercel Cron Schedules

### Strategy: Separate Config Files

Design allows zero-code-change upgrade from Hobby to Pro - just swap config files.

**Key Principle:** Individual endpoint functions (`update-live-games`, `update-rankings`, `update-spreads`) remain unchanged. Only cron schedules differ between plans.

### Hobby Mode

**File:** `vercel.hobby.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/update-live-games",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/update-rankings",
      "schedule": "0 4 * * 3"
    }
  ]
}
```

**Behavior:**

- `update-live-games`: Daily at 1 AM ET (updates scores, spreads, predictedScores)
- `update-rankings`: Weekly Tuesday 11 PM ET (updates team stats, which feed into predictedScore calculations)
- **Covers all needs:** Scores updated daily, spreads updated daily, team averages updated weekly

**Limitations:**

- No real-time updates during games (imprecise timing, once/day only)
- Spread changes only caught once per day
- Acceptable for testing/MVP phase

### Pro Mode

**File:** `vercel.pro.json`

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
      "path": "/api/cron/update-spreads",
      "schedule": "0 13-5 * * *"
    },
    {
      "path": "/api/cron/update-team-averages",
      "schedule": "0 6 * * 0"
    },
    {
      "path": "/api/cron/update-rankings",
      "schedule": "0 3 * * 0"
    },
    {
      "path": "/api/cron/update-rankings",
      "schedule": "0 3 * * 3"
    }
  ]
}
```

**Behavior:**

**1. Live Scores (Real-Time):**

- `update-live-games`: Every 5 min during game windows
  - Thu-Fri nights: 4 PM - 1 AM ET (`*/5 21-23,0-6 * * 4-5`)
  - Saturday: 11 AM - 1 AM ET (`*/5 16-23,0-6 * * 6`)
- Updates scores, spreads, and predictedScores for active games

**2. Team Averages (After Saturday Games):**

- `update-team-averages`: Sunday 1 AM ET (`0 6 * * 0`)
- Runs after Saturday games complete, before Sunday rankings
- Fetches Core API records for all SEC teams
- Updates `avgPointsFor`, `avgPointsAgainst`, season totals
- Feeds into predictedScore calculations for upcoming week

**3. Rankings (AP Early Season → CFP Late Season):**

- Early season (weeks 1-8): Sunday 10 PM ET (`0 3 * * 0`) - after AP Poll release
- Late season (weeks 9+): Tuesday 10 PM ET (`0 3 * * 3`) - after CFP rankings release
- **Note:** Use both cron entries year-round, or manually swap config based on season phase
- Updates team rankings and standings only (averages already updated by dedicated cron)

**4. Betting Odds (Line Movement):**

- `update-spreads`: Hourly from 8 AM - midnight ET (`0 13-5 * * *`)
  - 8 AM ET = 13:00 UTC (EST) / 12:00 UTC (EDT)
  - Midnight ET = 05:00 UTC (next day, EST) / 04:00 UTC (next day, EDT)
  - 17-hour window catches Vegas line movement throughout the day
- Updates only spreads/odds + recalculates predictedScores
- Lighter than live-games (no score polling, just scoreboard fetch)

**Benefits:**

- Real-time score updates during games (5-min refresh)
- Team averages update Sunday morning with fresh Saturday results
- Hourly odds updates catch line movement as it happens
- Rankings updated based on poll schedule (AP Sunday, CFP Tuesday)
- Precise timing for production-quality UX

**New Endpoints Required:**

- `/api/cron/update-spreads` (fetches scoreboard for odds only)
- `/api/cron/update-team-averages` (fetches Core API for all teams, updates averages only)

## 6. Create Update Team Averages Cron (Pro Mode Only)

**File:** `/Users/austin/code/github/sec-tiebreaker/app/api/cron/update-team-averages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import { espnClient } from '@/lib/espn-client';
import { reshapeTeamData } from '@/lib/reshape-teams';
import { SEC_TEAMS } from '@/lib/constants';
import ErrorLog from '@/lib/models/Error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    let updateCount = 0;
    let espnCalls = 0;
    const errors: string[] = [];

    // 2. Update each SEC team's averages
    for (const team of SEC_TEAMS) {
      try {
        // Fetch team data (for team ID)
        const teamData = await espnClient.getTeam(team.abbrev);
        espnCalls++;

        const teamId = teamData.team.id;

        // Fetch Core API records
        const recordData = await espnClient.getTeamRecords(teamId, 2025, 2);
        espnCalls++;

        // Reshape (only need stats, not rankings)
        const reshapedTeam = reshapeTeamData(teamData, recordData);

        // Update only averages and records (not rankings)
        await Team.updateOne(
          { _id: teamId },
          {
            $set: {
              'record.overall': reshapedTeam.record?.overall,
              'record.conference': reshapedTeam.record?.conference,
              'record.home': reshapedTeam.record?.home,
              'record.away': reshapedTeam.record?.away,
              'record.stats.wins': reshapedTeam.record?.stats?.wins,
              'record.stats.losses': reshapedTeam.record?.stats?.losses,
              'record.stats.winPercent': reshapedTeam.record?.stats?.winPercent,
              'record.stats.pointsFor': reshapedTeam.record?.stats?.pointsFor,
              'record.stats.pointsAgainst': reshapedTeam.record?.stats?.pointsAgainst,
              'record.stats.pointDifferential': reshapedTeam.record?.stats?.pointDifferential,
              'record.stats.avgPointsFor': reshapedTeam.record?.stats?.avgPointsFor,
              'record.stats.avgPointsAgainst': reshapedTeam.record?.stats?.avgPointsAgainst,
              lastUpdated: new Date(),
            },
          }
        );
        updateCount++;
      } catch (error) {
        const errorMsg = `Failed to update ${team.abbrev}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);

        await ErrorLog.create({
          timestamp: new Date(),
          endpoint: '/api/cron/update-team-averages',
          payload: { team: team.abbrev },
          error: errorMsg,
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
      }
    }

    return NextResponse.json({
      updated: updateCount,
      teamsChecked: SEC_TEAMS.length,
      espnCalls,
      lastUpdated: new Date().toISOString(),
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    console.error('Update team averages error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
```

## 7. Create Update Spreads Cron (Pro Mode Only)

**File:** `/Users/austin/code/github/sec-tiebreaker/app/api/cron/update-spreads/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import { espnClient } from '@/lib/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { calculatePredictedScore } from '@/lib/prefill-helpers';
import { SEC_CONFERENCE_ID } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    // 2. Find upcoming games (not completed)
    const games = await Game.find({
      season: 2025,
      conferenceGame: true,
      completed: false,
    }).lean();

    if (games.length === 0) {
      return NextResponse.json({
        updated: 0,
        message: 'No upcoming games to update',
      });
    }

    // 3. Determine which weeks to fetch
    const weeks = [...new Set(games.map((g) => g.week).filter((w) => w !== null))];

    let updateCount = 0;
    let espnCalls = 0;

    // 4. Fetch teams for predictedScore calculation
    const teamIds = [
      ...new Set([...games.map((g) => g.home.teamEspnId), ...games.map((g) => g.away.teamEspnId)]),
    ];
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamMap = new Map(teams.map((t) => [t._id, t]));

    // 5. For each week, fetch scoreboard
    for (const week of weeks) {
      const espnResponse = await espnClient.getScoreboard({
        groups: SEC_CONFERENCE_ID,
        season: 2025,
        week,
      });
      espnCalls++;

      const result = reshapeScoreboardData(espnResponse, 'football', 'college-football');
      const reshapedGames = result.games || [];

      // 6. Update each game's spread and predictedScore
      for (const reshapedGame of reshapedGames) {
        const currentGame = games.find((g) => g.espnId === reshapedGame.espnId);
        if (!currentGame) continue;

        const homeTeam = teamMap.get(reshapedGame.home.teamEspnId);
        const awayTeam = teamMap.get(reshapedGame.away.teamEspnId);

        if (!homeTeam || !awayTeam) continue;

        const predictedScore = calculatePredictedScore(reshapedGame, homeTeam, awayTeam);

        // Only update if spread or predictedScore changed
        if (
          reshapedGame.odds?.spread !== currentGame.odds?.spread ||
          predictedScore.home !== currentGame.predictedScore?.home ||
          predictedScore.away !== currentGame.predictedScore?.away
        ) {
          await Game.updateOne(
            { espnId: reshapedGame.espnId },
            {
              $set: {
                'odds.spread': reshapedGame.odds?.spread,
                'odds.favoriteTeamEspnId': reshapedGame.odds?.favoriteTeamEspnId,
                'odds.overUnder': reshapedGame.odds?.overUnder,
                'predictedScore.home': predictedScore.home,
                'predictedScore.away': predictedScore.away,
                lastUpdated: new Date(),
              },
            }
          );
          updateCount++;
        }
      }
    }

    return NextResponse.json({
      updated: updateCount,
      gamesChecked: games.length,
      espnCalls,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update spreads error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
```

## 7. Update Seed Script

**File:** `/Users/austin/code/github/sec-tiebreaker/scripts/seed-games.ts`

When seeding games initially, calculate predictedScore:

```typescript
import { calculatePredictedScore } from '@/lib/prefill-helpers';

// After fetching teams and reshaping games:
for (const game of reshapedGames) {
  const homeTeam = teamMap.get(game.home.teamEspnId);
  const awayTeam = teamMap.get(game.away.teamEspnId);

  if (homeTeam && awayTeam) {
    const predictedScore = calculatePredictedScore(game, homeTeam, awayTeam);

    await Game.updateOne(
      { espnId: game.espnId },
      {
        $set: {
          ...game,
          predictedScore,
        },
      },
      { upsert: true }
    );
  }
}
```

## 8. API Response Updates

**File:** `/Users/austin/code/github/sec-tiebreaker/lib/api-types.ts`

Add `predictedScore` to API responses:

```typescript
export interface GameResponse {
  // ... existing fields
  predictedScore?: {
    home: number;
    away: number;
  };
}
```

**No changes needed to `/api/games` endpoint** - it already returns Game documents with `.lean()`, so `predictedScore` will be included automatically once the model is updated.

## 9. Deployment & Upgrade Path

### Initial Deployment (Hobby Mode)

1. **Activate Hobby config:**

```bash
cp vercel.hobby.json vercel.json
git add vercel.json vercel.hobby.json vercel.pro.json
git commit -m "Add cron configs for Hobby and Pro plans"
git push origin main
```

2. **Verify in Vercel Dashboard:**

- Navigate to Project Settings → Cron Jobs
- Should see 2 cron jobs listed
- Note: Timing will be imprecise (±1 hour window)

### Upgrading to Pro Plan

**Zero code changes required:**

```bash
# Swap config files
cp vercel.pro.json vercel.json
git add vercel.json
git commit -m "Switch to Pro plan cron schedules"
git push origin main
```

**That's it!** Vercel will automatically:

- Register 4 new cron jobs
- Remove old schedules
- Begin invoking at new frequencies

**Note:** Create `/api/cron/update-spreads` endpoint before switching to Pro config (it's referenced but not used in Hobby mode).

## Testing

### Local Testing (All Modes):

1. Test individual endpoints:

```bash
# Test live games update
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/update-live-games

# Test rankings update
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/update-rankings

# Test spreads update (Pro only)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/update-spreads
```

2. Verify database changes:

```bash
# Check predictedScore field exists
db.games.findOne({ espnId: "401628349" }, { predictedScore: 1, odds: 1 })

# Check team averages updated
db.teams.findOne({ _id: "333" }, { "record.stats.avgPointsFor": 1 })
```

3. Verify API response includes predictedScore:

```bash
curl http://localhost:3000/api/games?conferenceId=8&season=2025 | jq '.[0].predictedScore'
```

## Implementation Summary

### What Gets Updated When

#### Hobby Mode

**Daily (1 AM ET via `update-live-games`):**

- ✅ Game scores (completed & live)
- ✅ Game spreads (all games)
- ✅ Game ranks (all games)
- ✅ PredictedScores (all games, calculated from real scores or spread+averages)

**Weekly (Tuesday 11 PM ET via `update-rankings`):**

- ✅ Team national rankings
- ✅ Team conference standings
- ✅ Team season averages (avgPointsFor/Against)
- ✅ Team records (overall, conference, home, away)

#### Pro Mode

**Every 5 minutes during games (Thu-Sat via `update-live-games`):**

- ✅ Game scores (real-time for active games)
- ✅ Game spreads (live movement)
- ✅ Game ranks (updated as games complete)
- ✅ PredictedScores (recalculated with latest data)

**Hourly 8 AM - midnight ET (via `update-spreads`):**

- ✅ Game spreads (all upcoming games)
- ✅ Game odds (overUnder, favoriteTeam)
- ✅ PredictedScores (recalculated with new spreads)

**Weekly Sunday 1 AM ET (via `update-team-averages`):**

- ✅ Team season averages (avgPointsFor/Against)
- ✅ Team records (overall, conference, home, away)
- ✅ Season totals (pointsFor, pointsAgainst, pointDifferential)

**Weekly (Sunday/Tuesday 10 PM ET via `update-rankings`):**

- ✅ Team national rankings (AP on Sunday weeks 1-8, CFP on Tuesday weeks 9+)
- ✅ Team conference standings

**Result:**

- **All questions answered for both modes:**
  - **Hobby:** Scores/spreads/predictions update daily (good for MVP)
  - **Pro:** Real-time scores (5min), hourly odds (17hrs/day), weekly rankings (poll-synced)
- Frontend gets `predictedScore` field on every game:
  - Completed/live games: `predictedScore` = real scores
  - Pre-state games: `predictedScore` = calculated from spread + ESPN season averages
- Rankings sync with poll schedules (AP early season, CFP late season)
- Easy upgrade path with zero code changes (just swap vercel.json)
