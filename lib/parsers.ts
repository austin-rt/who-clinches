/**
 * ESPN Response Parsers
 * Transform ESPN API responses into our database schema format
 */

import { ESPNEvent } from "./espn-client";

export interface ParsedGame {
  espnId: string;
  date: string;
  week: number | null;
  season: number;
  sport: string;
  league: string;
  state: "pre" | "in" | "post";
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  home: {
    teamId: string;
    abbrev: string;
    score: number | null;
    rank: number | null;
  };
  away: {
    teamId: string;
    abbrev: string;
    score: number | null;
    rank: number | null;
  };
  odds: {
    favoriteTeamId: string | null;
    spread: number | null;
    overUnder: number | null;
  };
  lastUpdated: Date;
}

/**
 * Parse ESPN event into our game format
 */
export const parseESPNEvent = (
  event: ESPNEvent,
  sport: string = "football",
  league: string = "college-football"
): ParsedGame | null => {
  try {
    const competition = event.competitions[0];
    if (!competition) {
      console.warn(`[Parser] No competition data for event ${event.id}`);
      return null;
    }

    const competitors = competition.competitors;
    if (!competitors || competitors.length !== 2) {
      console.warn(`[Parser] Invalid competitors for event ${event.id}`);
      return null;
    }

    // Determine home/away (ESPN typically puts away team first, home team second)
    const awayTeam = competitors[0];
    const homeTeam = competitors[1];

    // Parse scores (ESPN returns strings, convert to numbers)
    const awayScore = awayTeam.score ? parseInt(awayTeam.score, 10) : null;
    const homeScore = homeTeam.score ? parseInt(homeTeam.score, 10) : null;

    // Parse rankings (99 = unranked in ESPN)
    const awayRank =
      awayTeam.curatedRank?.current === 99
        ? null
        : awayTeam.curatedRank?.current || null;
    const homeRank =
      homeTeam.curatedRank?.current === 99
        ? null
        : homeTeam.curatedRank?.current || null;

    // Parse odds data
    let favoriteTeamId: string | null = null;
    let spread: number | null = null;
    let overUnder: number | null = null;

    if (competition.odds && competition.odds.length > 0) {
      const odds = competition.odds[0];
      overUnder = odds.overUnder || null;

      // Determine favorite team from awayTeamOdds.favorite
      if (odds.awayTeamOdds?.favorite === true) {
        favoriteTeamId = awayTeam.team.id;
      } else if (odds.awayTeamOdds?.favorite === false) {
        favoriteTeamId = homeTeam.team.id;
      }

      // Parse spread from details string (e.g., "UGA -8.5")
      if (odds.details) {
        const spreadMatch = odds.details.match(/-?\d+\.?\d*/);
        if (spreadMatch) {
          spread = parseFloat(spreadMatch[0]);
        }
      }
    }

    const parsedGame: ParsedGame = {
      espnId: event.id,
      date: competition.date,
      week: competition.week?.number || null,
      season: competition.season?.year || new Date().getFullYear(),
      sport,
      league,
      state: competition.status.type.state,
      completed: competition.status.type.completed,
      conferenceGame: competition.conferenceCompetition || false,
      neutralSite: competition.neutralSite || false,
      home: {
        teamId: homeTeam.team.id,
        abbrev: homeTeam.team.abbreviation,
        score: homeScore,
        rank: homeRank,
      },
      away: {
        teamId: awayTeam.team.id,
        abbrev: awayTeam.team.abbreviation,
        score: awayScore,
        rank: awayRank,
      },
      odds: {
        favoriteTeamId,
        spread,
        overUnder,
      },
      lastUpdated: new Date(),
    };

    return parsedGame;
  } catch (error) {
    console.error(`[Parser] Failed to parse event ${event.id}:`, error);
    return null;
  }
};

/**
 * Parse multiple ESPN events
 */
export const parseESPNEvents = (
  events: ESPNEvent[],
  sport: string = "football",
  league: string = "college-football"
): ParsedGame[] => {
  const parsedGames: ParsedGame[] = [];

  for (const event of events) {
    const parsed = parseESPNEvent(event, sport, league);
    if (parsed) {
      parsedGames.push(parsed);
    }
  }

  console.log(
    `[Parser] Parsed ${parsedGames.length}/${events.length} events successfully`
  );
  return parsedGames;
};

/**
 * Parse ESPN game summary response (different structure than scoreboard)
 */
export const parseESPNGameSummary = (summary: {
  header?: { competitions?: import("./espn-client").ESPNCompetition[] };
}): ParsedGame | null => {
  try {
    // Game summary has competition data at .header.competitions[0] instead of .competitions[0]
    const competition = summary.header?.competitions?.[0];
    if (!competition) {
      console.warn("[Parser] No competition data in game summary");
      return null;
    }

    // Create a mock event object to reuse existing parser
    const mockEvent = {
      id: competition.id,
      competitions: [competition],
    };

    return parseESPNEvent(mockEvent);
  } catch (error) {
    console.error("[Parser] Failed to parse game summary:", error);
    return null;
  }
};

/**
 * Validate parsed game data before database insertion
 */
export const validateParsedGame = (game: ParsedGame): boolean => {
  const required = [
    "espnId",
    "date",
    "season",
    "state",
    "home.teamId",
    "home.abbrev",
    "away.teamId",
    "away.abbrev",
  ];

  for (const field of required) {
    const value = field.split(".").reduce((obj: unknown, key: string) => {
      if (obj && typeof obj === "object" && key in obj) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, game as unknown);
    if (value === undefined || value === null || value === "") {
      console.warn(`[Parser] Missing required field: ${field}`);
      return false;
    }
  }

  // Validate state enum
  if (!["pre", "in", "post"].includes(game.state)) {
    console.warn(`[Parser] Invalid state: ${game.state}`);
    return false;
  }

  return true;
};
