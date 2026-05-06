import type { SeasonType } from 'cfbd';

export type GameState = 'pre' | 'in' | 'post';

export interface GameTeam {
  teamId: string;
  abbrev: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color?: string | null;
  alternateColor?: string | null;
  score: number | null;
  rank: number | null;
  division?: string | null;
}

export interface GameVenue {
  fullName: string;
  city: string;
  state: string;
  timezone: string;
}

export interface GameOdds {
  favoriteTeamId: string | null;
  spread: number | null;
  overUnder: number | null;
}

export interface GameType {
  name: string;
  abbreviation: string;
}

// Type for the GAME_TYPE constant mapping
export type GameTypeMap = Record<SeasonType, GameType>;

export interface PredictedScore {
  home: number;
  away: number;
}

export interface TeamRecord {
  overall: string;
  conference: string;
  home: string;
  away: string;
  stats: {
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

export interface ReshapedGame {
  id: string;
  displayName: string;
  date: string;
  week: number | null;
  season: number;
  sport: string;
  league: string;
  state: GameState;
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  venue: GameVenue;
  home: GameTeam;
  away: GameTeam;
  odds: GameOdds;
  predictedScore: PredictedScore;
  gameType?: GameType;
}

export type ReshapedTeamRecord = TeamRecord;

export interface ReshapedTeam {
  _id: string;
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  conference: string;
  division?: string | null;
  record: ReshapedTeamRecord;
  conferenceStanding: string;
}

export interface ReshapeResult<T> {
  games: T[];
  teams: T[];
}

export interface GameLean {
  _id: string;
  id: string;
  displayName: string;
  date: string;
  week: number | null;
  season: number;
  sport: string;
  league: string;
  state: GameState;
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  venue: GameVenue;
  home: GameTeam;
  away: GameTeam;
  odds: GameOdds;
  predictedScore: PredictedScore;
  gameType?: GameType;
  notes?: string | null;
}

export interface TeamLean {
  _id: string;
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  conferenceId: string;
  division?: string | null;
  record: TeamRecord;
  conferenceStanding: string;
  nationalRank?: number | null;
  spPlusRating?: number | null;
  sor?: number | null;
  advancedStats?: {
    offense: {
      ppa: number;
      successRate: number;
      explosiveness?: number;
      pointsPerOpportunity?: number;
    };
    defense: {
      ppa: number;
      successRate: number;
      explosiveness?: number;
      pointsPerOpportunity?: number;
    };
  };
  turnoverMargin?: number | null;
}
