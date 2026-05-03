import { cfbdClient } from './cfbd-client';
import { calculateNextSaturdayRevalidate } from './helpers/calculate-next-weekday-revalidate';
import { fetch, persistRedisKey } from '@/lib/redis';
import { CFBD_CONFERENCE_NAME_TO_ABBR } from '@/lib/constants';
import type { Team } from 'cfbd';

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
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
    THIRTY_DAYS_SECONDS
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
  const weeklyTtl = calculateNextSaturdayRevalidate();

  const games = await fetch(key, () => cfbdClient.getGames(params), weeklyTtl);

  if (games.length > 0 && games.every((g) => g.completed)) {
    await persistRedisKey(key);
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
    calculateNextSaturdayRevalidate()
  );
};

export const getSp = (params: { year: number; team?: string }) => {
  const teamKey = params.team ?? 'all';
  return fetch(
    `${KEY_PREFIX}:sp:${params.year}:${teamKey}`,
    () => cfbdClient.getSp(params),
    calculateNextSaturdayRevalidate()
  );
};

export const getFpi = (params: { year: number; team?: string }) => {
  const teamKey = params.team ?? 'all';
  return fetch(
    `${KEY_PREFIX}:fpi:${params.year}:${teamKey}`,
    () => cfbdClient.getFpi(params),
    calculateNextSaturdayRevalidate()
  );
};
