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
    curatedRank?: {
      current: number;
    };
  };
  standingSummary?: string;
  nextEvent?: Array<{
    id: string;
  }>;
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

    console.log(
      `[ESPN] Fetching ${this.sport}/${this.league} scoreboard: ${url}`
    );

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
      console.log(
        `[ESPN] Scoreboard response: ${data.events?.length || 0} events`
      );

      return data;
    } catch (error) {
      console.error("[ESPN] Scoreboard fetch failed:", error);
      throw error;
    }
  }

  /**
   * Fetch individual game summary (for live polling)
   */
  async getGameSummary(gameId: string): Promise<ESPNGameSummaryResponse> {
    const url = `${this.baseUrl}/summary?event=${gameId}`;

    console.log(`[ESPN] Fetching game summary: ${gameId}`);

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
      console.log(`[ESPN] Game summary response for ${gameId}`);

      return data;
    } catch (error) {
      console.error(`[ESPN] Game summary fetch failed for ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch team metadata (for manual seeding)
   */
  async getTeam(teamAbbrev: string): Promise<ESPNTeamResponse> {
    const url = `${this.baseUrl}/teams/${teamAbbrev}`;

    console.log(`[ESPN] Fetching team: ${teamAbbrev}`);

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
      console.log(`[ESPN] Team response for ${teamAbbrev}`);

      return data;
    } catch (error) {
      console.error(`[ESPN] Team fetch failed for ${teamAbbrev}:`, error);
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
