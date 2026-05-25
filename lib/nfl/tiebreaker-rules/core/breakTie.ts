import type { Game } from '../../../types';
import type { NflTiebreakerConfig, NflBreakTieResult } from '../types';
import type { NflTieStep } from '../../types';
import { NFL_TEAM_BY_ESPN_ID } from '../../constants';
import type { NflRankedTeam } from './calculateStandings';

const resolveEliminated = (
  eliminated: string[],
  games: Game[],
  allGames: Game[],
  config: NflTiebreakerConfig,
  divisionRankings?: Map<string, NflRankedTeam[]>
): NflBreakTieResult => {
  if (eliminated.length > 1) {
    return breakTie(eliminated, games, allGames, config, divisionRankings);
  }
  return { ranked: eliminated, steps: [] };
};

const filterToBestPerDivision = (
  teamIds: string[],
  divisionRankings: Map<string, NflRankedTeam[]>
): string[] => {
  const divBest = new Map<string, { teamId: string; divRank: number }>();

  for (const tid of teamIds) {
    const meta = NFL_TEAM_BY_ESPN_ID.get(tid);
    if (!meta) continue;
    const divId = meta.divisionId;
    const divRanked = divisionRankings.get(divId);
    const rank = divRanked?.find((r) => r.teamId === tid)?.rank ?? 999;

    const existing = divBest.get(divId);
    if (!existing || rank < existing.divRank) {
      divBest.set(divId, { teamId: tid, divRank: rank });
    }
  }

  return [...divBest.values()].map((v) => v.teamId);
};

const resolveSameDivision = (
  tiedTeams: string[],
  divisionRankings: Map<string, NflRankedTeam[]>
): NflBreakTieResult | null => {
  const divisions = new Set<string>();
  for (const tid of tiedTeams) {
    const meta = NFL_TEAM_BY_ESPN_ID.get(tid);
    if (!meta) return null;
    divisions.add(meta.divisionId);
  }
  if (divisions.size !== 1) return null;

  const divId = [...divisions][0];
  const divRanked = divisionRankings.get(divId);
  if (!divRanked) return null;

  const ordered = [...tiedTeams].sort((a, b) => {
    const aRank = divRanked.find((r) => r.teamId === a)?.rank ?? 999;
    const bRank = divRanked.find((r) => r.teamId === b)?.rank ?? 999;
    return aRank - bRank;
  });

  return {
    ranked: ordered,
    steps: [
      {
        rule: 'Same Division',
        detail: `All tied teams from same division — resolved by division standings`,
        survivors: [ordered[0]],
        tieBroken: true,
      },
    ],
  };
};

export const breakTie = (
  tiedTeams: string[],
  games: Game[],
  allGames: Game[],
  config: NflTiebreakerConfig,
  divisionRankings?: Map<string, NflRankedTeam[]>
): NflBreakTieResult => {
  if (tiedTeams.length <= 1) {
    return { ranked: [...tiedTeams], steps: [] };
  }

  if (divisionRankings) {
    const sameDivResult = resolveSameDivision(tiedTeams, divisionRankings);
    if (sameDivResult) return sameDivResult;
  }

  const steps: NflTieStep[] = [];
  const remaining = [...tiedTeams];
  let divFilterApplied = false;

  for (let ruleIdx = 0; ruleIdx < config.rules.length; ruleIdx++) {
    if (ruleIdx === 1 && !divFilterApplied && divisionRankings && remaining.length >= 3) {
      const filtered = filterToBestPerDivision(remaining, divisionRankings);
      if (filtered.length < remaining.length) {
        const eliminated = remaining.filter((t) => !filtered.includes(t));
        steps.push({
          rule: 'Division Elimination',
          detail: `Kept best from each division (${filtered.length} of ${remaining.length})`,
          survivors: filtered,
          tieBroken: true,
        });

        const ranked: string[] = [];

        if (filtered.length === 1) {
          ranked.push(filtered[0]);
        } else {
          const advResult = breakTie(filtered, games, allGames, config, divisionRankings);
          ranked.push(...advResult.ranked);
          steps.push(...advResult.steps);
        }

        const elimResult = resolveEliminated(eliminated, games, allGames, config, divisionRankings);
        ranked.push(...elimResult.ranked);
        steps.push(...elimResult.steps);

        return { ranked, steps };
      }
      divFilterApplied = true;
    }

    const rule = config.rules[ruleIdx];
    const result = rule.apply(remaining, games, allGames);
    const tieBroken = result.winners.length < remaining.length;

    steps.push({
      rule: rule.name,
      detail: result.detail,
      survivors: result.winners,
      tieBroken,
    });

    if (!tieBroken) continue;

    const eliminated = remaining.filter((t) => !result.winners.includes(t));
    const ranked: string[] = [];

    if (result.winners.length >= 1) {
      if (result.winners.length === 1) {
        ranked.push(result.winners[0]);
      } else {
        const advResult = breakTie(result.winners, games, allGames, config, divisionRankings);
        ranked.push(...advResult.ranked);
        steps.push(...advResult.steps);
      }

      const elimResult = resolveEliminated(eliminated, games, allGames, config, divisionRankings);
      ranked.push(...elimResult.ranked);
      steps.push(...elimResult.steps);
    }

    return { ranked, steps };
  }

  steps.push({
    rule: 'Coin Toss',
    detail: 'All tiebreaker rules exhausted — coin toss',
    survivors: remaining,
    tieBroken: false,
  });

  return { ranked: [...remaining], steps };
};
