import { cfbdClient } from './cfbd-client';
import { getSeasonAwareTtl } from './helpers/season-phase';
import { fetch, persistRedisKey, expireRedisKey } from '@/lib/redis';
import { getGamesCacheVerdict } from './helpers/games-cache-ttl';
import { CFBD_CONFERENCE_NAME_TO_ABBR } from '@/lib/cfb/constants';
import type { Team } from 'cfbd';
const KEY_PREFIX = 'cfbd:cfb';

export const getTeams = (season: number): Promise<Record<string, Team[]>> => {
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
    () => getSeasonAwareTtl(season)
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

  const games = await fetch(
    key,
    () => cfbdClient.getGames(params),
    () => getSeasonAwareTtl(params.year)
  );

  const verdict = getGamesCacheVerdict(games);
  if (verdict.kind === 'persist') {
    await persistRedisKey(key);
  } else if (verdict.kind === 'expire') {
    await expireRedisKey(key, verdict.ttlSeconds);
  }

  return games;
};

export const getRankings = (params: { year: number; week?: number; seasonType?: string }) => {
  const weekKey =
    params.week !== null && params.week !== undefined ? String(params.week) : 'latest';
  const seasonType = params.seasonType ?? 'regular';
  return fetch(
    `${KEY_PREFIX}:rankings:${params.year}:${weekKey}:${seasonType}`,
    () => cfbdClient.getRankings(params),
    () => getSeasonAwareTtl(params.year, 'sunday')
  );
};

export const getSp = (params: { year: number; team?: string }) => {
  const teamKey = params.team ?? 'all';
  return fetch(
    `${KEY_PREFIX}:sp:${params.year}:${teamKey}`,
    () => cfbdClient.getSp(params),
    () => getSeasonAwareTtl(params.year)
  );
};

export const getFpi = (params: { year: number; team?: string }) => {
  const teamKey = params.team ?? 'all';
  return fetch(
    `${KEY_PREFIX}:fpi:${params.year}:${teamKey}`,
    () => cfbdClient.getFpi(params),
    () => getSeasonAwareTtl(params.year)
  );
};
