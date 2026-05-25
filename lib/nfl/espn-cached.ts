import * as espnClient from './espn-client';
import { fetch, persistRedisKey } from '@/lib/redis';
import { getWeekCount } from './constants';
import type { EspnScoreboardGenerated, Event } from '@/lib/espn/nfl/espn-scoreboard-generated';
import type { EspnTeamsGenerated } from '@/lib/espn/nfl/espn-teams-generated';
import type { EspnTeamStatisticsGenerated } from '@/lib/espn/nfl/espn-team-statistics-generated';

const KEY_PREFIX = 'espn:nfl';

const TTL_5_MIN = 300;
const TTL_24_HR = 86400;

const isWeekComplete = (scoreboard: EspnScoreboardGenerated): boolean =>
  scoreboard.events.length > 0 && scoreboard.events.every((e) => e.status.type.completed);

export const getScoreboard = async (
  season: number,
  week: number
): Promise<EspnScoreboardGenerated> => {
  const key = `${KEY_PREFIX}:scoreboard:${season}:${week}`;

  const data = await fetch<EspnScoreboardGenerated>(
    key,
    () => espnClient.getScoreboard(season, week),
    TTL_5_MIN
  );

  if (isWeekComplete(data)) {
    await persistRedisKey(key);
  }

  return data;
};

export const getTeams = (): Promise<EspnTeamsGenerated> =>
  fetch<EspnTeamsGenerated>(`${KEY_PREFIX}:teams`, () => espnClient.getTeams());

export const getTeamStatistics = (
  season: number,
  teamId: string
): Promise<EspnTeamStatisticsGenerated> =>
  fetch<EspnTeamStatisticsGenerated>(
    `${KEY_PREFIX}:team-statistics:${season}:${teamId}`,
    () => espnClient.getTeamStatistics(season, teamId),
    TTL_24_HR
  );

export const getAllSeasonGames = async (season: number): Promise<Event[]> => {
  const weekCount = getWeekCount(season);
  const scoreboards = await Promise.all(
    Array.from({ length: weekCount }, (_, i) => getScoreboard(season, i + 1))
  );
  const all = scoreboards.flatMap((sb) => sb.events);
  const seen = new Set<string>();
  return all.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
};
