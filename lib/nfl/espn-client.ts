import { isFixtureDataSource } from '@/lib/cfb/helpers/fixture-year';
import { logError } from '@/lib/errorLogger';
import type { EspnScoreboardGenerated } from '@/lib/espn/nfl/espn-scoreboard-generated';
import type { EspnTeamsGenerated } from '@/lib/espn/nfl/espn-teams-generated';
import type { EspnTeamStatisticsGenerated } from '@/lib/espn/nfl/espn-team-statistics-generated';
import path from 'path';
import { promises as fs } from 'fs';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const ESPN_CORE_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

const FIXTURE_DIR = path.join(process.cwd(), '__fixtures__', 'espn', 'nfl');

const readFixture = async <T>(relativePath: string): Promise<T> => {
  const filePath = path.join(FIXTURE_DIR, relativePath);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
};

export const getScoreboard = async (
  season: number,
  week: number
): Promise<EspnScoreboardGenerated> => {
  if (isFixtureDataSource()) {
    return readFixture<EspnScoreboardGenerated>(`scoreboard/${season}/week-${week}.json`);
  }

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
  if (isFixtureDataSource()) {
    const dir = path.join(FIXTURE_DIR, 'scoreboard', String(season));
    const files = await fs.readdir(dir);
    const weekFiles = files
      .filter((f) => f.startsWith('week-') && f.endsWith('.json'))
      .sort((a, b) => {
        const numA = parseInt(a.replace('week-', '').replace('.json', ''), 10);
        const numB = parseInt(b.replace('week-', '').replace('.json', ''), 10);
        return numA - numB;
      });
    const scoreboards = await Promise.all(
      weekFiles.map((f) => readFixture<EspnScoreboardGenerated>(`scoreboard/${season}/${f}`))
    );
    const allEvents = scoreboards.flatMap((sb) => sb.events);
    return { ...scoreboards[0], events: allEvents };
  }

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
  if (isFixtureDataSource()) {
    return readFixture<EspnTeamsGenerated>('teams.json');
  }

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
  if (isFixtureDataSource()) {
    return readFixture<EspnTeamStatisticsGenerated>(`team-statistics/${season}/${teamId}.json`);
  }

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
