import { isFixtureDataSource } from '@/lib/cfb/helpers/fixture-year';
import { logError } from '@/lib/errorLogger';
import type { EspnScoreboardGenerated } from '@/lib/espn/nfl/espn-scoreboard-generated';
import type { EspnTeamsGenerated } from '@/lib/espn/nfl/espn-teams-generated';
import type { EspnTeamStatisticsGenerated } from '@/lib/espn/nfl/espn-team-statistics-generated';
import path from 'path';
import { promises as fs } from 'fs';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const ESPN_CORE_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';
const CURRENT_SEASON_THRESHOLD = 2025;

const FIXTURE_DIR = path.join(process.cwd(), '__fixtures__', 'espn', 'nfl');

const readFixture = async <T>(relativePath: string): Promise<T> => {
  const filePath = path.join(FIXTURE_DIR, relativePath);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
};

interface EspnWeekDates {
  startDate: string;
  endDate: string;
}

const fetchWeekDates = async (season: number, week: number): Promise<EspnWeekDates> => {
  const url = `${ESPN_CORE_BASE}/seasons/${season}/types/2/weeks/${week}`;
  const response = await globalThis.fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN week dates API returned ${response.status} for ${url}`);
  }
  const data = (await response.json()) as { startDate: string; endDate: string };
  return { startDate: data.startDate, endDate: data.endDate };
};

const formatDateParam = (isoDate: string): string => {
  const d = new Date(isoDate);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export const getScoreboard = async (
  season: number,
  week: number
): Promise<EspnScoreboardGenerated> => {
  if (isFixtureDataSource()) {
    const fixtureYear = process.env.FIXTURE_YEAR ?? String(season);
    return readFixture<EspnScoreboardGenerated>(`scoreboard/${fixtureYear}/week-${week}.json`);
  }

  try {
    let url: string;

    if (season < CURRENT_SEASON_THRESHOLD) {
      const dates = await fetchWeekDates(season, week);
      const start = formatDateParam(dates.startDate);
      const end = formatDateParam(dates.endDate);
      url = `${ESPN_BASE}/scoreboard?dates=${start}-${end}&limit=100`;
    } else {
      url = `${ESPN_BASE}/scoreboard?season=${season}&week=${week}&seasontype=2`;
    }

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
    const fixtureYear = process.env.FIXTURE_YEAR ?? String(season);
    return readFixture<EspnTeamStatisticsGenerated>(
      `team-statistics/${fixtureYear}/${teamId}.json`
    );
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
