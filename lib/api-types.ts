import { GameLean } from './types';

export interface ApiErrorResponse {
  error: string;
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
  tieFlowGraphs: TieFlowGraph[];
}

export interface TieFlowNode {
  id: string;
  teamIds: string[];
  rule: string | null;
  detail: string;
  label: string;
  type: 'root' | 'rule' | 'result';
}

export interface TieFlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  teamIds: string[];
}

export interface TieFlowTeamMeta {
  abbrev: string;
  logo: string;
  color: string;
  displayName: string;
}

export interface TieFlowGraph {
  nodes: TieFlowNode[];
  edges: TieFlowEdge[];
  teams: Record<string, TieFlowTeamMeta>;
  summary: string[];
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
  division?: string | null;
  nationalRank?: number | null;
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
