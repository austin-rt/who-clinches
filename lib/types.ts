import type { EspnTeamGenerated } from './espn/espn-team-generated';
import type {
  GameState,
  GameTeam,
  GameVenue,
  GameOdds,
  GameType,
  PredictedScore,
} from './models/Game';
import type { TeamRecord } from './models/Team';

export type { GameState, GameTeam, GameVenue, GameOdds, GameType, PredictedScore };
export type { TeamRecord };

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
  venue: GameVenue;
  home: GameTeam;
  away: GameTeam;
  odds: GameOdds;
  predictedScore: PredictedScore;
  gameType?: GameType;
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
  record: TeamRecord;
  conferenceStanding: string;
  nationalRanking: number | null;
  playoffSeed: number | null;
  nextGameId: string | null;
  lastUpdated: Date;
}
