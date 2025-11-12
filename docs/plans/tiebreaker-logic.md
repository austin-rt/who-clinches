# SEC Tiebreaker Logic Implementation

> **⚠️ PLANNING DOCUMENT - IMPLEMENTATION MAY DIFFER**
> This document was created during planning phase. For actual implementation details, refer to:
> - Actual code in `/app/api/simulate/route.ts`
> - `/lib/tiebreaker-helpers.ts` for tiebreaker logic
> - `/docs/api-reference.md` for current API documentation
> - `/lib/constants.ts` for actual constant definitions (SEC_TEAMS is string[], not objects)

## Overview
Implement the SEC conference tiebreaker engine following rules A-E from the official SEC policy. Create `/api/simulate` endpoint that accepts user score predictions for incomplete games and returns fully resolved conference standings with human-readable explanations.

## Prerequisites
- Game model updated with `predictedScore` field and team display data
- All SEC conference games seeded in database
- Team collection populated with current season data

## 1. Update Game Model

**File:** `/Users/austin/code/github/sec-tiebreaker/lib/models/Game.ts`

Add team display fields and predictedScore:

```typescript
export interface IGame extends Document {
  // ... existing fields
  home: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;     // ADD: "Alabama Crimson Tide"
    logo: string;            // ADD: Full URL
    color: string;           // ADD: Hex color
    score: number | null;
    rank: number | null;
  };
  away: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;     // ADD
    logo: string;            // ADD
    color: string;           // ADD
    score: number | null;
    rank: number | null;
  };
  predictedScore?: {         // ADD: For frontend prefills
    home: number;
    away: number;
  };
  // ... rest of schema
}
```

Update Mongoose schema accordingly.

**Migration:** Drop and re-seed database with updated schema (team display data pulled from Team collection during seed).

## 2. Update Type Definitions

**File:** `/Users/austin/code/github/sec-tiebreaker/lib/types.ts`

Update `GameLean` to match new schema:

```typescript
export interface GameLean {
  espnId: string;
  home: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;   // ADD
    logo: string;          // ADD
    color: string;         // ADD
    score: number | null;
    rank: number | null;
  };
  away: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;   // ADD
    logo: string;          // ADD
    color: string;         // ADD
    score: number | null;
    rank: number | null;
  };
  predictedScore?: {       // ADD
    home: number;
    away: number;
  };
  // ... rest of fields
}
```

## 3. Define API Types

**File:** `/Users/austin/code/github/sec-tiebreaker/lib/api-types.ts`

Add simulate endpoint types:

```typescript
// POST /api/simulate - Request
export interface SimulateRequest {
  season: number;
  conferenceId: string;
  overrides: {
    [gameId: string]: {      // Object format: { "401628349": { home: 35, away: 24 } }
      homeScore: number;
      awayScore: number;
    };
  };
}

// POST /api/simulate - Response
export interface SimulateResponse {
  standings: StandingEntry[];
  championship: [string, string];  // Top 2 team IDs
  tieLogs: TieLog[];
}

export interface StandingEntry {
  rank: number;
  teamId: string;
  abbrev: string;
  displayName: string;
  logo: string;
  color: string;
  record: { wins: number; losses: number };
  confRecord: { wins: number; losses: number };
  explainPosition: string;  // Single human-readable string
}

export interface TieLog {
  teams: string[];  // Team abbreviations
  steps: TieStep[];
}

export interface TieStep {
  rule: string;       // "A: Head-to-Head"
  detail: string;     // "ALA beat UGA 27-24"
  survivors: string[]; // Remaining tied teams after this step
}
```

## 4. Create Tiebreaker Helper Functions

**File:** `/Users/austin/code/github/sec-tiebreaker/lib/tiebreaker-helpers.ts`

### 4.1 Apply User Overrides

```typescript
export const applyOverrides = (
  games: GameLean[],
  overrides: { [gameId: string]: { homeScore: number; awayScore: number } }
): GameLean[] => {
  return games.map((game) => {
    const override = overrides[game.espnId];
    if (!override) return game;

    // Validate scores
    if (override.homeScore === override.awayScore) {
      throw new Error(`Tie scores not allowed for game ${game.espnId}`);
    }
    if (override.homeScore < 0 || override.awayScore < 0) {
      throw new Error('Scores cannot be negative');
    }
    if (!Number.isInteger(override.homeScore) || !Number.isInteger(override.awayScore)) {
      throw new Error('Scores must be whole numbers');
    }

    return {
      ...game,
      home: { ...game.home, score: override.homeScore },
      away: { ...game.away, score: override.awayScore },
    };
  });
};
```

### 4.2 Calculate Team Records

```typescript
export const getTeamRecord = (
  teamId: string,
  games: GameLean[]
): { wins: number; losses: number; winPct: number } => {
  const teamGames = games.filter(
    (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
  );

  let wins = 0;
  let losses = 0;

  for (const game of teamGames) {
    if (game.home.score === null || game.away.score === null) continue;

    const isHome = game.home.teamEspnId === teamId;
    const teamScore = isHome ? game.home.score : game.away.score;
    const oppScore = isHome ? game.away.score : game.home.score;

    if (teamScore > oppScore) wins++;
    else losses++;
  }

  const winPct = wins + losses === 0 ? 0 : wins / (wins + losses);
  return { wins, losses, winPct };
};
```

### 4.3 Rule A: Head-to-Head

```typescript
const EPSILON = 0.0001;

export const applyRuleA = (
  tiedTeams: string[],
  games: GameLean[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  // Filter games to only those among tied teams
  const h2hGames = games.filter(
    (g) =>
      tiedTeams.includes(g.home.teamEspnId) &&
      tiedTeams.includes(g.away.teamEspnId)
  );

  if (h2hGames.length === 0) {
    return { winners: tiedTeams, detail: 'No head-to-head games played' };
  }

  // Calculate h2h records
  const records = tiedTeams.map((teamId) => ({
    teamId,
    ...getTeamRecord(teamId, h2hGames),
  }));

  const maxWinPct = Math.max(...records.map((r) => r.winPct));
  const winners = records
    .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON)
    .map((r) => r.teamId);

  // Build explanation
  const teamAbbrevs = records.map((r) => {
    const game = games.find(
      (g) => g.home.teamEspnId === r.teamId || g.away.teamEspnId === r.teamId
    );
    return game?.home.teamEspnId === r.teamId
      ? game.home.abbrev
      : game?.away.abbrev || r.teamId;
  });

  const detail = teamAbbrevs
    .map((abbrev, i) => `${abbrev}: ${records[i].wins}-${records[i].losses}`)
    .join(', ');

  // Add to explanations for teams eliminated
  records.forEach((r) => {
    if (!winners.includes(r.teamId)) {
      const abbrev = teamAbbrevs[records.indexOf(r)];
      explanations.set(
        r.teamId,
        (explanations.get(r.teamId) || []).concat(
          `Lost head-to-head tiebreaker (${r.wins}-${r.losses})`
        )
      );
    }
  });

  return { winners, detail };
};
```

### 4.4 Rule B: Common Opponents

```typescript
export const applyRuleB = (
  tiedTeams: string[],
  games: GameLean[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  // Find common opponents (played by all tied teams)
  const opponentSets = tiedTeams.map((teamId) => {
    const teamGames = games.filter(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    );
    return new Set(
      teamGames.map((g) =>
        g.home.teamEspnId === teamId ? g.away.teamEspnId : g.home.teamEspnId
      )
    );
  });

  const commonOpponents = [...opponentSets[0]].filter((opp) =>
    opponentSets.every((set) => set.has(opp))
  );

  if (commonOpponents.length === 0) {
    return { winners: tiedTeams, detail: 'No common opponents' };
  }

  // Calculate records vs common opponents
  const records = tiedTeams.map((teamId) => {
    const vsCommonGames = games.filter(
      (g) =>
        (g.home.teamEspnId === teamId &&
          commonOpponents.includes(g.away.teamEspnId)) ||
        (g.away.teamEspnId === teamId &&
          commonOpponents.includes(g.home.teamEspnId))
    );
    return {
      teamId,
      ...getTeamRecord(teamId, vsCommonGames),
    };
  });

  const maxWinPct = Math.max(...records.map((r) => r.winPct));
  const winners = records
    .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON)
    .map((r) => r.teamId);

  const detail = `${commonOpponents.length} common opponents`;

  records.forEach((r) => {
    if (!winners.includes(r.teamId)) {
      explanations.set(
        r.teamId,
        (explanations.get(r.teamId) || []).concat(
          `Worse record vs common opponents (${r.wins}-${r.losses})`
        )
      );
    }
  });

  return { winners, detail };
};
```

### 4.5 Rule C: Highest Placed Common Opponent

```typescript
export const applyRuleC = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams: string[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  // Build preliminary standings (W-L only, no tiebreakers)
  const preliminaryStandings = allTeams
    .map((teamId) => ({
      teamId,
      ...getTeamRecord(teamId, games),
    }))
    .sort((a, b) => {
      if (Math.abs(b.winPct - a.winPct) > EPSILON) return b.winPct - a.winPct;
      return b.wins - a.wins;
    });

  // Find common opponents (played by all tied teams)
  const opponentSets = tiedTeams.map((teamId) => {
    const teamGames = games.filter(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    );
    return new Set(
      teamGames.map((g) =>
        g.home.teamEspnId === teamId ? g.away.teamEspnId : g.home.teamEspnId
      )
    );
  });

  const commonOpponents = [...opponentSets[0]].filter((opp) =>
    opponentSets.every((set) => set.has(opp))
  );

  if (commonOpponents.length === 0) {
    return { winners: tiedTeams, detail: 'No common opponents' };
  }

  // Order common opponents by preliminary standing
  const rankedCommonOpponents = preliminaryStandings
    .filter((team) => commonOpponents.includes(team.teamId))
    .map((team) => team.teamId);

  // Check records against highest-placed opponent first
  for (const oppId of rankedCommonOpponents) {
    const records = tiedTeams.map((teamId) => {
      const vsOppGames = games.filter(
        (g) =>
          (g.home.teamEspnId === teamId && g.away.teamEspnId === oppId) ||
          (g.away.teamEspnId === teamId && g.home.teamEspnId === oppId)
      );
      return {
        teamId,
        ...getTeamRecord(teamId, vsOppGames),
      };
    });

    const maxWinPct = Math.max(...records.map((r) => r.winPct));
    const minWinPct = Math.min(...records.map((r) => r.winPct));

    // If there's differentiation, we have winners
    if (Math.abs(maxWinPct - minWinPct) > EPSILON) {
      const winners = records
        .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON)
        .map((r) => r.teamId);

      const oppGame = games.find(
        (g) => g.home.teamEspnId === oppId || g.away.teamEspnId === oppId
      );
      const oppAbbrev =
        oppGame?.home.teamEspnId === oppId
          ? oppGame.home.abbrev
          : oppGame?.away.abbrev || oppId;

      const detail = `Record vs ${oppAbbrev}`;

      records.forEach((r) => {
        if (!winners.includes(r.teamId)) {
          explanations.set(
            r.teamId,
            (explanations.get(r.teamId) || []).concat(
              `Lost to highest-placed common opponent (${oppAbbrev})`
            )
          );
        }
      });

      return { winners, detail };
    }
  }

  return { winners: tiedTeams, detail: 'Tied vs all common opponents' };
};
```

### 4.6 Rule D: Opponent Win Percentage

```typescript
export const applyRuleD = (
  tiedTeams: string[],
  games: GameLean[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const records = tiedTeams.map((teamId) => {
    // Get all opponents this team faced
    const teamGames = games.filter(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    );

    const opponents = teamGames.map((g) =>
      g.home.teamEspnId === teamId ? g.away.teamEspnId : g.home.teamEspnId
    );

    // Calculate cumulative opponent win%
    let totalWins = 0;
    let totalGames = 0;

    for (const oppId of opponents) {
      const oppRecord = getTeamRecord(oppId, games);
      totalWins += oppRecord.wins;
      totalGames += oppRecord.wins + oppRecord.losses;
    }

    const oppWinPct = totalGames === 0 ? 0 : totalWins / totalGames;

    return { teamId, oppWinPct };
  });

  const maxOppWinPct = Math.max(...records.map((r) => r.oppWinPct));
  const winners = records
    .filter((r) => Math.abs(r.oppWinPct - maxOppWinPct) < EPSILON)
    .map((r) => r.teamId);

  const detail = `Opponent win%: ${(maxOppWinPct * 100).toFixed(1)}%`;

  records.forEach((r) => {
    if (!winners.includes(r.teamId)) {
      explanations.set(
        r.teamId,
        (explanations.get(r.teamId) || []).concat(
          `Lower opponent win% (${(r.oppWinPct * 100).toFixed(1)}%)`
        )
      );
    }
  });

  return { winners, detail };
};
```

### 4.7 Rule E: Scoring Margin

```typescript
const OFFENSIVE_CAP = 42;
const DEFENSIVE_CAP = 48;

export const getTeamAvgPointsFor = (teamId: string, games: GameLean[]): number => {
  const teamGames = games.filter(
    (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
  );

  if (teamGames.length === 0) return 0;

  let totalPoints = 0;
  for (const game of teamGames) {
    if (game.home.score === null || game.away.score === null) continue;
    const isHome = game.home.teamEspnId === teamId;
    totalPoints += isHome ? game.home.score : game.away.score;
  }

  return totalPoints / teamGames.length;
};

export const getTeamAvgPointsAgainst = (teamId: string, games: GameLean[]): number => {
  const teamGames = games.filter(
    (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
  );

  if (teamGames.length === 0) return 0;

  let totalPoints = 0;
  for (const game of teamGames) {
    if (game.home.score === null || game.away.score === null) continue;
    const isHome = game.home.teamEspnId === teamId;
    totalPoints += isHome ? game.away.score : game.home.score;
  }

  return totalPoints / teamGames.length;
};

export const applyRuleE = (
  tiedTeams: string[],
  games: GameLean[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const margins = tiedTeams.map((teamId) => {
    const teamGames = games.filter(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    );

    let totalMargin = 0;

    for (const game of teamGames) {
      if (game.home.score === null || game.away.score === null) continue;

      const isHome = game.home.teamEspnId === teamId;
      const oppId = isHome ? game.away.teamEspnId : game.home.teamEspnId;

      // Cap team's score
      const teamScore = Math.min(
        isHome ? game.home.score : game.away.score,
        OFFENSIVE_CAP
      );

      // Cap opponent's score
      const oppScore = Math.min(
        isHome ? game.away.score : game.home.score,
        DEFENSIVE_CAP
      );

      // Get opponent's season averages (from all games, including simulated)
      const oppAvgFor = getTeamAvgPointsFor(oppId, games);
      const oppAvgAgainst = getTeamAvgPointsAgainst(oppId, games);

      // Relative margin = (team scored - opp avg allowed) + (opp avg scored - opp scored)
      const offensiveMargin = teamScore - oppAvgAgainst;
      const defensiveMargin = oppAvgFor - oppScore;
      const gameMargin = offensiveMargin + defensiveMargin;

      totalMargin += gameMargin;
    }

    const avgMargin = teamGames.length === 0 ? 0 : totalMargin / teamGames.length;

    return { teamId, avgMargin };
  });

  const maxMargin = Math.max(...margins.map((m) => m.avgMargin));
  const winners = margins
    .filter((m) => Math.abs(m.avgMargin - maxMargin) < EPSILON)
    .map((m) => m.teamId);

  const detail = `Best relative scoring margin: ${maxMargin.toFixed(2)}`;

  margins.forEach((m) => {
    if (!winners.includes(m.teamId)) {
      explanations.set(
        m.teamId,
        (explanations.get(m.teamId) || []).concat(
          `Lower scoring margin (${m.avgMargin.toFixed(2)})`
        )
      );
    }
  });

  return { winners, detail };
};
```

### 4.8 Cascading Tiebreaker Engine

```typescript
export const breakTie = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams: string[],
  explanations: Map<string, string[]>
): { ranked: string[]; steps: TieStep[] } => {
  if (tiedTeams.length <= 1) {
    return { ranked: tiedTeams, steps: [] };
  }

  const steps: TieStep[] = [];
  let remaining = [...tiedTeams];

  // Rule A
  const ruleA = applyRuleA(remaining, games, explanations);
  steps.push({
    rule: 'A: Head-to-Head',
    detail: ruleA.detail,
    survivors: ruleA.winners,
  });

  if (ruleA.winners.length === 1) {
    return { ranked: ruleA.winners, steps };
  }
  if (ruleA.winners.length < remaining.length) {
    // Some eliminated, restart with survivors
    const subResult = breakTie(ruleA.winners, games, allTeams, explanations);
    return { ranked: subResult.ranked, steps: [...steps, ...subResult.steps] };
  }

  remaining = ruleA.winners;

  // Rule B
  const ruleB = applyRuleB(remaining, games, explanations);
  steps.push({
    rule: 'B: Common Opponents',
    detail: ruleB.detail,
    survivors: ruleB.winners,
  });

  if (ruleB.winners.length === 1) {
    return { ranked: ruleB.winners, steps };
  }
  if (ruleB.winners.length < remaining.length) {
    const subResult = breakTie(ruleB.winners, games, allTeams, explanations);
    return { ranked: subResult.ranked, steps: [...steps, ...subResult.steps] };
  }

  remaining = ruleB.winners;

  // Rule C
  const ruleC = applyRuleC(remaining, games, allTeams, explanations);
  steps.push({
    rule: 'C: Highest Placed Common Opponent',
    detail: ruleC.detail,
    survivors: ruleC.winners,
  });

  if (ruleC.winners.length === 1) {
    return { ranked: ruleC.winners, steps };
  }
  if (ruleC.winners.length < remaining.length) {
    const subResult = breakTie(ruleC.winners, games, allTeams, explanations);
    return { ranked: subResult.ranked, steps: [...steps, ...subResult.steps] };
  }

  remaining = ruleC.winners;

  // Rule D
  const ruleD = applyRuleD(remaining, games, explanations);
  steps.push({
    rule: 'D: Opponent Win %',
    detail: ruleD.detail,
    survivors: ruleD.winners,
  });

  if (ruleD.winners.length === 1) {
    return { ranked: ruleD.winners, steps };
  }
  if (ruleD.winners.length < remaining.length) {
    const subResult = breakTie(ruleD.winners, games, allTeams, explanations);
    return { ranked: subResult.ranked, steps: [...steps, ...subResult.steps] };
  }

  remaining = ruleD.winners;

  // Rule E
  const ruleE = applyRuleE(remaining, games, explanations);
  steps.push({
    rule: 'E: Scoring Margin',
    detail: ruleE.detail,
    survivors: ruleE.winners,
  });

  if (ruleE.winners.length === 1) {
    return { ranked: ruleE.winners, steps };
  }
  if (ruleE.winners.length < remaining.length) {
    const subResult = breakTie(ruleE.winners, games, allTeams, explanations);
    return { ranked: subResult.ranked, steps: [...steps, ...subResult.steps] };
  }

  // Still tied after all rules
  steps.push({
    rule: 'F: Unresolved',
    detail: 'Tie unresolved by rules A-E',
    survivors: remaining,
  });

  return { ranked: remaining, steps };
};
```

### 4.9 Calculate Full Standings

```typescript
export const calculateStandings = (
  games: GameLean[],
  allTeams: string[]
): { standings: StandingEntry[]; tieLogs: TieLog[] } => {
  const explanations = new Map<string, string[]>();
  const tieLogs: TieLog[] = [];

  // Group teams by win%
  const teamRecords = allTeams.map((teamId) => ({
    teamId,
    ...getTeamRecord(teamId, games),
  }));

  // Sort into win% groups
  const winPctGroups = new Map<number, string[]>();
  for (const record of teamRecords) {
    const pct = Math.round(record.winPct * 10000) / 10000; // Round to avoid float issues
    if (!winPctGroups.has(pct)) {
      winPctGroups.set(pct, []);
    }
    winPctGroups.get(pct)!.push(record.teamId);
  }

  // Process each group (highest to lowest)
  const sortedGroups = [...winPctGroups.entries()].sort((a, b) => b[0] - a[0]);

  const orderedTeams: string[] = [];

  for (const [winPct, tiedTeams] of sortedGroups) {
    if (tiedTeams.length === 1) {
      orderedTeams.push(tiedTeams[0]);
    } else {
      // Break tie
      const tieResult = breakTie(tiedTeams, games, allTeams, explanations);
      orderedTeams.push(...tieResult.ranked);

      // Get team abbreviations for log
      const teamAbbrevs = tiedTeams.map((teamId) => {
        const game = games.find(
          (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
        );
        return game?.home.teamEspnId === teamId
          ? game.home.abbrev
          : game?.away.abbrev || teamId;
      });

      // Convert survivors to abbreviations
      const stepsWithAbbrevs = tieResult.steps.map((step) => ({
        ...step,
        survivors: step.survivors.map((teamId) => {
          const game = games.find(
            (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
          );
          return game?.home.teamEspnId === teamId
            ? game.home.abbrev
            : game?.away.abbrev || teamId;
        }),
      }));

      tieLogs.push({
        teams: teamAbbrevs,
        steps: stepsWithAbbrevs,
      });
    }
  }

  // Build standings with explanations
  const standings: StandingEntry[] = orderedTeams.map((teamId, index) => {
    const record = teamRecords.find((r) => r.teamId === teamId)!;
    const game = games.find(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    )!;

    const team = game.home.teamEspnId === teamId ? game.home : game.away;

    // Build explanation string
    let explainPosition = `Conference record: ${record.wins}-${record.losses}`;
    const teamExplanations = explanations.get(teamId);
    if (teamExplanations && teamExplanations.length > 0) {
      explainPosition += `. ${teamExplanations.join('. ')}`;
    }

    return {
      rank: index + 1,
      teamId,
      abbrev: team.abbrev,
      displayName: team.displayName,
      logo: team.logo,
      color: team.color,
      record: { wins: record.wins, losses: record.losses },
      confRecord: { wins: record.wins, losses: record.losses },
      explainPosition,
    };
  });

  return { standings, tieLogs };
};
```

## 5. Create API Endpoint

**File:** `/Users/austin/code/github/sec-tiebreaker/app/api/simulate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import { SEC_TEAMS } from '@/lib/constants';
import { applyOverrides, calculateStandings } from '@/lib/tiebreaker-helpers';
import { SimulateRequest, SimulateResponse } from '@/lib/api-types';
import { GameLean } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse<SimulateResponse | { error: string }>> {
  try {
    // 1. Parse request body
    const body: SimulateRequest = await req.json();
    const { season, conferenceId, overrides } = body;

    // 2. Validate
    if (!season || !conferenceId) {
      return NextResponse.json(
        { error: 'Missing required fields: season, conferenceId' },
        { status: 400 }
      );
    }

    // 3. Connect to DB
    await dbConnect();

    // 4. Fetch all conference games
    const games = await Game.find({
      season,
      conferenceGame: true,
      league: 'college-football',
    }).lean<GameLean[]>();

    if (games.length === 0) {
      return NextResponse.json(
        { error: 'No conference games found for this season' },
        { status: 404 }
      );
    }

    // 5. Apply user overrides
    const finalGames = applyOverrides(games, overrides);

    // 6. Get all SEC teams
    const allTeams = SEC_TEAMS.map((t) => t.espnId);

    // 7. Calculate standings
    const { standings, tieLogs } = calculateStandings(finalGames, allTeams);

    // 8. Return response
    return NextResponse.json<SimulateResponse>(
      {
        standings,
        championship: [standings[0].teamId, standings[1].teamId],
        tieLogs,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Simulate error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
```

## 6. Testing

### Manual Testing Scenarios:
1. **Two-way tie:** Teams with same record, different h2h
2. **Three-way tie:** Requires common opponent rules
3. **Cascading tie:** One team eliminated, remaining teams re-evaluated
4. **Rule E edge case:** Very close scoring margins
5. **All games completed:** No overrides needed
6. **All games incomplete:** All overrides required

### Test curl:
```bash
curl -X POST http://localhost:3000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {
      "401628349": { "homeScore": 35, "awayScore": 24 },
      "401628350": { "homeScore": 28, "awayScore": 21 }
    }
  }'
```

## Implementation Notes

- All tiebreaker functions use arrow function syntax
- Floating point comparisons use EPSILON (0.0001) for safety
- Team display data (name, logo, color) included in standings for frontend rendering
- Explanations build throughout tiebreaker process, attached to eliminated teams
- TieLogs show step-by-step progression with human-readable team abbreviations
- Override format uses object notation for clarity: `{ gameId: { homeScore, awayScore } }`
- Rule E calculates conference-only averages from simulated games (real + user predictions)
- Frontend will prefill completed games with real scores, incomplete with predictedScore
- No validation for "unrealistic" scores (500-0 allowed), but guards against negatives and non-integers

