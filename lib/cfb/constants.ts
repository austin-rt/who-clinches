/**
 * Constants for SEC Tiebreaker application
 */

export type SportSlug = 'cfb';
export type ConferenceSlug = 'sec';

/**
 * Conference metadata - single source of truth for all conference data
 * Use CONFERENCE_METADATA[conf] to access any conference property
 */
export const CONFERENCE_METADATA: Record<
  ConferenceSlug,
  {
    espnId: number; // ESPN conference ID
    name: 'SEC'; // Display name
    abbreviation: 'SEC'; // Abbreviation
    teams: number; // Number of teams in the conference
    confGames: number; // Number of conference games each team plays per season
  }
> = {
  sec: {
    espnId: 8, // SEC Conference ID in ESPN API
    name: 'SEC',
    abbreviation: 'SEC',
    teams: 16,
    confGames: 8,
  },
} as const;

/**
 * SEC team abbreviations as used by ESPN API
 * Used for initial data seeding and batch operations
 */
export const SEC_TEAMS = [
  'ALA', // Alabama
  'ARK', // Arkansas
  'AUB', // Auburn
  'FLA', // Florida
  'UGA', // Georgia
  'UK', // Kentucky
  'LSU', // LSU
  'MISS', // Ole Miss
  'MSST', // Mississippi State
  'MIZ', // Missouri
  'OU', // Oklahoma
  'SC', // South Carolina
  'TENN', // Tennessee
  'TEX', // Texas
  'TA&M', // Texas A&M
  'VAN', // Vanderbilt
] as const;

// ESPN Core API Record Types (used for finding specific record types)
export const RECORD_TYPE_OVERALL = 'overall';
export const RECORD_TYPE_HOME = 'homerecord';
export const RECORD_TYPE_AWAY = 'awayrecord';
export const RECORD_TYPE_CONFERENCE = 'vsconf';

// ESPN Core API Stat Names (used for extracting stats from flat array)
export const STAT_AVG_POINTS_FOR = 'avgPointsFor';
export const STAT_AVG_POINTS_AGAINST = 'avgPointsAgainst';
export const STAT_WINS = 'wins';
export const STAT_LOSSES = 'losses';
export const STAT_DIFFERENTIAL = 'differential';

/**
 * All supported teams across all conferences
 * To add a new conference: create a new CONFERENCE_TEAMS array above and spread it here
 */
export const ALL_TEAMS = [...SEC_TEAMS] as const;

/**
 * Map of conference IDs to their team arrays
 */
export const CONFERENCE_TEAMS_MAP: Record<number, readonly string[]> = {
  [CONFERENCE_METADATA.sec.espnId]: SEC_TEAMS,
} as const;

/**
 * Season dates for each sport
 * Format: { startMonth, startDay, endMonth, endDay }
 * Dates are relative to the current year
 */
export const SPORT_SEASON_DATES: Record<
  string,
  { startMonth: number; startDay: number; endMonth: number; endDay: number }
> = {
  cfb: {
    startMonth: 7, // August (0-indexed: 7 = August)
    startDay: 15,
    endMonth: 11, // December (0-indexed: 11 = December)
    endDay: 15,
  },
} as const;
