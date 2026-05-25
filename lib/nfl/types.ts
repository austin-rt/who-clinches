import type { Game, GameTeam, GameVenue, GameOdds, PredictedScore, GameType, Team } from '../types';

export interface NflGame extends Game {
  divisionGame: boolean;
}

export type NflTeam = Team;

export interface NflRecord {
  wins: number;
  losses: number;
  ties: number;
}

export const nflWinPct = (r: NflRecord): number => {
  const total = r.wins + r.losses + r.ties;
  if (total === 0) return 0;
  return (r.wins + 0.5 * r.ties) / total;
};

export interface NflStandingEntry {
  seed: number;
  teamId: string;
  abbrev: string;
  displayName: string;
  logo: string;
  color: string;
  record: NflRecord;
  confRecord: NflRecord;
  divisionRecord: NflRecord;
  explainPosition: string;
  division: string;
  conference: string;
  isDivisionWinner: boolean;
}

export interface NflPlayoffBracket {
  afc: NflStandingEntry[];
  nfc: NflStandingEntry[];
}

export interface NflSimulateResponse {
  bracket: NflPlayoffBracket;
  divisionStandings: Record<string, NflStandingEntry[]>;
  tieLogs: NflTieLog[];
}

export interface NflTieLog {
  teams: string[];
  procedure: 'division' | 'wildcard';
  steps: NflTieStep[];
}

export interface NflTieStep {
  rule: string;
  detail: string;
  survivors: string[];
  tieBroken: boolean;
}

export type { Game, GameTeam, GameVenue, GameOdds, PredictedScore, GameType, Team };
