import type { EspnTeamGenerated } from './espn/espn-team-generated';

export type GameState = 'pre' | 'in' | 'post';

export interface ReshapedGame {
  espnId: string;
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
  venue: {
    fullName: string;
    city: string;
    state: string;
    timezone: string;
  };
  home: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;
    score: number | null;
    rank: number | null;
    logo: string;
    color: string;
    shortDisplayName: string;
    alternateColor: string;
  };
  away: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;
    score: number | null;
    rank: number | null;
    logo: string;
    color: string;
    shortDisplayName: string;
    alternateColor: string;
  };
  odds: {
    favoriteTeamEspnId: string | null;
    spread: number | null;
    overUnder: number | null;
  };
  predictedScore: {
    home: number;
    away: number;
  };
  gameType: {
    name: string;
    abbreviation: string;
  };
}

export interface ReshapedTeamRecord {
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

export interface ReshapedTeam {
  _id: string;
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  conferenceId: string;
  record: ReshapedTeamRecord;
  conferenceStanding: string;
  nationalRanking: number | null;
  playoffSeed: number | null;
  nextGameId: string | null;
  lastUpdated: Date;
}

export interface ReshapeResult<T> {
  games: T[];
  teams: T[];
}

export interface TeamDataResponse {
  abbreviation: string;
  data: EspnTeamGenerated | null;
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

export interface GameLean {
  _id: string;
  espnId: string;
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
  venue: {
    fullName: string;
    city: string;
    state: string;
    timezone: string;
  };
  home: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;
    shortDisplayName: string;
    logo: string;
    color: string;
    alternateColor: string;
    score: number | null;
    rank: number | null;
  };
  away: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;
    shortDisplayName: string;
    logo: string;
    color: string;
    alternateColor: string;
    score: number | null;
    rank: number | null;
  };
  odds: {
    favoriteTeamEspnId: string | null;
    spread: number | null;
    overUnder: number | null;
  };
  predictedScore: {
    home: number;
    away: number;
  };
  gameType: {
    name: string;
    abbreviation: string;
  };
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
  record: {
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
  };
  conferenceStanding: string;
  nationalRanking: number | null;
  playoffSeed: number | null;
  nextGameId: string | null;
  lastUpdated: Date;
}
