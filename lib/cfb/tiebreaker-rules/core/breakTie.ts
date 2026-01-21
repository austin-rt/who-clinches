import { GameLean, TeamLean } from '../../../types';
import { TieStep } from '../../../api-types';
import { CFBConferenceTiebreakerConfig } from './types';
import { getTeamRecord, getTeamAbbrev } from '../common/core-helpers';
import { getTeamAvgPointsFor, getTeamAvgPointsAgainst } from '../sec/rule-e-sec-scoring-margin';

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

    const ruleAResult = await config.rules[0].apply(remaining, games);
    const ruleATieBroken = ruleAResult.winners.length < remaining.length;
    steps.push({
      rule: config.rules[0].name,
      detail: ruleAResult.detail,
      survivors: ruleAResult.winners,
      tieBroken: ruleATieBroken,
      label: ruleATieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleAResult.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleAResult.winners.includes(t));

      if (!isRecursive) {
        const h2hGames = games.filter(
          (g) => remaining.includes(g.home.teamId) && remaining.includes(g.away.teamId)
        );
        eliminated.forEach((teamId) => {
          if (!explanations.has(teamId)) {
            const record = getTeamRecord(teamId, h2hGames);
            const lostTo: string[] = [];
            h2hGames.forEach((game) => {
              if (
                game.home.teamId === teamId &&
                game.home.score !== null &&
                game.away.score !== null &&
                game.home.score < game.away.score
              ) {
                lostTo.push(getTeamAbbrev(game.away.teamId, games));
              } else if (
                game.away.teamId === teamId &&
                game.home.score !== null &&
                game.away.score !== null &&
                game.away.score < game.home.score
              ) {
                lostTo.push(getTeamAbbrev(game.home.teamId, games));
              }
            });
            const opponentText = lostTo.length > 0 ? ` to ${lostTo.join(', ')}` : '';
            explanations.set(teamId, [
              `Lost head-to-head tiebreaker${opponentText} (${record.wins}-${record.losses})`,
            ]);
          }
        });
      }

      if (ruleAResult.winners.length === 1) {
        ranked.push(ruleAResult.winners[0]);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (ruleAResult.winners.length > 1) {
        const advancingResult = await breakTie(
          ruleAResult.winners,
          games,
          allTeams,
          config,
          explanations,
          false,
          teams
        );
        ranked.push(...advancingResult.ranked);
        steps.push(...advancingResult.steps);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (eliminated.length > 1) {
        const eliminatedResult = await breakTie(
          eliminated,
          games,
          allTeams,
          config,
          explanations,
          true,
          teams
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else if (eliminated.length === 1) {
        ranked.push(eliminated[0]);
      }
      break;
    }

    const ruleBResult = config.rules[1].name.includes('Team Rating Score')
      ? await config.rules[1].apply(
          remaining,
          games,
          allTeams,
          teams,
          config.useCfpRankingsFirst ?? false
        )
      : await config.rules[1].apply(remaining, games);
    const ruleBTieBroken = ruleBResult.winners.length < remaining.length;
    steps.push({
      rule: config.rules[1].name,
      detail: ruleBResult.detail,
      survivors: ruleBResult.winners,
      tieBroken: ruleBTieBroken,
      label: ruleBTieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleBResult.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleBResult.winners.includes(t));

      if (!isRecursive) {
        eliminated.forEach((teamId) => {
          if (!explanations.has(teamId)) {
            const opponentSets = remaining.map((t) => {
              const teamGames = games.filter((g) => g.home.teamId === t || g.away.teamId === t);
              return new Set(
                teamGames.map((g) => (g.home.teamId === t ? g.away.teamId : g.home.teamId))
              );
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
            explanations.set(teamId, [
              `Worse record vs common opponents (${record.wins}-${record.losses})`,
            ]);
          }
        });
      }

      if (ruleBResult.winners.length === 1) {
        ranked.push(ruleBResult.winners[0]);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (ruleBResult.winners.length > 1) {
        const advancingResult = await breakTie(
          ruleBResult.winners,
          games,
          allTeams,
          config,
          explanations,
          false,
          teams
        );
        ranked.push(...advancingResult.ranked);
        steps.push(...advancingResult.steps);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (eliminated.length > 1) {
        const eliminatedResult = await breakTie(
          eliminated,
          games,
          allTeams,
          config,
          explanations,
          true,
          teams
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else if (eliminated.length === 1) {
        ranked.push(eliminated[0]);
      }
      break;
    }

    const ruleCResult =
      config.rules[2].name.includes('Highest Placed') ||
      config.rules[2].name.includes('Team Rating Score')
        ? await config.rules[2].apply(
            remaining,
            games,
            allTeams,
            teams,
            config.useCfpRankingsFirst ?? false
          )
        : await config.rules[2].apply(remaining, games);
    const ruleCTieBroken = ruleCResult.winners.length < remaining.length;
    steps.push({
      rule: config.rules[2].name,
      detail: ruleCResult.detail,
      survivors: ruleCResult.winners,
      tieBroken: ruleCTieBroken,
      label: ruleCTieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleCResult.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleCResult.winners.includes(t));

      if (!isRecursive) {
        eliminated.forEach((teamId) => {
          if (!explanations.has(teamId)) {
            const oppMatch = ruleCResult.detail.match(/Record vs (\w+)/);
            const oppAbbrev = oppMatch ? oppMatch[1] : 'common opponent';
            explanations.set(teamId, [`Lost to highest-placed common opponent (${oppAbbrev})`]);
          }
        });
      }

      if (ruleCResult.winners.length === 1) {
        ranked.push(ruleCResult.winners[0]);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (ruleCResult.winners.length > 1) {
        const advancingResult = await breakTie(
          ruleCResult.winners,
          games,
          allTeams,
          config,
          explanations,
          false,
          teams
        );
        ranked.push(...advancingResult.ranked);
        steps.push(...advancingResult.steps);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (eliminated.length > 1) {
        const eliminatedResult = await breakTie(
          eliminated,
          games,
          allTeams,
          config,
          explanations,
          true,
          teams
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else if (eliminated.length === 1) {
        ranked.push(eliminated[0]);
      }
      break;
    }

    const ruleDResult = await config.rules[3].apply(remaining, games);
    const ruleDTieBroken = ruleDResult.winners.length < remaining.length;
    steps.push({
      rule: config.rules[3].name,
      detail: ruleDResult.detail,
      survivors: ruleDResult.winners,
      tieBroken: ruleDTieBroken,
      label: ruleDTieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleDResult.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleDResult.winners.includes(t));

      if (!isRecursive) {
        eliminated.forEach((teamId) => {
          if (!explanations.has(teamId)) {
            const teamGames = games.filter(
              (g) => g.home.teamId === teamId || g.away.teamId === teamId
            );
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
            const teamOppWinPct = totalGames === 0 ? 0 : (totalWins / totalGames) * 100;
            explanations.set(teamId, [`Lower opponent win% (${teamOppWinPct.toFixed(1)}%)`]);
          }
        });
      }

      if (ruleDResult.winners.length === 1) {
        ranked.push(ruleDResult.winners[0]);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (ruleDResult.winners.length > 1) {
        const advancingResult = await breakTie(
          ruleDResult.winners,
          games,
          allTeams,
          config,
          explanations,
          false,
          teams
        );
        ranked.push(...advancingResult.ranked);
        steps.push(...advancingResult.steps);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (eliminated.length > 1) {
        const eliminatedResult = await breakTie(
          eliminated,
          games,
          allTeams,
          config,
          explanations,
          true,
          teams
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else if (eliminated.length === 1) {
        ranked.push(eliminated[0]);
      }
      break;
    }

    const ruleEResult = config.rules[4].name.includes('Team Rating Score')
      ? await config.rules[4].apply(
          remaining,
          games,
          allTeams,
          teams,
          config.useCfpRankingsFirst ?? false
        )
      : await config.rules[4].apply(remaining, games);
    const ruleETieBroken = ruleEResult.winners.length < remaining.length;
    steps.push({
      rule: config.rules[4].name,
      detail: ruleEResult.detail,
      survivors: ruleEResult.winners,
      tieBroken: ruleETieBroken,
      label: ruleETieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleEResult.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleEResult.winners.includes(t));

      if (!isRecursive) {
        for (const teamId of eliminated) {
          if (!explanations.has(teamId)) {
            if (config.rules[4].name === 'Scoring Margin') {
              const OFFENSIVE_PCT_CAP = 200;
              const DEFENSIVE_PCT_MIN = 0;
              const teamGames = games.filter(
                (g) => g.home.teamId === teamId || g.away.teamId === teamId
              );
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
                const gameMargin = offensivePct - defensivePct;
                totalMargin += gameMargin;
              }
              const avgMargin = teamGames.length > 0 ? totalMargin / teamGames.length : 0;
              explanations.set(teamId, [`Lower scoring margin (${avgMargin.toFixed(1)})`]);
            } else if (config.rules[4].name.includes('Team Rating Score')) {
              const ratingMatch = ruleEResult.detail.match(/Best Team Rating Score: ([\d.]+)/);
              const ratingValue = ratingMatch ? ratingMatch[1] : '0.0';
              explanations.set(teamId, [`Lower Team Rating Score (${ratingValue})`]);
            }
          }
        }
      }

      if (ruleEResult.winners.length === 1) {
        ranked.push(ruleEResult.winners[0]);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (ruleEResult.winners.length > 1) {
        const advancingResult = await breakTie(
          ruleEResult.winners,
          games,
          allTeams,
          config,
          explanations,
          false,
          teams
        );
        ranked.push(...advancingResult.ranked);
        steps.push(...advancingResult.steps);
        if (eliminated.length > 1) {
          const eliminatedResult = await breakTie(
            eliminated,
            games,
            allTeams,
            config,
            explanations,
            true,
            teams
          );
          ranked.push(...eliminatedResult.ranked);
          steps.push(...eliminatedResult.steps);
        } else if (eliminated.length === 1) {
          ranked.push(eliminated[0]);
        }
        break;
      }

      if (eliminated.length > 1) {
        const eliminatedResult = await breakTie(
          eliminated,
          games,
          allTeams,
          config,
          explanations,
          true,
          teams
        );
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else if (eliminated.length === 1) {
        ranked.push(eliminated[0]);
      }
      break;
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
