import { GameLean, TeamLean } from '../../../types';
import { getTeamRecord, EPSILON_CONSTANT } from './core-helpers';
import { applyRuleAHeadToHead } from './rule-a-head-to-head';

export const applyRuleCHighestPlacedOpponent = (
  tiedTeams: string[],
  games: GameLean[],
  allTeams?: string[],
  teams?: TeamLean[]
): { winners: string[]; detail: string } => {
  if (!allTeams || !teams) {
    return {
      winners: tiedTeams,
      detail: 'All teams data required for Highest Placed Common Opponent',
    };
  }
  if (tiedTeams.length < 2) {
    return { winners: tiedTeams, detail: 'No tie to break' };
  }

  const preliminaryStandings = allTeams
    .map((teamId) => ({
      teamId,
      ...getTeamRecord(teamId, games),
    }))
    .sort((a, b) => {
      if (Math.abs(b.winPct - a.winPct) > EPSILON_CONSTANT) return b.winPct - a.winPct;
      return b.wins - a.wins;
    });

  const opponentSets = tiedTeams.map((teamId) => {
    const teamGames = games.filter((g) => g.home.teamId === teamId || g.away.teamId === teamId);
    return new Set(
      teamGames.map((g) => (g.home.teamId === teamId ? g.away.teamId : g.home.teamId))
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
        Math.abs(team.winPct - currentWinPct) > EPSILON_CONSTANT ||
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
            (g.home.teamId === teamId && g.away.teamId === oppId) ||
            (g.away.teamId === teamId && g.home.teamId === oppId)
        );
        return {
          teamId,
          ...getTeamRecord(teamId, vsOppGames),
        };
      });

      const maxWinPct = Math.max(...records.map((r) => r.winPct));
      const minWinPct = Math.min(...records.map((r) => r.winPct));

      if (Math.abs(maxWinPct - minWinPct) > EPSILON_CONSTANT) {
        const winners = records
          .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON_CONSTANT)
          .map((r) => r.teamId);

        const oppGame = games.find((g) => g.home.teamId === oppId || g.away.teamId === oppId);
        const oppAbbrev =
          oppGame?.home.teamId === oppId ? oppGame.home.abbrev : oppGame?.away.abbrev || oppId;

        const detail = `Record vs ${oppAbbrev}`;

        return { winners, detail };
      }
    } else {
      const tiedOpponents = commonInGroup;

      let resolvedOpponents: string[] = [];
      if (tiedOpponents.length === 2) {
        const h2hGame = games.find(
          (g) =>
            (g.home.teamId === tiedOpponents[0] && g.away.teamId === tiedOpponents[1]) ||
            (g.home.teamId === tiedOpponents[1] && g.away.teamId === tiedOpponents[0])
        );
        if (h2hGame && h2hGame.home.score !== null && h2hGame.away.score !== null) {
          if (h2hGame.home.score > h2hGame.away.score) {
            resolvedOpponents = [h2hGame.home.teamId];
          } else {
            resolvedOpponents = [h2hGame.away.teamId];
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
            (opponentsToUse.includes(g.home.teamId) && g.away.teamId === teamId) ||
            (opponentsToUse.includes(g.away.teamId) && g.home.teamId === teamId)
        );
        return {
          teamId,
          ...getTeamRecord(teamId, vsTiedOppGames),
        };
      });

      const maxWinPct = Math.max(...records.map((r) => r.winPct));
      const minWinPct = Math.min(...records.map((r) => r.winPct));

      if (Math.abs(maxWinPct - minWinPct) > EPSILON_CONSTANT) {
        const winners = records
          .filter((r) => Math.abs(r.winPct - maxWinPct) < EPSILON_CONSTANT)
          .map((r) => r.teamId);

        const oppAbbrevs = opponentsToUse.map((oppId) => {
          const oppGame = games.find((g) => g.home.teamId === oppId || g.away.teamId === oppId);
          return oppGame?.home.teamId === oppId
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
