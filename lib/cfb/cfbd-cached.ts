import { cfbdClient } from './cfbd-client';
import { getSeasonAwareTtl } from './helpers/season-phase';
import { fetch, persistRedisKey } from '@/lib/redis';
import { CFBD_CONFERENCE_NAME_TO_ABBR } from '@/lib/cfb/constants';
import type { Team } from 'cfbd';
const KEY_PREFIX = 'cfbd:cfb';

export const getTeams = async (season: number): Promise<Record<string, Team[]>> => {
  const ttl = await getSeasonAwareTtl(season);
  return fetch<Record<string, Team[]>>(
    `${KEY_PREFIX}:teams:${season}`,
    async () => {
      const allTeams = await cfbdClient.getTeams({ classification: 'fbs' });
      const grouped: Record<string, Team[]> = {};
      for (const team of allTeams) {
        const confName = team.conference ?? '';
        const abbr = CFBD_CONFERENCE_NAME_TO_ABBR[confName];
        if (!abbr) continue;
        if (!grouped[abbr]) grouped[abbr] = [];
        grouped[abbr].push(team);
      }
      return grouped;
    },
    ttl
  );
};

export const getGames = async (params: {
  year: number;
  conference: string;
  seasonType: string;
  week?: number;
}) => {
  const weekKey = params.week !== null && params.week !== undefined ? String(params.week) : 'all';
  const key = `${KEY_PREFIX}:games:${params.conference}:${params.year}:${params.seasonType}:${weekKey}`;
  const ttl = await getSeasonAwareTtl(params.year);

  const games = await fetch(key, () => cfbdClient.getGames(params), ttl);

  if (games.length > 0 && games.every((g) => g.completed)) {
    await persistRedisKey(key);
  }

  return games;
};

export const getRankings = async (params: { year: number; week?: number; seasonType?: string }) => {
  const weekKey =
    params.week !== null && params.week !== undefined ? String(params.week) : 'latest';
  const seasonType = params.seasonType ?? 'regular';
  const ttl = await getSeasonAwareTtl(params.year, 'sunday');
  return fetch(
    `${KEY_PREFIX}:rankings:${params.year}:${weekKey}:${seasonType}`,
    () => cfbdClient.getRankings(params),
    ttl
  );
};

export const getSp = async (params: { year: number; team?: string }) => {
  const teamKey = params.team ?? 'all';
  const ttl = await getSeasonAwareTtl(params.year);
  return fetch(`${KEY_PREFIX}:sp:${params.year}:${teamKey}`, () => cfbdClient.getSp(params), ttl);
};

export const getFpi = async (params: { year: number; team?: string }) => {
  const teamKey = params.team ?? 'all';
  const ttl = await getSeasonAwareTtl(params.year);
  return fetch(`${KEY_PREFIX}:fpi:${params.year}:${teamKey}`, () => cfbdClient.getFpi(params), ttl);
};
