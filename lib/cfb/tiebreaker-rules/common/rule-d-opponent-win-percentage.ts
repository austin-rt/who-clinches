import { GameLean } from '../../../types';
import { getTeamRecord, EPSILON_CONSTANT } from './core-helpers';

export const applyRuleDOpponentWinPercentage = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const records = tiedTeams.map((teamId) => {
    const teamGames = games.filter((g) => g.home.teamId === teamId || g.away.teamId === teamId);

    const opponents = teamGames.map((g) =>
      g.home.teamId === teamId ? g.away.teamId : g.home.teamId
    );

    let totalWins = 0;
    let totalGames = 0;
    const opponentDetails: string[] = [];

    for (const oppId of opponents) {
      const oppRecord = getTeamRecord(oppId, games);
      const oppGame = games.find((g) => g.home.teamId === oppId || g.away.teamId === oppId);
      const oppAbbrev =
        oppGame?.home.teamId === oppId ? oppGame.home.abbrev : oppGame?.away.abbrev || oppId;
      totalWins += oppRecord.wins;
      totalGames += oppRecord.wins + oppRecord.losses;
      opponentDetails.push(`${oppAbbrev}(${oppRecord.wins}-${oppRecord.losses})`);
    }

    const oppWinPct = totalGames === 0 ? 0 : totalWins / totalGames;

    return { teamId, oppWinPct };
  });

  const maxOppWinPct = Math.max(...records.map((r) => r.oppWinPct));
  const winners = records
    .filter((r) => Math.abs(r.oppWinPct - maxOppWinPct) < EPSILON_CONSTANT)
    .map((r) => r.teamId);

  const getAbbrev = (teamId: string) => {
    const game = games.find((g) => g.home.teamId === teamId || g.away.teamId === teamId);
    return game?.home.teamId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
  };

  const detail = records
    .sort((a, b) => b.oppWinPct - a.oppWinPct)
    .map((r) => `${getAbbrev(r.teamId)} ${(r.oppWinPct * 100).toFixed(1)}%`)
    .join(', ');

  return { winners, detail };
};
