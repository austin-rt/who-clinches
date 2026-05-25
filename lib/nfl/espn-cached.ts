import * as espnClient from './espn-client';
import { fetch, persistRedisKey } from '@/lib/redis';
import type { EspnScoreboardGenerated, Event } from '@/lib/espn/nfl/espn-scoreboard-generated';
import type { EspnTeamsGenerated } from '@/lib/espn/nfl/espn-teams-generated';
import type { EspnTeamStatisticsGenerated } from '@/lib/espn/nfl/espn-team-statistics-generated';

const KEY_PREFIX = 'espn:nfl';

const TTL_5_MIN = 300;
const TTL_24_HR = 86400;

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
  const key = `${KEY_PREFIX}:season:${season}`;

  const data = await fetch<EspnScoreboardGenerated>(
    key,
    () => espnClient.getSeasonScoreboard(season),
    TTL_5_MIN
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
