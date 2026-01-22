import { TeamMetadata, StandingEntry, GamesResponse } from '@/app/store/api';

export type ThemeMode = 'light' | 'dark';

export type ViewMode = 'picks' | 'scores';

export type SECTeam = TeamMetadata;

export interface ThemeConfig {
  defaultTheme: string;
  name: string;
}

export interface ConferenceThemes {
  [conferenceId: string]: ThemeConfig;
}

export type { TeamMetadata, StandingEntry, GamesResponse };
