import { logError } from '@/lib/errorLogger';
import type { EspnScoreboardGenerated } from '@/lib/espn/nfl/espn-scoreboard-generated';
import type { EspnTeamsGenerated } from '@/lib/espn/nfl/espn-teams-generated';
import type { EspnTeamStatisticsGenerated } from '@/lib/espn/nfl/espn-team-statistics-generated';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const ESPN_CORE_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

export const getScoreboard = async (
  season: number,
  week: number
): Promise<EspnScoreboardGenerated> => {
  try {
    const url = `${ESPN_BASE}/scoreboard?season=${season}&week=${week}&seasontype=2`;
    const response = await globalThis.fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN scoreboard API returned ${response.status}`);
    }
    return (await response.json()) as EspnScoreboardGenerated;
  } catch (error) {
    await logError(error, { action: 'espn-nfl-get-scoreboard', season, week });
    throw error;
  }
};

export const getSeasonScoreboard = async (season: number): Promise<EspnScoreboardGenerated> => {
  try {
    const url = `${ESPN_BASE}/scoreboard?dates=${season}&seasontype=2&limit=1000`;
    const response = await globalThis.fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN season scoreboard API returned ${response.status}`);
    }
    return (await response.json()) as EspnScoreboardGenerated;
  } catch (error) {
    await logError(error, { action: 'espn-nfl-get-season-scoreboard', season });
    throw error;
  }
};

export const getTeams = async (): Promise<EspnTeamsGenerated> => {
  try {
    const url = `${ESPN_BASE}/teams`;
    const response = await globalThis.fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN teams API returned ${response.status}`);
    }
    return (await response.json()) as EspnTeamsGenerated;
  } catch (error) {
    await logError(error, { action: 'espn-nfl-get-teams' });
    throw error;
  }
};

export const getTeamStatistics = async (
  season: number,
  teamId: string
): Promise<EspnTeamStatisticsGenerated> => {
  try {
    const url = `${ESPN_CORE_BASE}/seasons/${season}/types/2/teams/${teamId}/statistics`;
    const response = await globalThis.fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN team statistics API returned ${response.status}`);
    }
    return (await response.json()) as EspnTeamStatisticsGenerated;
  } catch (error) {
    await logError(error, { action: 'espn-nfl-get-team-statistics', season, teamId });
    throw error;
  }
};
