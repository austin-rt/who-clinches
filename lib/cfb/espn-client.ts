import type { EspnScoreboardGenerated } from '../espn/espn-scoreboard-generated';
import type { EspnTeamGenerated } from '../espn/espn-team-generated';
import type { EspnTeamRecordsGenerated } from '../espn/espn-team-records-generated';
import type { EspnGameSummaryGenerated } from '../espn/espn-game-summary-generated';
import { fetchWithTimeout } from '../fetch-with-timeout';

const REQUEST_TIMEOUT_MS = 60000;

export class ESPNClient {
  private baseUrl: string;

  constructor(
    private sport: string = 'football',
    private league: string = 'college-football'
  ) {
    this.baseUrl = `http://site.api.espn.com/apis/site/v2/sports/${sport}/${league}`;
  }

  async getScoreboard(
    params: {
      groups?: string;
      season?: number;
      week?: number;
      dates?: number | string;
    } = {}
  ): Promise<EspnScoreboardGenerated> {
    const searchParams = new URLSearchParams();

    if (params.groups) searchParams.set('groups', params.groups);
    if (params.season) searchParams.set('year', params.season.toString());
    if (params.week !== undefined) searchParams.set('week', params.week.toString());
    if (params.dates !== undefined) searchParams.set('dates', params.dates.toString());

    const url = `${this.baseUrl}/scoreboard?${searchParams.toString()}`;

    try {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            'User-Agent': 'SEC-Tiebreaker/1.0',
          },
        },
        REQUEST_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getGameSummary(gameId: string): Promise<EspnGameSummaryGenerated> {
    const url = `${this.baseUrl}/summary?event=${gameId}`;

    try {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            'User-Agent': 'SEC-Tiebreaker/1.0',
          },
        },
        REQUEST_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getTeam(teamAbbrev: string): Promise<EspnTeamGenerated> {
    const url = `${this.baseUrl}/teams/${teamAbbrev}`;

    try {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            'User-Agent': 'SEC-Tiebreaker/1.0',
          },
        },
        REQUEST_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getTeamRecords(
    teamId: string,
    season: number = 2025,
    seasonType: number = 2
  ): Promise<EspnTeamRecordsGenerated> {
    const url = `http://sports.core.api.espn.com/v2/sports/${this.sport}/leagues/${this.league}/seasons/${season}/types/${seasonType}/teams/${teamId}/record?lang=en&region=us`;

    try {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            'User-Agent': 'SEC-Tiebreaker/1.0',
          },
        },
        REQUEST_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`ESPN Core API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const espnClient = new ESPNClient('football', 'college-football');

export const createESPNClient = (espnRoute: string) => {
  const [sport, league] = espnRoute.split('/');
  return new ESPNClient(sport, league);
};
