import { GameLean, TeamLean } from '../../../types';
import { TieStep } from '../../../api-types';
import { CFBConferenceTiebreakerConfig } from './types';
import { getTeamRecord, getTeamAbbrev, formatList } from '../common/core-helpers';
import { getTeamAvgPointsFor, getTeamAvgPointsAgainst } from '../sec/rule-e-sec-scoring-margin';

const ruleNeedsTeamData = (name: string): boolean =>
  name.includes('Team Rating Score') || name.includes('Highest Placed');

const buildEliminationReason = (
  ruleName: string,
  ruleDetail: string,
  teamId: string,
  remaining: string[],
  games: GameLean[]
): string[] => {
  if (ruleName === 'Head-to-Head') {
    const h2hGames = games.filter(
      (g) => remaining.includes(g.home.teamId) && remaining.includes(g.away.teamId)
    );
    const record = getTeamRecord(teamId, h2hGames);
    const lostTo: string[] = [];
    for (const game of h2hGames) {
      if (game.home.score === null || game.away.score === null) continue;
      if (game.home.teamId === teamId && game.home.score < game.away.score) {
        lostTo.push(getTeamAbbrev(game.away.teamId, games));
      } else if (game.away.teamId === teamId && game.away.score < game.home.score) {
        lostTo.push(getTeamAbbrev(game.home.teamId, games));
      }
    }
    const opponentText = lostTo.length > 0 ? ` to ${formatList(lostTo)}` : '';
    return [`Lost head-to-head tiebreaker${opponentText} (${record.wins}-${record.losses})`];
  }

  if (ruleName.includes('Common') && !ruleName.includes('Highest')) {
    const opponentSets = remaining.map((t) => {
      const teamGames = games.filter((g) => g.home.teamId === t || g.away.teamId === t);
      return new Set(teamGames.map((g) => (g.home.teamId === t ? g.away.teamId : g.home.teamId)));
    });
    const commonOpponents = [...opponentSets[0]].filter((opp) =>
      opponentSets.every((set) => set.has(opp))
    );
    const vsCommonGames = games.filter(
      (g) =>
        (g.home.teamId === teamId && commonOpponents.includes(g.away.teamId)) ||
        (g.away.teamId === teamId && commonOpponents.includes(g.home.teamId))
    );
    const record = getTeamRecord(teamId, vsCommonGames);
    return [`Worse record vs common opponents (${record.wins}-${record.losses})`];
  }

  if (ruleName.includes('Highest Placed')) {
    const oppMatch = ruleDetail.match(/Record vs (\w+)/);
    const oppAbbrev = oppMatch ? oppMatch[1] : 'common opponent';
    return [`Lost to highest-placed common opponent (${oppAbbrev})`];
  }

  if (ruleName === 'Scoring Margin') {
    const OFFENSIVE_PCT_CAP = 200;
    const DEFENSIVE_PCT_MIN = 0;
    const teamGames = games.filter((g) => g.home.teamId === teamId || g.away.teamId === teamId);
    let totalMargin = 0;
    for (const game of teamGames) {
      if (game.home.score === null || game.away.score === null) continue;
      const isHome = game.home.teamId === teamId;
      const teamScore = isHome ? game.home.score : game.away.score;
      const oppScore = isHome ? game.away.score : game.home.score;
      const oppId = isHome ? game.away.teamId : game.home.teamId;
      const oppAvgFor = getTeamAvgPointsFor(oppId, games);
      const oppAvgAgainst = getTeamAvgPointsAgainst(oppId, games);
      const offensivePct =
        oppAvgAgainst > 0
          ? Math.min((teamScore / oppAvgAgainst) * 100, OFFENSIVE_PCT_CAP)
          : OFFENSIVE_PCT_CAP;
      const defensivePct =
        oppAvgFor > 0 ? Math.max((oppScore / oppAvgFor) * 100, DEFENSIVE_PCT_MIN) : 0;
      totalMargin += offensivePct - defensivePct;
    }
    const avgMargin = teamGames.length > 0 ? totalMargin / teamGames.length : 0;
    return [`Lower scoring margin (${avgMargin.toFixed(1)})`];
  }

  if (ruleName.includes('Team Rating Score')) {
    const ratingMatch = ruleDetail.match(/Best Team Rating Score: ([\d.]+)/);
    const ratingValue = ratingMatch ? ratingMatch[1] : '0.0';
    return [`Lower Team Rating Score (${ratingValue})`];
  }

  if (ruleName.includes('Win Percentage') || ruleName === 'Total Wins') {
    const teamGames = games.filter((g) => g.home.teamId === teamId || g.away.teamId === teamId);
    const opponents = teamGames.map((g) =>
      g.home.teamId === teamId ? g.away.teamId : g.home.teamId
    );
    let totalWins = 0;
    let totalGames = 0;
    for (const oppId of opponents) {
      const oppRecord = getTeamRecord(oppId, games);
      totalWins += oppRecord.wins;
      totalGames += oppRecord.wins + oppRecord.losses;
    }
    const pct = totalGames === 0 ? 0 : (totalWins / totalGames) * 100;
    return [`Eliminated by ${ruleName} (${pct.toFixed(1)}%)`];
  }

  return [`Eliminated by ${ruleName}`];
};

const resolveEliminated = async (
  eliminated: string[],
  games: GameLean[],
  allTeams: string[],
  config: CFBConferenceTiebreakerConfig,
  explanations: Map<string, string[]>,
  teams: TeamLean[]
): Promise<{ ranked: string[]; steps: TieStep[] }> => {
  if (eliminated.length > 1) {
    return await breakTie(eliminated, games, allTeams, config, explanations, true, teams);
  }
  if (eliminated.length === 1) {
    return { ranked: [eliminated[0]], steps: [] };
  }
  return { ranked: [], steps: [] };
};

export const breakTie = async (
  tiedTeams: string[],
  games: GameLean[],
  allTeams: string[],
  config: CFBConferenceTiebreakerConfig,
  explanations: Map<string, string[]>,
  isRecursive: boolean,
  teams: TeamLean[]
): Promise<{ ranked: string[]; steps: TieStep[] }> => {
  if (tiedTeams.length <= 1) {
    return { ranked: tiedTeams, steps: [] };
  }

  const steps: TieStep[] = [];
  const ranked: string[] = [];
  const remaining = [...tiedTeams];

  if (remaining.length === 1) {
    steps.push({
      rule: 'Final Position',
      detail: 'Ranked last in tie',
      survivors: remaining,
      tieBroken: false,
      label: 'Ranked last',
    });
    return { ranked: remaining, steps };
  }

  for (const rule of config.rules) {
    const result = ruleNeedsTeamData(rule.name)
      ? await rule.apply(remaining, games, allTeams, teams, config.useCfpRankingsFirst ?? false)
      : await rule.apply(remaining, games);

    const tieBroken = result.winners.length < remaining.length;
    steps.push({
      rule: rule.name,
      detail: result.detail,
      survivors: result.winners,
      tieBroken,
      label: tieBroken ? 'Advances' : 'Remaining',
    });

    if (!tieBroken) continue;

    const eliminated = remaining.filter((t) => !result.winners.includes(t));

    if (!isRecursive) {
      for (const teamId of eliminated) {
        if (!explanations.has(teamId)) {
          explanations.set(
            teamId,
            buildEliminationReason(rule.name, result.detail, teamId, remaining, games)
          );
        }
      }
    }

    if (result.winners.length === 1) {
      ranked.push(result.winners[0]);
      const elimResult = await resolveEliminated(
        eliminated,
        games,
        allTeams,
        config,
        explanations,
        teams
      );
      ranked.push(...elimResult.ranked);
      steps.push(...elimResult.steps);
    } else if (result.winners.length > 1) {
      const advResult = await breakTie(
        result.winners,
        games,
        allTeams,
        config,
        explanations,
        false,
        teams
      );
      ranked.push(...advResult.ranked);
      steps.push(...advResult.steps);
      const elimResult = await resolveEliminated(
        eliminated,
        games,
        allTeams,
        config,
        explanations,
        teams
      );
      ranked.push(...elimResult.ranked);
      steps.push(...elimResult.steps);
    } else {
      const elimResult = await resolveEliminated(
        eliminated,
        games,
        allTeams,
        config,
        explanations,
        teams
      );
      ranked.push(...elimResult.ranked);
      steps.push(...elimResult.steps);
    }

    return { ranked, steps };
  }

  steps.push({
    rule: 'Unresolved',
    detail: 'All tiebreaker rules exhausted',
    survivors: remaining,
    tieBroken: false,
    label: 'Remaining',
  });
  ranked.push(...remaining);

  return { ranked, steps };
};
