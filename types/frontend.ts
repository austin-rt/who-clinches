import { TeamMetadata, StandingEntry, GamesResponse } from '@/app/store/api';

export type ThemeMode = 'light' | 'dark';

export type ViewMode = 'picks' | 'scores';

export interface GameFromResponse {
  espnId: string;
  displayName: string;
  home: {
    teamEspnId: string;
    abbrev: string;
    score?: number;
    rank?: number;
  };
  away: {
    teamEspnId: string;
    abbrev: string;
    score?: number;
    rank?: number;
  };
  predictedScore: {
    home: number;
    away: number;
  };
}

export interface UserOverrides {
  [gameEspnId: string]: {
    homeScore: number;
    awayScore: number;
  };
}

export type SECTeam = TeamMetadata;

export interface ThemeConfig {
  defaultTheme: string;
  name: string;
}

export interface ConferenceThemes {
  [conferenceId: string]: ThemeConfig;
}

export type { TeamMetadata, StandingEntry, GamesResponse };
