import { GameLean } from '../../../types';
import { getTeamRecord, EPSILON_CONSTANT, getTeamAbbrev } from './core-helpers';

export const applyRuleCommonNonDivisionalOpponents = (
  tiedTeams: string[],
  games: GameLean[]
): { winners: string[]; detail: string } => {
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const tiedTeamDivisions = new Set<string | null>();
  for (const teamId of tiedTeams) {
    for (const game of games) {
      if (game.home.teamId === teamId) {
        tiedTeamDivisions.add(game.home.division || null);
        break;
      } else if (game.away.teamId === teamId) {
        tiedTeamDivisions.add(game.away.division || null);
        break;
      }
    }
  }

  const tiedTeamDivision = tiedTeamDivisions.size === 1 ? Array.from(tiedTeamDivisions)[0] : null;

  if (!tiedTeamDivision) {
    return { winners: tiedTeams, detail: 'No divisional data available' };
  }

  const conferenceGames = games.filter((g) => g.conferenceGame === true);

  const opponentSets = tiedTeams.map((teamId) => {
    const teamGames = conferenceGames.filter(
      (g) => g.home.teamId === teamId || g.away.teamId === teamId
    );
    const nonDivisionalOpponents = teamGames
      .map((g) => {
        const oppId = g.home.teamId === teamId ? g.away.teamId : g.home.teamId;
        const oppDivision = g.home.teamId === teamId ? g.away.division : g.home.division;
        return { oppId, oppDivision };
      })
      .filter(({ oppDivision }) => oppDivision && oppDivision !== tiedTeamDivision)
      .map(({ oppId }) => oppId);
    return new Set(nonDivisionalOpponents);
  });

  const commonOpponents = [...opponentSets[0]].filter((opp) =>
    opponentSets.every((set) => set.has(opp))
  );

  if (commonOpponents.length === 0) {
    return { winners: tiedTeams, detail: 'No common non-divisional opponents' };
  }

  const records = tiedTeams.map((teamId) => {
    const vsCommonGames = conferenceGames.filter(
      (g) =>
        (g.home.teamId === teamId && commonOpponents.includes(g.away.teamId)) ||
        (g.away.teamId === teamId && commonOpponents.includes(g.home.teamId))
    );
    return {
      teamId,
      ...getTeamRecord(teamId, vsCommonGames),
    };
  });

  const maxWinPct = Math.max(...records.map((r) => r.winPct));
  const winners = records
    .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON_CONSTANT)
    .map((r) => r.teamId);

  const oppAbbrevs = commonOpponents
    .map((oppId) => getTeamAbbrev(oppId, games))
    .slice(0, 3);
  const detail = `Common non-divisional: ${commonOpponents.length} opponent${commonOpponents.length !== 1 ? 's' : ''}${oppAbbrevs.length > 0 ? ` (${oppAbbrevs.join(', ')}${commonOpponents.length > 3 ? '...' : ''})` : ''}`;

  return { winners, detail };
};
