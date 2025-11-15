/**
 * ESPN API Client for College Football Data
 * Based on tech spec endpoints and field mappings
 *
 * Types are now generated from ESPN API responses via quicktype.
 * See lib/espn/ for generated type definitions.
 */

// Import generated types for use in method signatures
import type { EspnScoreboardGenerated } from './espn/espn-scoreboard-generated';
import type { EspnTeamGenerated } from './espn/espn-team-generated';
import type { EspnTeamRecordsGenerated } from './espn/espn-team-records-generated';
import type { EspnGameSummaryGenerated } from './espn/espn-game-summary-generated';

// Re-export generated types for convenience
export type {
  EspnScoreboardGenerated,
  Event,
  Competition,
  Competitor,
} from './espn/espn-scoreboard-generated';
export type { EspnTeamGenerated, Logo, Record } from './espn/espn-team-generated';
export type { EspnTeamRecordsGenerated, Item } from './espn/espn-team-records-generated';
export type { EspnGameSummaryGenerated } from './espn/espn-game-summary-generated';

export class ESPNClient {
  private baseUrl: string;

  constructor(
    private sport: string = 'football',
    private league: string = 'college-football'
  ) {
    this.baseUrl = `http://site.api.espn.com/apis/site/v2/sports/${sport}/${league}`;
  }

  /**
   * Fetch all teams in a conference
   * Note: This method is not implemented. Use conference-specific constants from lib/constants.ts
   * (e.g., SEC_TEAMS for SEC conference)
   */
  getConferenceTeams(conferenceId: number): Promise<string[]> {
    throw new Error(
      `getConferenceTeams not implemented for conference ${conferenceId}. Use conference-specific constants from lib/constants.ts`
    );
  }

  /**
   * Fetch scoreboard data for a specific conference/week/season
   */
  async getScoreboard(
    params: {
      groups?: number; // Conference ID (8 for SEC, etc.)
      season?: number; // YYYY
      week?: number; // Week number (varies by sport)
    } = {}
  ): Promise<EspnScoreboardGenerated> {
    const searchParams = new URLSearchParams();

    if (params.groups) searchParams.set('groups', params.groups.toString());
    if (params.season) searchParams.set('year', params.season.toString()); // Note: 'year' not 'season'
    if (params.week !== undefined) searchParams.set('week', params.week.toString());

    const url = `${this.baseUrl}/scoreboard?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SEC-Tiebreaker/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch individual game summary (for live polling)
   */
  async getGameSummary(gameId: string): Promise<EspnGameSummaryGenerated> {
    const url = `${this.baseUrl}/summary?event=${gameId}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SEC-Tiebreaker/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch team metadata (for manual seeding)
   */
  async getTeam(teamAbbrev: string): Promise<EspnTeamGenerated> {
    const url = `${this.baseUrl}/teams/${teamAbbrev}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SEC-Tiebreaker/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch detailed team records from core API
   * Provides overall, conference, home, and away records
   */
  async getTeamRecords(
    teamId: string,
    season: number = 2025,
    seasonType: number = 2
  ): Promise<EspnTeamRecordsGenerated> {
    const url = `http://sports.core.api.espn.com/v2/sports/${this.sport}/leagues/${this.league}/seasons/${season}/types/${seasonType}/teams/${teamId}/record?lang=en&region=us`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SEC-Tiebreaker/1.0',
        },
      });

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

// Default client for SEC college football
export const espnClient = new ESPNClient('football', 'college-football');

// Factory function for creating clients for different sports/leagues
export const createESPNClient = (sport: string, league: string) => {
  return new ESPNClient(sport, league);
};
