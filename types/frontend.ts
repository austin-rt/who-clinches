/* Frontend-specific type definitions */

import { TeamMetadata, StandingEntry, GamesResponse } from '@/lib/api-types';

/**
 * Game from API response
 */
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
  predictedScore?: {
    home: number;
    away: number;
  };
}

/**
 * User overrides stored in localStorage
 * Key: game ESPN ID, Value: override scores
 */
export interface UserOverrides {
  [gameEspnId: string]: {
    homeScore: number;
    awayScore: number;
  };
}

/**
 * SECTeam type for specific conference teams
 * Extends TeamMetadata with conference-specific data
 */
export type SECTeam = TeamMetadata;

/**
 * Theme configuration for multi-conference support
 */
export interface ThemeConfig {
  defaultTheme: string;
  name: string;
}

/**
 * Conference themes mapping
 */
export interface ConferenceThemes {
  [conferenceId: string]: ThemeConfig;
}

/**
 * Re-export API types for convenience
 */
export type { TeamMetadata, StandingEntry, GamesResponse };
