import type { Game } from '../../types';
import { nflWinPct, type NflRecord } from '../types';
import { NFL_TEAM_BY_ESPN_ID } from '../constants';

export const EPSILON = 0.0001;

export const getTeamAbbrev = (teamId: string, games: Game[]): string => {
  const game = games.find((g) => g.home.teamId === teamId || g.away.teamId === teamId);
  return game?.home.teamId === teamId ? game.home.abbrev : game?.away.abbrev || teamId;
};

export const formatList = (items: string[]): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

export const getTeamRecord = (teamId: string, games: Game[]): NflRecord => {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const game of games) {
    if (game.home.score === null || game.away.score === null) continue;
    const isHome = game.home.teamId === teamId;
    if (!isHome && game.away.teamId !== teamId) continue;

    const teamScore = isHome ? game.home.score : game.away.score;
    const oppScore = isHome ? game.away.score : game.home.score;

    if (teamScore > oppScore) wins++;
    else if (teamScore < oppScore) losses++;
    else ties++;
  }

  return { wins, losses, ties };
};

export const getFilteredRecord = (
  teamId: string,
  games: Game[],
  filterFn: (game: Game) => boolean
): NflRecord => {
  const filtered = games.filter(
    (g) => (g.home.teamId === teamId || g.away.teamId === teamId) && filterFn(g)
  );
  return getTeamRecord(teamId, filtered);
};

export const isDivisionGame = (game: Game): boolean => {
  const homeMeta = NFL_TEAM_BY_ESPN_ID.get(game.home.teamId);
  const awayMeta = NFL_TEAM_BY_ESPN_ID.get(game.away.teamId);
  if (homeMeta && awayMeta) return homeMeta.divisionId === awayMeta.divisionId;
  return false;
};

export const isConferenceGame = (game: Game): boolean => {
  const homeMeta = NFL_TEAM_BY_ESPN_ID.get(game.home.teamId);
  const awayMeta = NFL_TEAM_BY_ESPN_ID.get(game.away.teamId);
  if (homeMeta && awayMeta) return homeMeta.conference === awayMeta.conference;
  return game.conferenceGame;
};

export const getOpponents = (teamId: string, games: Game[]): string[] => {
  const opps: string[] = [];
  for (const g of games) {
    if (g.home.teamId === teamId) opps.push(g.away.teamId);
    else if (g.away.teamId === teamId) opps.push(g.home.teamId);
  }
  return opps;
};

export const getCommonOpponents = (teamIds: string[], games: Game[]): string[] => {
  const oppSets = teamIds.map((tid) => new Set(getOpponents(tid, games)));
  return [...oppSets[0]].filter((opp) => oppSets.every((set) => set.has(opp)));
};

export const getTeamPointsFor = (teamId: string, games: Game[]): number => {
  let total = 0;
  for (const g of games) {
    if (g.home.score === null || g.away.score === null) continue;
    if (g.home.teamId === teamId) total += g.home.score;
    else if (g.away.teamId === teamId) total += g.away.score;
  }
  return total;
};

export const getTeamPointsAgainst = (teamId: string, games: Game[]): number => {
  let total = 0;
  for (const g of games) {
    if (g.home.score === null || g.away.score === null) continue;
    if (g.home.teamId === teamId) total += g.away.score;
    else if (g.away.teamId === teamId) total += g.home.score;
  }
  return total;
};

export const formatRecord = (r: NflRecord): string =>
  r.ties > 0 ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;

export const formatWinPct = (r: NflRecord): string =>
  `${formatRecord(r)} (${(nflWinPct(r) * 100).toFixed(1)}%)`;

export const bestWinPctTeams = (teamRecords: { teamId: string; record: NflRecord }[]): string[] => {
  const pcts = teamRecords.map((t) => ({ teamId: t.teamId, pct: nflWinPct(t.record) }));
  const maxPct = Math.max(...pcts.map((p) => p.pct));
  return pcts.filter((p) => Math.abs(p.pct - maxPct) < EPSILON).map((p) => p.teamId);
};

export const teamGamesAgainst = (teamId: string, opponentIds: string[], games: Game[]): Game[] => {
  const oppSet = new Set(opponentIds);
  return games.filter((g) => {
    if (g.home.teamId === teamId && oppSet.has(g.away.teamId)) return true;
    if (g.away.teamId === teamId && oppSet.has(g.home.teamId)) return true;
    return false;
  });
};
