import * as espnClient from './espn-client';
import { fetch, persistRedisKey } from '@/lib/redis';
import type { EspnScoreboardGenerated, Event } from '@/lib/espn/nfl/espn-scoreboard-generated';
import type { EspnTeamsGenerated } from '@/lib/espn/nfl/espn-teams-generated';
import type { EspnTeamStatisticsGenerated } from '@/lib/espn/nfl/espn-team-statistics-generated';

const KEY_PREFIX = 'espn:nfl';

const TTL_5_MIN = 300;
const TTL_1_HR = 3600;
const TTL_24_HR = 86400;

const isCurrentSeason = (season: number): boolean => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return season === year || (month <= 1 && season === year - 1);
};

const isGameDay = (): boolean => {
  const day = new Date().getUTCDay();
  return day === 0 || day === 1 || day === 4;
};

const getSeasonTtl = (season: number): number => {
  if (!isCurrentSeason(season)) return TTL_24_HR;
  return isGameDay() ? TTL_5_MIN : TTL_1_HR;
};

export const getTeams = async (): Promise<EspnTeamsGenerated> => {
  const key = `${KEY_PREFIX}:teams`;
  const data = await fetch<EspnTeamsGenerated>(key, () => espnClient.getTeams());
  await persistRedisKey(key);
  return data;
};

export const getTeamStatistics = (
  season: number,
  teamId: string
): Promise<EspnTeamStatisticsGenerated> => {
  const ttl = isCurrentSeason(season) ? TTL_24_HR : undefined;
  return fetch<EspnTeamStatisticsGenerated>(
    `${KEY_PREFIX}:team-statistics:${season}:${teamId}`,
    () => espnClient.getTeamStatistics(season, teamId),
    ttl
  );
};

export const getAllSeasonGames = async (season: number): Promise<Event[]> => {
  const key = `${KEY_PREFIX}:season:${season}`;
  const ttl = getSeasonTtl(season);

  const data = await fetch<EspnScoreboardGenerated>(
    key,
    () => espnClient.getSeasonScoreboard(season),
    ttl
  );

  const allComplete = data.events.length > 0 && data.events.every((e) => e.status.type.completed);
  if (allComplete) {
    await persistRedisKey(key);
  }

  const seen = new Set<string>();
  return data.events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
};
