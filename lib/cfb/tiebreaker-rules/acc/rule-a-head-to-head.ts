import { GameLean } from '../../../types';
import { getTeamRecord, getTeamAbbrev, EPSILON_CONSTANT } from '../common/core-helpers';

export const applyRuleAHeadToHead = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const h2hGames = games.filter(
    (g) => tiedTeams.includes(g.home.teamId) && tiedTeams.includes(g.away.teamId)
  );

  if (h2hGames.length === 0) {
    return { winners: tiedTeams, detail: 'No head-to-head games played' };
  }

  if (tiedTeams.length === 2) {
    const records = tiedTeams.map((teamId) => ({
      teamId,
      ...getTeamRecord(teamId, h2hGames),
    }));

    const maxWinPct = Math.max(...records.map((r) => r.winPct));
    const winners = records
      .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON_CONSTANT)
      .map((r) => r.teamId);

    const winnersSet = new Set(winners);
    const beatMap = new Map<string, string[]>();

    for (const game of h2hGames) {
      if (game.home.score === null || game.away.score === null) continue;

      const homeId = game.home.teamId;
      const awayId = game.away.teamId;
      const homeAbbrev = getTeamAbbrev(homeId, games);
      const awayAbbrev = getTeamAbbrev(awayId, games);

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
        const winnerAbbrev = getTeamAbbrev(winnerId, games);
        const beatenStr =
          beatenTeams.length === 1
            ? beatenTeams[0]
            : beatenTeams.slice(0, -1).join(', ') + ' and ' + beatenTeams[beatenTeams.length - 1];
        detailParts.push(`${winnerAbbrev} Beat ${beatenStr}`);
      }
    }

    const detail = detailParts.length > 0 ? detailParts.join(', ') : 'No head-to-head games played';

    return { winners, detail };
  }

  const opponentSets = tiedTeams.map((teamId) => {
    const teamGames = h2hGames.filter(
      (g) => g.home.teamId === teamId || g.away.teamId === teamId
    );
    return new Set(
      teamGames.map((g) => (g.home.teamId === teamId ? g.away.teamId : g.home.teamId))
    );
  });

  const allAreCommonOpponents = tiedTeams.every((teamId) => {
    const otherTeams = tiedTeams.filter((t) => t !== teamId);
    return otherTeams.every((otherId) => {
      const teamOpponents = opponentSets[tiedTeams.indexOf(teamId)];
      return teamOpponents.has(otherId);
    });
  });

  if (allAreCommonOpponents) {
    const records = tiedTeams.map((teamId) => ({
      teamId,
      ...getTeamRecord(teamId, h2hGames),
    }));

    const maxWinPct = Math.max(...records.map((r) => r.winPct));
    const winners = records
      .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON_CONSTANT)
      .map((r) => r.teamId);

    const detail = `Combined H2H: ${(maxWinPct * 100).toFixed(1)}%`;

    return { winners, detail };
  }

  const teamBeatMap = new Map<string, Set<string>>();
  for (const teamId of tiedTeams) {
    teamBeatMap.set(teamId, new Set());
  }

  for (const game of h2hGames) {
    if (game.home.score === null || game.away.score === null) continue;

    const homeId = game.home.teamId;
    const awayId = game.away.teamId;

    if (game.home.score > game.away.score) {
      teamBeatMap.get(homeId)!.add(awayId);
    } else {
      teamBeatMap.get(awayId)!.add(homeId);
    }
  }

  const teamsThatBeatAll = tiedTeams.filter((teamId) => {
    const beatSet = teamBeatMap.get(teamId)!;
    const otherTeams = tiedTeams.filter((t) => t !== teamId);
    return otherTeams.every((otherId) => beatSet.has(otherId));
  });

  if (teamsThatBeatAll.length > 0) {
    const winners = teamsThatBeatAll;
    const winnerAbbrevs = winners.map((tid) => getTeamAbbrev(tid, games));
    const detail = `${winnerAbbrevs.join(', ')} defeated all other tied teams`;

    return { winners, detail };
  }

  const teamsThatLostToAll = tiedTeams.filter((teamId) => {
    const otherTeams = tiedTeams.filter((t) => t !== teamId);
    return otherTeams.every((otherId) => {
      const otherBeatSet = teamBeatMap.get(otherId)!;
      return otherBeatSet.has(teamId);
    });
  });

  if (teamsThatLostToAll.length > 0) {
    const eliminated = teamsThatLostToAll;
    const winners = tiedTeams.filter((t) => !eliminated.includes(t));
    const eliminatedAbbrevs = eliminated.map((tid) => getTeamAbbrev(tid, games));
    const detail = `Eliminated: ${eliminatedAbbrevs.join(', ')} lost to all other tied teams`;

    return { winners, detail };
  }

  return { winners: tiedTeams, detail: 'No head-to-head resolution' };
};

