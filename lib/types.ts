export type GameState = 'pre' | 'in' | 'post';

export type CfbdSeasonType =
  | 'regular'
  | 'postseason'
  | 'both'
  | 'allstar'
  | 'spring_regular'
  | 'spring_postseason';

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

export type GameTypeMap = Record<CfbdSeasonType, GameType>;

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
  startTimeTBD?: boolean;
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
  mascot?: string | null;
  alternateNames?: string[];
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

// --- Base types (sport-agnostic) ---

export interface Game {
  _id: string;
  id: string;
  displayName: string;
  date: string;
  startTimeTBD?: boolean;
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

export interface Team {
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
  mascot?: string | null;
  alternateNames?: string[];
}

// --- CFB extensions ---

export interface CfbTeam extends Team {
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

// --- Backward-compatible aliases (use Game/Team/CfbTeam in new code) ---

export type GameLean = Game;
export type TeamLean = CfbTeam;
