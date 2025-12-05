import { GameLean } from '../../../types';
import { TieStep } from '../../../api-types';
import { ConferenceTiebreakerConfig } from './types';
import { getTeamRecord, getTeamAbbrev } from '../common/core-helpers';
import { getTeamAvgPointsFor, getTeamAvgPointsAgainst } from '../sec/rule-e-sec-scoring-margin';

export const breakTie = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams: string[],
  config: ConferenceTiebreakerConfig,
  explanations: Map<string, string[]>,
  isRecursive = false
): { ranked: string[]; steps: TieStep[] } => {
  if (tiedTeams.length <= 1) {
    return { ranked: tiedTeams, steps: [] };
  }

  const steps: TieStep[] = [];
  const ranked: string[] = [];
  let remaining = [...tiedTeams];

  while (remaining.length > 0) {
    if (remaining.length === 1) {
      steps.push({
        rule: 'Final Position',
        detail: 'Ranked last in tie',
        survivors: remaining,
        tieBroken: false,
        label: 'Ranked last',
      });
      ranked.push(remaining[0]);
      break;
    }

    const ruleA = config.rules[0].apply(remaining, games, allTeams);
    const ruleATieBroken = ruleA.winners.length < remaining.length;
    steps.push({
      rule: config.rules[0].name,
      detail: ruleA.detail,
      survivors: ruleA.winners,
      tieBroken: ruleATieBroken,
      label: ruleATieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleA.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleA.winners.includes(t));

      if (!isRecursive) {
        const h2hGames = games.filter(
          (g) => remaining.includes(g.home.teamEspnId) && remaining.includes(g.away.teamEspnId)
        );
        eliminated.forEach((teamId) => {
          if (!explanations.has(teamId)) {
            const record = getTeamRecord(teamId, h2hGames);
            const lostTo: string[] = [];
            h2hGames.forEach((game) => {
              if (
                game.home.teamEspnId === teamId &&
                game.home.score !== null &&
                game.away.score !== null &&
                game.home.score < game.away.score
              ) {
                lostTo.push(getTeamAbbrev(game.away.teamEspnId, games));
              } else if (
                game.away.teamEspnId === teamId &&
                game.home.score !== null &&
                game.away.score !== null &&
                game.away.score < game.home.score
              ) {
                lostTo.push(getTeamAbbrev(game.home.teamEspnId, games));
              }
            });
            const opponentText = lostTo.length > 0 ? ` to ${lostTo.join(', ')}` : '';
            explanations.set(teamId, [
              `Lost head-to-head tiebreaker${opponentText} (${record.wins}-${record.losses})`,
            ]);
          }
        });
      }

      if (ruleA.winners.length === 1) {
        ranked.push(ruleA.winners[0]);
      }

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(eliminated, games, allTeams, config, explanations, true);
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else if (eliminated.length === 1) {
        ranked.push(eliminated[0]);
      }

      if (ruleA.winners.length > 1) {
        remaining = ruleA.winners;
        continue;
      } else {
        break;
      }
    }

    const ruleB = config.rules[1].apply(remaining, games, allTeams);
    const ruleBTieBroken = ruleB.winners.length < remaining.length;
    steps.push({
      rule: config.rules[1].name,
      detail: ruleB.detail,
      survivors: ruleB.winners,
      tieBroken: ruleBTieBroken,
      label: ruleBTieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleB.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleB.winners.includes(t));

      if (!isRecursive) {
        eliminated.forEach((teamId) => {
          if (!explanations.has(teamId)) {
            const opponentSets = remaining.map((t) => {
              const teamGames = games.filter(
                (g) => g.home.teamEspnId === t || g.away.teamEspnId === t
              );
              return new Set(
                teamGames.map((g) =>
                  g.home.teamEspnId === t ? g.away.teamEspnId : g.home.teamEspnId
                )
              );
            });
            const commonOpponents = [...opponentSets[0]].filter((opp) =>
              opponentSets.every((set) => set.has(opp))
            );
            const vsCommonGames = games.filter(
              (g) =>
                (g.home.teamEspnId === teamId && commonOpponents.includes(g.away.teamEspnId)) ||
                (g.away.teamEspnId === teamId && commonOpponents.includes(g.home.teamEspnId))
            );
            const record = getTeamRecord(teamId, vsCommonGames);
            explanations.set(teamId, [
              `Worse record vs common opponents (${record.wins}-${record.losses})`,
            ]);
          }
        });
      }

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(eliminated, games, allTeams, config, explanations, true);
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleB.winners;
      continue;
    }

    const ruleC = config.rules[2].apply(remaining, games, allTeams);
    const ruleCTieBroken = ruleC.winners.length < remaining.length;
    steps.push({
      rule: config.rules[2].name,
      detail: ruleC.detail,
      survivors: ruleC.winners,
      tieBroken: ruleCTieBroken,
      label: ruleCTieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleC.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleC.winners.includes(t));

      if (!isRecursive) {
        eliminated.forEach((teamId) => {
          if (!explanations.has(teamId)) {
            const oppMatch = ruleC.detail.match(/Record vs (\w+)/);
            const oppAbbrev = oppMatch ? oppMatch[1] : 'common opponent';
            explanations.set(teamId, [`Lost to highest-placed common opponent (${oppAbbrev})`]);
          }
        });
      }

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(eliminated, games, allTeams, config, explanations, true);
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleC.winners;
      continue;
    }

    const ruleD = config.rules[3].apply(remaining, games, allTeams);
    const ruleDTieBroken = ruleD.winners.length < remaining.length;
    steps.push({
      rule: config.rules[3].name,
      detail: ruleD.detail,
      survivors: ruleD.winners,
      tieBroken: ruleDTieBroken,
      label: ruleDTieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleD.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleD.winners.includes(t));

      if (!isRecursive) {
        eliminated.forEach((teamId) => {
          if (!explanations.has(teamId)) {
            const teamGames = games.filter(
              (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
            );
            const opponents = teamGames.map((g) =>
              g.home.teamEspnId === teamId ? g.away.teamEspnId : g.home.teamEspnId
            );
            let totalWins = 0;
            let totalGames = 0;
            for (const oppId of opponents) {
              const oppRecord = getTeamRecord(oppId, games);
              totalWins += oppRecord.wins;
              totalGames += oppRecord.wins + oppRecord.losses;
            }
            const teamOppWinPct = totalGames === 0 ? 0 : (totalWins / totalGames) * 100;
            explanations.set(teamId, [`Lower opponent win% (${teamOppWinPct.toFixed(1)}%)`]);
          }
        });
      }

      if (ruleD.winners.length === 1) {
        ranked.push(ruleD.winners[0]);
      }

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(eliminated, games, allTeams, config, explanations, true);
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else if (eliminated.length === 1) {
        ranked.push(eliminated[0]);
      }

      if (ruleD.winners.length > 1) {
        remaining = ruleD.winners;
        continue;
      } else {
        break;
      }
    }

    const ruleE = config.rules[4].apply(remaining, games, allTeams);
    const ruleETieBroken = ruleE.winners.length < remaining.length;
    steps.push({
      rule: config.rules[4].name,
      detail: ruleE.detail,
      survivors: ruleE.winners,
      tieBroken: ruleETieBroken,
      label: ruleETieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleE.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleE.winners.includes(t));

      if (!isRecursive) {
        for (const teamId of eliminated) {
          if (!explanations.has(teamId)) {
            if (config.rules[4].name === 'Scoring Margin') {
              const OFFENSIVE_PCT_CAP = 200;
              const DEFENSIVE_PCT_MIN = 0;
              const teamGames = games.filter(
                (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
              );
              let totalMargin = 0;
              for (const game of teamGames) {
                if (game.home.score === null || game.away.score === null) continue;
                const isHome = game.home.teamEspnId === teamId;
                const teamScore = isHome ? game.home.score : game.away.score;
                const oppScore = isHome ? game.away.score : game.home.score;
                const oppId = isHome ? game.away.teamEspnId : game.home.teamEspnId;
                const oppAvgFor = getTeamAvgPointsFor(oppId, games);
                const oppAvgAgainst = getTeamAvgPointsAgainst(oppId, games);
                const offensivePct =
                  oppAvgAgainst > 0
                    ? Math.min((teamScore / oppAvgAgainst) * 100, OFFENSIVE_PCT_CAP)
                    : OFFENSIVE_PCT_CAP;
                const defensivePct =
                  oppAvgFor > 0 ? Math.max((oppScore / oppAvgFor) * 100, DEFENSIVE_PCT_MIN) : 0;
                const gameMargin = offensivePct - defensivePct;
                totalMargin += gameMargin;
              }
              const avgMargin = teamGames.length > 0 ? totalMargin / teamGames.length : 0;
              explanations.set(teamId, [`Lower scoring margin (${avgMargin.toFixed(1)})`]);
            } else if (config.rules[4].name.includes('Team Rating Score')) {
              const ratingMatch = ruleE.detail.match(/Best Team Rating Score: ([\d.]+)/);
              const ratingValue = ratingMatch ? ratingMatch[1] : '0.0';
              explanations.set(teamId, [`Lower Team Rating Score (${ratingValue})`]);
            }
          }
        }
      }

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(eliminated, games, allTeams, config, explanations, true);
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleE.winners;
      continue;
    }

    steps.push({
      rule: 'Unresolved',
      detail: 'overall conf record',
      survivors: remaining,
      tieBroken: false,
      label: 'Remaining',
    });
    ranked.push(...remaining);
    break;
  }

  return { ranked, steps };
};
