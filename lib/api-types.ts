import { GameLean, GameState } from './types';

export interface BaseError {
  error: string;
}

export interface ApiErrorResponse extends BaseError {
  code: string;
}

export interface ErrorLogFields extends BaseError {
  timestamp: Date;
  endpoint: string;
  payload: object;
  stackTrace: string;
}

export interface PullTeamsRequest {
  sport: string;
  league: string;
  conf?: string;
  teams?: string[];
  force?: boolean;
}

export interface PullTeamsResponse {
  upserted: number;
  lastUpdated: string;
  errors?: string[];
}

export interface PullGamesRequest {
  sport: string;
  league: string;
  season: number;
  conf: string;
  week?: number;
  force?: boolean;
}

export interface PullGamesResponse {
  upserted: number;
  weeksPulled: number[];
  lastUpdated: string;
  errors?: string[];
}

export interface GamesQueryParams {
  conf?: string;
  season?: string;
  week?: string;
  state?: GameState;
  from?: string;
  to?: string;
  sport?: string;
  league?: string;
}

export interface TeamMetadata {
  id: string;
  abbrev: string;
  displayName: string;
  logo: string;
  color: string;
  alternateColor: string;
}

export interface GamesResponse {
  events: GameLean[];
  teams: TeamMetadata[];
  lastUpdated: string;
}

export interface CronGamesResponse {
  updated: number;
  gamesChecked: number;
  activeGames: number;
  espnCalls: number;
  lastUpdated: string;
  errors?: string[];
}

export interface CronRankingsResponse {
  updated: number;
  teamsChecked: number;
  espnCalls: number;
  lastUpdated: string;
  errors?: string[];
}

export interface CronHealthCheckResponse {
  endpoint: string;
  lastRun: string | null;
  status: 'healthy' | 'warning' | 'error';
  executionTime?: number;
  details?: string;
}

export interface SimulateRequest {
  season: number;
  overrides: {
    [gameId: string]: {
      homeScore: number;
      awayScore: number;
    };
  };
}

export interface SimulateResponse {
  standings: StandingEntry[];
  championship: [string, string];
  tieLogs: TieLog[];
}

export interface StandingEntry {
  rank: number;
  teamId: string;
  abbrev: string;
  displayName: string;
  logo: string;
  color: string;
  record: { wins: number; losses: number };
  confRecord: { wins: number; losses: number };
  explainPosition: string;
}

export interface TieLog {
  teams: string[];
  steps: TieStep[];
}

export interface TieStep {
  rule: string;
  detail: string;
  survivors: string[];
}
