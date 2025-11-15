/**
 * Internal application types for reshaped data
 */

import type { EspnTeamGenerated } from './espn/espn-team-generated';
import type { EspnTeamRecordsGenerated } from './espn/espn-team-records-generated';

/**
 * Game state type - represents the current state of a game
 */
export type GameState = 'pre' | 'in' | 'post';

export interface ReshapedGame {
  espnId: string;
  displayName: string; // "{away abbrev} @ {home abbrev}"
  date: string;
  week: number | null;
  season: number;
  sport: string;
  league: string;
  state: GameState;
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  home: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;
    score: number | null;
    rank: number | null;
    logo: string;
    color: string;
  };
  away: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;
    score: number | null;
    rank: number | null;
    logo: string;
    color: string;
  };
  odds: {
    favoriteTeamEspnId: string | null;
    spread: number | null;
    overUnder: number | null;
  };
  predictedScore?: {
    home: number;
    away: number;
  };
  lastUpdated: Date;
}

export interface TeamRecord {
  overall?: string;
  conference?: string | null;
  home?: string | null;
  away?: string | null;
  stats?: {
    wins?: number;
    losses?: number;
    winPercent?: number;
    pointsFor?: number;
    pointsAgainst?: number;
    pointDifferential?: number;
    avgPointsFor?: number;
    avgPointsAgainst?: number;
  };
}

export interface ReshapedTeam {
  _id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  conferenceId: string;
  record?: TeamRecord;
  conferenceStanding?: string;
  nationalRanking?: number | null;
  playoffSeed?: number | null;
  nextGameId?: string;
  lastUpdated: Date;
}

export interface ReshapeResult<T> {
  games?: T[];
  teams?: T[];
}

export interface TeamDataResponse {
  abbreviation: string;
  data: EspnTeamGenerated | null;
  recordData?: EspnTeamRecordsGenerated | null;
}

export interface MongoQuery {
  conferenceId?: string;
  sport?: string;
  league?: string;
  season?: number;
  week?: number;
  state?: string;
  completed?: boolean;
  conferenceGame?: boolean;
  date?: {
    $gte?: string;
    $lte?: string;
  };
}

// Lean document types (what Mongoose returns with .lean())
export interface GameLean {
  _id: string;
  espnId: string;
  displayName: string; // "{away abbrev} @ {home abbrev}"
  date: string;
  week: number | null;
  season: number;
  sport: string;
  league: string;
  state: GameState;
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  home: {
    teamEspnId: string;
    abbrev: string;
    displayName?: string;
    logo?: string;
    color?: string;
    score: number | null;
    rank: number | null;
  };
  away: {
    teamEspnId: string;
    abbrev: string;
    displayName?: string;
    logo?: string;
    color?: string;
    score: number | null;
    rank: number | null;
  };
  odds: {
    favoriteTeamEspnId: string | null;
    spread: number | null;
    overUnder: number | null;
  };
  predictedScore?: {
    home: number;
    away: number;
  };
  lastUpdated: Date;
}

export interface TeamLean {
  _id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  conferenceId: string;
  record?: {
    overall?: string;
    conference?: string | null;
    home?: string | null;
    away?: string | null;
    stats?: {
      wins?: number;
      losses?: number;
      winPercent?: number;
      pointsFor?: number;
      pointsAgainst?: number;
      pointDifferential?: number;
      avgPointsFor?: number;
      avgPointsAgainst?: number;
    };
  };
  conferenceStanding?: string;
  nationalRanking?: number | null;
  playoffSeed?: number | null;
  nextGameId?: string;
  lastUpdated: Date;
}
