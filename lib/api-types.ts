import { GameLean } from './types';

export interface BaseError {
  error: string;
}

export interface ApiErrorResponse extends BaseError {
  code: string;
}


export interface TeamMetadata {
  id: string;
  abbrev: string;
  name: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color: string;
  alternateColor: string;
  conferenceStanding: string;
  conferenceRecord: string;
  rank: number | null;
}

export interface GamesResponse {
  events: GameLean[];
  teams: TeamMetadata[];
  season?: number;
}


export interface SimulateRequest {
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
  tieBroken: boolean;
  label: 'Advances' | 'Remaining' | 'Ranked last';
}
