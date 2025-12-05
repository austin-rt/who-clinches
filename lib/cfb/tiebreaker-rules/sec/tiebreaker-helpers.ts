import { GameLean } from '../../../types';
import { StandingEntry, TieLog, TieStep } from '../../../api-types';

const EPSILON = 0.0001;
const OFFENSIVE_PCT_CAP = 200;
const DEFENSIVE_PCT_MIN = 0;

export const applyOverrides = (
  games: GameLean[],
  overrides: { [gameId: string]: { homeScore: number; awayScore: number } }
): GameLean[] => {
  return games.map((game) => {
    const override = overrides[game.espnId];

    if (override) {
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
    }

    if (game.home.score !== null && game.away.score !== null) {
      return game;
    }

    if (game.predictedScore) {
      return {
        ...game,
        home: { ...game.home, score: game.predictedScore.home },
        away: { ...game.away, score: game.predictedScore.away },
      };
    }

    throw new Error(
      `Game ${game.espnId} has no scores and no predictedScore. All games must have scores for tiebreaker calculations.`
    );
  });
};

const getTeamAbbrev = (teamId: string, games: GameLean[]): string => {
  const game = games.find((g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId);
  return game?.home.teamEspnId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
};

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

export const applyRuleAHeadToHead = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const h2hGames = games.filter(
    (g) => tiedTeams.includes(g.home.teamEspnId) && tiedTeams.includes(g.away.teamEspnId)
  );

  if (h2hGames.length === 0) {
    return { winners: tiedTeams, detail: 'No head-to-head games played' };
  }

  const records = tiedTeams.map((teamId) => ({
    teamId,
    ...getTeamRecord(teamId, h2hGames),
  }));

  const maxWinPct = Math.max(...records.map((r) => r.winPct));
  const winners = records
    .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON)
    .map((r) => r.teamId);

  const getTeamAbbrev = (teamId: string): string => {
    const game = games.find((g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId);
    return game?.home.teamEspnId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
  };

  const winnersSet = new Set(winners);
  const beatMap = new Map<string, string[]>();

  for (const game of h2hGames) {
    if (game.home.score === null || game.away.score === null) continue;

    const homeId = game.home.teamEspnId;
    const awayId = game.away.teamEspnId;
    const homeAbbrev = getTeamAbbrev(homeId);
    const awayAbbrev = getTeamAbbrev(awayId);

    if (game.home.score > game.away.score) {
      if (winnersSet.has(homeId)) {
        if (!beatMap.has(homeId)) {
          beatMap.set(homeId, []);
        }
        beatMap.get(homeId)!.push(awayAbbrev);
      }
    } else {
      if (winnersSet.has(awayId)) {
        if (!beatMap.has(awayId)) {
          beatMap.set(awayId, []);
        }
        beatMap.get(awayId)!.push(homeAbbrev);
      }
    }
  }

  const detailParts: string[] = [];
  for (const [winnerId, beatenTeams] of beatMap.entries()) {
    if (beatenTeams.length > 0) {
      const winnerAbbrev = getTeamAbbrev(winnerId);
      const beatenStr =
        beatenTeams.length === 1
          ? beatenTeams[0]
          : beatenTeams.slice(0, -1).join(', ') + ' and ' + beatenTeams[beatenTeams.length - 1];
      detailParts.push(`${winnerAbbrev} Beat ${beatenStr}`);
    }
  }

  const detail = detailParts.length > 0 ? detailParts.join(', ') : 'No head-to-head games played';

  return { winners, detail };
};

export const applyRuleBCommonOpponents = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const opponentSets = tiedTeams.map((teamId) => {
    const teamGames = games.filter(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    );
    return new Set(
      teamGames.map((g) => (g.home.teamEspnId === teamId ? g.away.teamEspnId : g.home.teamEspnId))
    );
  });

  const commonOpponents = [...opponentSets[0]].filter((opp) =>
    opponentSets.every((set) => set.has(opp))
  );

  if (commonOpponents.length === 0) {
    return { winners: tiedTeams, detail: 'No common opponents' };
  }

  const records = tiedTeams.map((teamId) => {
    const vsCommonGames = games.filter(
      (g) =>
        (g.home.teamEspnId === teamId && commonOpponents.includes(g.away.teamEspnId)) ||
        (g.away.teamEspnId === teamId && commonOpponents.includes(g.home.teamEspnId))
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

  return { winners, detail };
};

export const applyRuleCHighestPlacedOpponent = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams: string[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const preliminaryStandings = allTeams
    .map((teamId) => ({
      teamId,
      ...getTeamRecord(teamId, games),
    }))
    .sort((a, b) => {
      if (Math.abs(b.winPct - a.winPct) > EPSILON) return b.winPct - a.winPct;
      return b.wins - a.wins;
    });

  const opponentSets = tiedTeams.map((teamId) => {
    const teamGames = games.filter(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    );
    return new Set(
      teamGames.map((g) => (g.home.teamEspnId === teamId ? g.away.teamEspnId : g.home.teamEspnId))
    );
  });

  const commonOpponents = [...opponentSets[0]].filter((opp) =>
    opponentSets.every((set) => set.has(opp))
  );

  if (commonOpponents.length === 0) {
    return { winners: tiedTeams, detail: 'No common opponents' };
  }

  const opponentGroups: string[][] = [];
  let currentGroup: string[] = [];
  let currentWinPct: number | null = null;
  let currentWins: number | null = null;

  for (const team of preliminaryStandings) {
    if (commonOpponents.includes(team.teamId)) {
      if (
        currentWinPct === null ||
        Math.abs(team.winPct - currentWinPct) > EPSILON ||
        team.wins !== currentWins
      ) {
        if (currentGroup.length > 0) {
          opponentGroups.push(currentGroup);
        }
        currentGroup = [team.teamId];
        currentWinPct = team.winPct;
        currentWins = team.wins;
      } else {
        currentGroup.push(team.teamId);
      }
    }
  }
  if (currentGroup.length > 0) {
    opponentGroups.push(currentGroup);
  }

  for (const opponentGroup of opponentGroups) {
    const commonInGroup = opponentGroup.filter((opp) => commonOpponents.includes(opp));

    if (commonInGroup.length === 0) continue;

    if (commonInGroup.length === 1) {
      const oppId = commonInGroup[0];
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

      if (Math.abs(maxWinPct - minWinPct) > EPSILON) {
        const winners = records
          .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON)
          .map((r) => r.teamId);

        const oppGame = games.find(
          (g) => g.home.teamEspnId === oppId || g.away.teamEspnId === oppId
        );
        const oppAbbrev =
          oppGame?.home.teamEspnId === oppId ? oppGame.home.abbrev : oppGame?.away.abbrev || oppId;

        const detail = `Record vs ${oppAbbrev}`;

        return { winners, detail };
      }
    } else {
      const tiedOpponents = commonInGroup;

      let resolvedOpponents: string[] = [];
      if (tiedOpponents.length === 2) {
        const h2hGame = games.find(
          (g) =>
            (g.home.teamEspnId === tiedOpponents[0] && g.away.teamEspnId === tiedOpponents[1]) ||
            (g.home.teamEspnId === tiedOpponents[1] && g.away.teamEspnId === tiedOpponents[0])
        );
        if (h2hGame && h2hGame.home.score !== null && h2hGame.away.score !== null) {
          if (h2hGame.home.score > h2hGame.away.score) {
            resolvedOpponents = [h2hGame.home.teamEspnId];
          } else {
            resolvedOpponents = [h2hGame.away.teamEspnId];
          }
        }
      } else if (tiedOpponents.length > 2) {
        const h2hResult = applyRuleAHeadToHead(tiedOpponents, games);
        if (h2hResult.winners.length < tiedOpponents.length) {
          resolvedOpponents = h2hResult.winners;
        }
      }

      const opponentsToUse = resolvedOpponents.length > 0 ? resolvedOpponents : tiedOpponents;

      const records = tiedTeams.map((teamId) => {
        const vsTiedOppGames = games.filter(
          (g) =>
            (opponentsToUse.includes(g.home.teamEspnId) && g.away.teamEspnId === teamId) ||
            (opponentsToUse.includes(g.away.teamEspnId) && g.home.teamEspnId === teamId)
        );
        return {
          teamId,
          ...getTeamRecord(teamId, vsTiedOppGames),
        };
      });

      const maxWinPct = Math.max(...records.map((r) => r.winPct));
      const minWinPct = Math.min(...records.map((r) => r.winPct));

      if (Math.abs(maxWinPct - minWinPct) > EPSILON) {
        const winners = records
          .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON)
          .map((r) => r.teamId);

        const oppAbbrevs = opponentsToUse.map((oppId) => {
          const oppGame = games.find(
            (g) => g.home.teamEspnId === oppId || g.away.teamEspnId === oppId
          );
          return oppGame?.home.teamEspnId === oppId
            ? oppGame.home.abbrev
            : oppGame?.away.abbrev || oppId;
        });

        const detail =
          resolvedOpponents.length > 0
            ? `Record vs ${oppAbbrevs.join(', ')}`
            : `Combined record vs ${oppAbbrevs.join(', ')}`;

        return { winners, detail };
      }
    }
  }

  return { winners: tiedTeams, detail: 'Tied vs all common opponents' };
};

export const applyRuleDOpponentWinPercentage = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const records = tiedTeams.map((teamId) => {
    const teamGames = games.filter(
      (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
    );

    const opponents = teamGames.map((g) =>
      g.home.teamEspnId === teamId ? g.away.teamEspnId : g.home.teamEspnId
    );

    let totalWins = 0;
    let totalGames = 0;
    const opponentDetails: string[] = [];

    for (const oppId of opponents) {
      const oppRecord = getTeamRecord(oppId, games);
      const oppGame = games.find((g) => g.home.teamEspnId === oppId || g.away.teamEspnId === oppId);
      const oppAbbrev =
        oppGame?.home.teamEspnId === oppId ? oppGame.home.abbrev : oppGame?.away.abbrev || oppId;
      totalWins += oppRecord.wins;
      totalGames += oppRecord.wins + oppRecord.losses;
      opponentDetails.push(`${oppAbbrev}(${oppRecord.wins}-${oppRecord.losses})`);
    }

    const oppWinPct = totalGames === 0 ? 0 : totalWins / totalGames;

    return { teamId, oppWinPct };
  });

  const maxOppWinPct = Math.max(...records.map((r) => r.oppWinPct));
  const winners = records
    .filter((r) => Math.abs(r.oppWinPct - maxOppWinPct) < EPSILON)
    .map((r) => r.teamId);

  const detail = `${(maxOppWinPct * 100).toFixed(1)}%`;

  return { winners, detail };
};

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

export const applyRuleEScoringMargin = (
  tiedTeams: string[],
  games: GameLean[]
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

      const teamScore = isHome ? game.home.score : game.away.score;
      const oppScore = isHome ? game.away.score : game.home.score;

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

    const avgMargin = teamGames.length === 0 ? 0 : totalMargin / teamGames.length;

    return { teamId, avgMargin };
  });

  const maxMargin = Math.max(...margins.map((m) => m.avgMargin));
  const winners = margins
    .filter((m) => Math.abs(m.avgMargin - maxMargin) < EPSILON)
    .map((m) => m.teamId);

  const detail = `Best relative scoring margin: ${maxMargin.toFixed(2)}`;

  return { winners, detail };
};

export const breakTie = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams: string[],
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

    const ruleA = applyRuleAHeadToHead(remaining, games);
    const ruleATieBroken = ruleA.winners.length < remaining.length;
    steps.push({
      rule: 'Head-to-Head',
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
        const eliminatedResult = breakTie(eliminated, games, allTeams, explanations, true);
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

    const ruleB = applyRuleBCommonOpponents(remaining, games);
    const ruleBTieBroken = ruleB.winners.length < remaining.length;
    steps.push({
      rule: 'Common Opponents',
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
        const eliminatedResult = breakTie(eliminated, games, allTeams, explanations, true);
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleB.winners;
      continue;
    }

    const ruleC = applyRuleCHighestPlacedOpponent(remaining, games, allTeams);
    const ruleCTieBroken = ruleC.winners.length < remaining.length;
    steps.push({
      rule: 'Highest Placed Common Opponent',
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
        const eliminatedResult = breakTie(eliminated, games, allTeams, explanations, true);
        ranked.push(...eliminatedResult.ranked);
        steps.push(...eliminatedResult.steps);
      } else {
        ranked.push(...eliminated);
      }

      remaining = ruleC.winners;
      continue;
    }

    const ruleD = applyRuleDOpponentWinPercentage(remaining, games);
    const ruleDTieBroken = ruleD.winners.length < remaining.length;
    steps.push({
      rule: 'Opponent Win Percentage',
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
        const eliminatedResult = breakTie(eliminated, games, allTeams, explanations, true);
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

    const ruleE = applyRuleEScoringMargin(remaining, games);
    const ruleETieBroken = ruleE.winners.length < remaining.length;
    steps.push({
      rule: 'Scoring Margin',
      detail: ruleE.detail,
      survivors: ruleE.winners,
      tieBroken: ruleETieBroken,
      label: ruleETieBroken ? 'Advances' : 'Remaining',
    });

    if (ruleE.winners.length < remaining.length) {
      const eliminated = remaining.filter((t) => !ruleE.winners.includes(t));

      if (!isRecursive) {
        eliminated.forEach((teamId) => {
          if (!explanations.has(teamId)) {
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
          }
        });
      }

      if (eliminated.length > 1) {
        const eliminatedResult = breakTie(eliminated, games, allTeams, explanations, true);
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

export const calculateStandingsFromCompletedGames = (
  games: GameLean[],
  allTeams: string[]
): { standings: StandingEntry[]; tieLogs: TieLog[] } => {
  return calculateStandings(games, allTeams);
};

export const calculateStandings = (
  games: GameLean[],
  allTeams: string[]
): { standings: StandingEntry[]; tieLogs: TieLog[] } => {
  const explanations = new Map<string, string[]>();
  const tieLogs: TieLog[] = [];

  const teamRecords = allTeams.map((teamId) => ({
    teamId,
    ...getTeamRecord(teamId, games),
  }));

  const winPctGroups = new Map<number, string[]>();
  for (const record of teamRecords) {
    const pct = Math.round(record.winPct * 10000) / 10000;
    if (!winPctGroups.has(pct)) {
      winPctGroups.set(pct, []);
    }
    winPctGroups.get(pct)!.push(record.teamId);
  }

  const sortedGroups = [...winPctGroups.entries()].sort((a, b) => b[0] - a[0]);

  const orderedTeams: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_winPct, tiedTeams] of sortedGroups) {
    if (tiedTeams.length === 1) {
      orderedTeams.push(tiedTeams[0]);
    } else {
      const tieResult = breakTie(tiedTeams, games, allTeams, explanations);
      orderedTeams.push(...tieResult.ranked);

      const tiedTeamAbbrevs = tieResult.ranked.map((teamId) => {
        const game = games.find(
          (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
        );
        return game?.home.teamEspnId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
      });

      const stepsWithAbbrevs = tieResult.steps.map((step) => ({
        ...step,
        survivors: step.survivors.map((teamId) => {
          const game = games.find(
            (g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId
          );
          return game?.home.teamEspnId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
        }),
      }));

      tieLogs.push({
        teams: tiedTeamAbbrevs,
        steps: stepsWithAbbrevs,
      });
    }
  }

  const standings: StandingEntry[] = orderedTeams.map((teamId, index) => {
    const record = teamRecords.find((r) => r.teamId === teamId)!;
    const game = games.find((g) => g.home.teamEspnId === teamId || g.away.teamEspnId === teamId)!;

    const team = game.home.teamEspnId === teamId ? game.home : game.away;

    const recordKey = `${record.wins}-${record.losses}`;
    const teamsWithSameRecord = orderedTeams
      .map((tid, idx) => ({
        teamId: tid,
        rank: idx + 1,
        record: teamRecords.find((r) => r.teamId === tid)!,
      }))
      .filter((t) => `${t.record.wins}-${t.record.losses}` === recordKey);

    let explainPosition = '';

    if (teamsWithSameRecord.length > 1) {
      const currentIndex = teamsWithSameRecord.findIndex((t) => t.teamId === teamId);
      const teamsAbove = teamsWithSameRecord.slice(0, currentIndex);
      const teamsBelow = teamsWithSameRecord.slice(currentIndex + 1);

      const getTeamShortNameFromId = (tid: string) => {
        const g = games.find((g) => g.home.teamEspnId === tid || g.away.teamEspnId === tid);
        if (!g) {
          return tid;
        }

        const shortDisplayName =
          g.home.teamEspnId === tid
            ? g.home.shortDisplayName || g.home.displayName || g.home.abbrev
            : g.away.shortDisplayName || g.away.displayName || g.away.abbrev || tid;

        return shortDisplayName || tid;
      };

      const findTieLog = () => {
        return tieLogs.find((log) => {
          const teamAbbrevs = teamsWithSameRecord.map((t) => {
            const g = games.find(
              (g) => g.home.teamEspnId === t.teamId || g.away.teamEspnId === t.teamId
            );
            return g?.home.teamEspnId === t.teamId ? g.home.abbrev : g?.away.abbrev || t.teamId;
          });
          return teamAbbrevs.every((abbrev) => log.teams.includes(abbrev));
        });
      };

      const tieLog = findTieLog();

      const findSeparatingStep = (team1Id: string, team2Id: string): number | null => {
        if (!tieLog) return null;

        const getAbbrev = (tid: string) => {
          const g = games.find((g) => g.home.teamEspnId === tid || g.away.teamEspnId === tid);
          return g?.home.teamEspnId === tid ? g.home.abbrev : g?.away.abbrev || tid;
        };

        const team1Abbrev = getAbbrev(team1Id);
        const team2Abbrev = getAbbrev(team2Id);

        let activeTeams = new Set(tieLog.teams);

        for (let i = 0; i < tieLog.steps.length; i++) {
          const step = tieLog.steps[i];
          const survivors = new Set(step.survivors);

          const bothActive = activeTeams.has(team1Abbrev) && activeTeams.has(team2Abbrev);

          if (bothActive) {
            const team1Survived = survivors.has(team1Abbrev);
            const team2Survived = survivors.has(team2Abbrev);

            if (team1Survived !== team2Survived) {
              return i;
            }
          }

          activeTeams = survivors;
        }

        return null;
      };

      const getReasonFromStep = (stepIndex: number): { reason: string; reasonValue: string } => {
        if (!tieLog || stepIndex < 0 || stepIndex >= tieLog.steps.length) {
          return { reason: '', reasonValue: '' };
        }

        const step = tieLog.steps[stepIndex];
        let reason = '';
        let reasonValue = '';

        if (step.rule.includes('Head-to-Head')) {
          reason = 'head-to-head record';
        } else if (step.rule.includes('Common Opponents')) {
          reason = 'record vs common opponents';
        } else if (step.rule.includes('Highest Placed')) {
          const oppMatch = step.detail.match(/Record vs (.+)/);
          if (oppMatch) {
            reason = `record against highest-placed common opponent (${oppMatch[1]})`;
          } else {
            reason = 'record against highest-placed common opponent';
          }
        } else if (step.rule.includes('Opponent Win Percentage')) {
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
          const teamOppWinPct = totalGames === 0 ? 0 : totalWins / totalGames;
          reason = 'conference opponent win percentage';
          reasonValue = ` (${teamOppWinPct.toFixed(4)})`;
        } else if (step.rule.includes('Scoring Margin')) {
          reason = 'scoring margin';
        } else {
          reason = step.detail.toLowerCase();
        }

        return { reason, reasonValue };
      };

      const parts: string[] = [];

      if (teamsAbove.length > 0) {
        const teamsByStep = new Map<number, string[]>();

        for (const otherTeam of teamsAbove) {
          const stepIndex = findSeparatingStep(teamId, otherTeam.teamId);
          if (stepIndex !== null) {
            if (!teamsByStep.has(stepIndex)) {
              teamsByStep.set(stepIndex, []);
            }
            teamsByStep.get(stepIndex)!.push(otherTeam.teamId);
          }
        }

        const sortedSteps = Array.from(teamsByStep.entries()).sort((a, b) => a[0] - b[0]);

        for (const [stepIndex, teamIds] of sortedSteps) {
          const { reason, reasonValue } = getReasonFromStep(stepIndex);
          if (reason) {
            const teamNames = teamIds.map((tid) => getTeamShortNameFromId(tid));
            parts.push(`Behind ${teamNames.join(' and ')} based on ${reason}${reasonValue}.`);
          }
        }
      }

      if (teamsBelow.length > 0) {
        const teamsByStep = new Map<number, string[]>();

        for (const otherTeam of teamsBelow) {
          const stepIndex = findSeparatingStep(teamId, otherTeam.teamId);
          if (stepIndex !== null) {
            if (!teamsByStep.has(stepIndex)) {
              teamsByStep.set(stepIndex, []);
            }
            teamsByStep.get(stepIndex)!.push(otherTeam.teamId);
          }
        }

        const sortedSteps = Array.from(teamsByStep.entries()).sort((a, b) => a[0] - b[0]);

        for (const [stepIndex, teamIds] of sortedSteps) {
          const { reason, reasonValue } = getReasonFromStep(stepIndex);
          if (reason) {
            const teamNames = teamIds.map((tid) => getTeamShortNameFromId(tid));
            parts.push(`Ahead of ${teamNames.join(' and ')} based on ${reason}${reasonValue}.`);
          }
        }
      }

      explainPosition = parts.join(' ');
    }

    return {
      rank: index + 1,
      teamId,
      abbrev: team.abbrev,
      displayName: team.displayName || team.abbrev || 'Unknown',
      logo: team.logo || '',
      color: team.color || '000000',
      record: { wins: record.wins, losses: record.losses },
      confRecord: { wins: record.wins, losses: record.losses },
      explainPosition,
    };
  });

  return { standings, tieLogs };
};
