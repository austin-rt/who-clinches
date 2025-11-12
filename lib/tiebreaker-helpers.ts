/**
 * SEC Tiebreaker Logic Helpers
 * Implements SEC conference tiebreaker rules A-E
 */

import { GameLean } from "./types";
import { StandingEntry, TieLog, TieStep } from "./api-types";

const EPSILON = 0.0001;
const OFFENSIVE_CAP = 42;
const DEFENSIVE_CAP = 48;

/**
 * Apply user score overrides to games and fill in predictedScore for incomplete games
 */
export const applyOverrides = (
  games: GameLean[],
  overrides: { [gameId: string]: { homeScore: number; awayScore: number } }
): GameLean[] => {
  return games.map((game) => {
    const override = overrides[game.espnId];

    // If user provided override, use it
    if (override) {
      // Validate scores
      if (override.homeScore === override.awayScore) {
        throw new Error(`Tie scores not allowed for game ${game.espnId}`);
      }
      if (override.homeScore < 0 || override.awayScore < 0) {
        throw new Error("Scores cannot be negative");
      }
      if (
        !Number.isInteger(override.homeScore) ||
        !Number.isInteger(override.awayScore)
      ) {
        throw new Error("Scores must be whole numbers");
      }

      return {
        ...game,
        home: { ...game.home, score: override.homeScore },
        away: { ...game.away, score: override.awayScore },
      };
    }

    // If game already has scores, keep them
    if (game.home.score !== null && game.away.score !== null) {
      return game;
    }

    // If game is incomplete and has predictedScore, use it
    if (game.predictedScore) {
      return {
        ...game,
        home: { ...game.home, score: game.predictedScore.home },
        away: { ...game.away, score: game.predictedScore.away },
      };
    }

    // Return game as-is if no scores available (will be skipped by getTeamRecord)
    return game;
  });
};

/**
 * Calculate team record from games
 */
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
    // Skip games without scores (applyOverrides should have filled these in)
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

/**
 * Rule A: Head-to-Head
 */
export const applyRuleA = (
  tiedTeams: string[],
  games: GameLean[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: "No tie to break" };
  }

  // Filter games to only those among tied teams
  const h2hGames = games.filter(
    (g) =>
      tiedTeams.includes(g.home.teamEspnId) &&
      tiedTeams.includes(g.away.teamEspnId)
  );

  if (h2hGames.length === 0) {
    return { winners: tiedTeams, detail: "No head-to-head games played" };
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
    .join(", ");

  // Add to explanations for teams eliminated
  records.forEach((r) => {
    if (!winners.includes(r.teamId)) {
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

/**
 * Rule B: Common Opponents
 */
export const applyRuleB = (
  tiedTeams: string[],
  games: GameLean[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: "No tie to break" };
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
    return { winners: tiedTeams, detail: "No common opponents" };
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

/**
 * Rule C: Highest Placed Common Opponent
 */
export const applyRuleC = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams: string[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: "No tie to break" };
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
    return { winners: tiedTeams, detail: "No common opponents" };
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

  return { winners: tiedTeams, detail: "Tied vs all common opponents" };
};

/**
 * Rule D: Opponent Win Percentage
 */
export const applyRuleD = (
  tiedTeams: string[],
  games: GameLean[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: "No tie to break" };
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

/**
 * Get team's average points scored per game
 */
export const getTeamAvgPointsFor = (
  teamId: string,
  games: GameLean[]
): number => {
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

/**
 * Get team's average points allowed per game
 */
export const getTeamAvgPointsAgainst = (
  teamId: string,
  games: GameLean[]
): number => {
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

/**
 * Rule E: Scoring Margin
 */
export const applyRuleE = (
  tiedTeams: string[],
  games: GameLean[],
  explanations: Map<string, string[]>
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: "No tie to break" };
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

    const avgMargin =
      teamGames.length === 0 ? 0 : totalMargin / teamGames.length;

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

/**
 * Cascading tiebreaker engine
 */
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
  const ranked: string[] = [];
  let remaining = [...tiedTeams];

  // Build rankings: eliminated teams added first (worse ranks), survivors continue for better ranks
  while (remaining.length > 0) {
    if (remaining.length === 1) {
      // Last team remaining gets the best rank of this group
      ranked.push(remaining[0]);
      break;
    }

    // Rule A: Head-to-Head
    const ruleA = applyRuleA(remaining, games, explanations);
    steps.push({
      rule: "A: Head-to-Head",
      detail: ruleA.detail,
      survivors: ruleA.winners,
    });

    if (ruleA.winners.length < remaining.length) {
      // Rule A separated teams: eliminated teams get worse ranks, survivors continue for better ranks
      const eliminated = remaining.filter((t) => !ruleA.winners.includes(t));

      // Recursively rank eliminated teams if there's more than one
      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(
          eliminated,
          games,
          allTeams,
          explanations
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleA.winners;
      continue;
    }

    // Rule B: Common Opponents
    const ruleB = applyRuleB(remaining, games, explanations);
    steps.push({
      rule: "B: Common Opponents",
      detail: ruleB.detail,
      survivors: ruleB.winners,
    });

    if (ruleB.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleB.winners.includes(t));

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(
          eliminated,
          games,
          allTeams,
          explanations
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleB.winners;
      continue;
    }

    // Rule C: Highest Placed Common Opponent
    const ruleC = applyRuleC(remaining, games, allTeams, explanations);
    steps.push({
      rule: "C: Highest Placed Common Opponent",
      detail: ruleC.detail,
      survivors: ruleC.winners,
    });

    if (ruleC.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleC.winners.includes(t));

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(
          eliminated,
          games,
          allTeams,
          explanations
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleC.winners;
      continue;
    }

    // Rule D: Opponent Win %
    const ruleD = applyRuleD(remaining, games, explanations);
    steps.push({
      rule: "D: Opponent Win %",
      detail: ruleD.detail,
      survivors: ruleD.winners,
    });

    if (ruleD.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleD.winners.includes(t));

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(
          eliminated,
          games,
          allTeams,
          explanations
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleD.winners;
      continue;
    }

    // Rule E: Scoring Margin
    const ruleE = applyRuleE(remaining, games, explanations);
    steps.push({
      rule: "E: Scoring Margin",
      detail: ruleE.detail,
      survivors: ruleE.winners,
    });

    if (ruleE.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleE.winners.includes(t));

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(
          eliminated,
          games,
          allTeams,
          explanations
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleE.winners;
      continue;
    }

    // Still tied after all rules - all remaining teams share same rank
    steps.push({
      rule: "F: Unresolved",
      detail: "Tie unresolved by rules A-E",
      survivors: remaining,
    });
    ranked.push(...remaining);
    break;
  }

  return { ranked, steps };
};

/**
 * Calculate full conference standings
 */
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

  for (const [_winPct, tiedTeams] of sortedGroups) {
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
      explainPosition += `. ${teamExplanations.join(". ")}`;
    }

    return {
      rank: index + 1,
      teamId,
      abbrev: team.abbrev,
      displayName: team.displayName || team.abbrev || "Unknown",
      logo: team.logo || "",
      color: team.color || "000000",
      record: { wins: record.wins, losses: record.losses },
      confRecord: { wins: record.wins, losses: record.losses },
      explainPosition,
    };
  });

  return { standings, tieLogs };
};
