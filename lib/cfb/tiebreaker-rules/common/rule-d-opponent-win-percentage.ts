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
    .filter((r) => Math.abs(r.oppWinPct - maxOppWinPct) < EPSILON_CONSTANT)
    .map((r) => r.teamId);

  const detail = `${(maxOppWinPct * 100).toFixed(1)}%`;

  return { winners, detail };
};

