/**
 * ESPN API Client for College Football Data
 * Based on tech spec endpoints and field mappings
 */

export interface ESPNCompetitor {
  homeAway: "home" | "away";
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    logo: string;
    color: string;
    conferenceId: string;
  };
  score: string;
  curatedRank?: {
    current: number;
  };
  records: Array<{
    type: string;
    summary: string;
  }>;
}

export interface ESPNCompetition {
  id: string;
  date: string;
  conferenceCompetition: boolean;
  neutralSite?: boolean;
  competitors: ESPNCompetitor[];
  status: {
    type: {
      state: "pre" | "in" | "post";
      completed: boolean;
    };
    clock?: number;
    period?: number;
  };
  week?: {
    number: number;
  };
  season?: {
    year: number;
  };
  odds?: Array<{
    details: string;
    spread: number;
    overUnder: number;
    awayTeamOdds: {
      favorite: boolean;
    };
    homeTeamOdds: {
      favorite: boolean;
    };
  }>;
  groups?: {
    id: string;
  };
}

export interface ESPNEvent {
  id: string;
  competitions: ESPNCompetition[];
}

export interface ESPNScoreboardResponse {
  events: ESPNEvent[];
  season: {
    year: number;
  };
  week: {
    number: number;
  };
}

export interface ESPNGameSummaryResponse {
  header: {
    competitions: ESPNCompetition[];
  };
}

export interface ESPNTeamLogo {
  href: string;
  width: number;
  height: number;
}

export interface ESPNTeamRecord {
  items: Array<{
    summary: string;
    stats?: Array<{
      name: string;
      value: number;
    }>;
  }>;
}

export interface ESPNTeamResponse {
  team: {
    id: string;
    name: string;
    displayName: string;
    abbreviation: string;
    logos?: ESPNTeamLogo[];
    color: string;
    alternateColor: string;
    groups?: {
      parent?: {
        id: string;
      };
    };
    record?: ESPNTeamRecord;
    rank?: number; // Current ranking (99 or null for unranked)
    standingSummary?: string; // "3rd in SEC"
  };
  nextEvent?: Array<{
    id: string;
  }>;
}

export interface ESPNRecordItem {
  id: string;
  name: string;
  type: string;
  summary: string;
  displayValue: string;
  stats?: Array<{
    name: string;
    type: string;
    value: number;
    displayValue: string;
  }>;
}

export interface ESPNCoreRecordResponse {
  items: ESPNRecordItem[];
}

export class ESPNClient {
  private baseUrl: string;

  constructor(
    private sport: string = "football",
    private league: string = "college-football"
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
  ): Promise<ESPNScoreboardResponse> {
    const searchParams = new URLSearchParams();

    if (params.groups) searchParams.set("groups", params.groups.toString());
    if (params.season) searchParams.set("year", params.season.toString()); // Note: 'year' not 'season'
    if (params.week !== undefined)
      searchParams.set("week", params.week.toString());

    const url = `${this.baseUrl}/scoreboard?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SEC-Tiebreaker/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `ESPN API error: ${response.status} ${response.statusText}`
        );
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
  async getGameSummary(gameId: string): Promise<ESPNGameSummaryResponse> {
    const url = `${this.baseUrl}/summary?event=${gameId}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SEC-Tiebreaker/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `ESPN API error: ${response.status} ${response.statusText}`
        );
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
  async getTeam(teamAbbrev: string): Promise<ESPNTeamResponse> {
    const url = `${this.baseUrl}/teams/${teamAbbrev}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SEC-Tiebreaker/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `ESPN API error: ${response.status} ${response.statusText}`
        );
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
  ): Promise<ESPNCoreRecordResponse> {
    const url = `http://sports.core.api.espn.com/v2/sports/${this.sport}/leagues/${this.league}/seasons/${season}/types/${seasonType}/teams/${teamId}/record?lang=en&region=us`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SEC-Tiebreaker/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `ESPN Core API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
}

// Default client for SEC college football
export const espnClient = new ESPNClient("football", "college-football");

// Factory function for creating clients for different sports/leagues
export const createESPNClient = (sport: string, league: string) => {
  return new ESPNClient(sport, league);
};
