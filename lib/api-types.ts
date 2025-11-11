/**
 * Shared API request and response types
 */

import { GameLean } from "./types";

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error fields shared across error responses and error documents
 */
export interface BaseError {
  error: string;
}

/**
 * HTTP API error response sent to clients
 */
export interface ApiErrorResponse extends BaseError {
  code: string;
}

/**
 * Error document stored in MongoDB
 * Note: The full IError interface is in lib/models/Error.ts
 * This type represents the common structure for error logging
 */
export interface ErrorLogFields extends BaseError {
  timestamp: Date;
  endpoint: string;
  payload: object;
  stackTrace: string;
}

// ============================================================================
// /api/pull-teams
// ============================================================================

export interface PullTeamsRequest {
  sport: string;
  league: string;
  conferenceId?: number;
  teams?: string[];
}

export interface PullTeamsResponse {
  upserted: number;
  lastUpdated: string;
  errors?: string[];
}

// ============================================================================
// /api/pull-games
// ============================================================================

export interface PullGamesRequest {
  sport: string;
  league: string;
  season: number;
  conferenceId: number;
  week?: number;
}

export interface PullGamesResponse {
  upserted: number;
  weeksPulled: number[];
  lastUpdated: string;
  errors?: string[];
}

// ============================================================================
// /api/games (GET)
// ============================================================================

export interface GamesQueryParams {
  conferenceId?: string;
  season?: string;
  week?: string;
  state?: "pre" | "in" | "post";
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
}

export interface GamesResponse {
  events: GameLean[];
  teams: TeamMetadata[];
  lastUpdated: string;
}

// ============================================================================
// /api/cron/update-live-games
// ============================================================================

export interface CronLiveGamesResponse {
  updated: number;
  gamesChecked: number;
  activeGames: number;
  espnCalls: number;
  lastUpdated: string;
  errors?: string[];
}

// ============================================================================
// /api/cron/update-rankings
// ============================================================================

export interface CronRankingsResponse {
  updated: number;
  teamsChecked: number;
  espnCalls: number;
  lastUpdated: string;
  errors?: string[];
}

// ============================================================================
// /api/cron/health (OPTIONAL)
// ============================================================================

export interface CronHealthCheckResponse {
  endpoint: string;
  lastRun: string | null;
  status: "healthy" | "warning" | "error";
  executionTime?: number;
  details?: string;
}

