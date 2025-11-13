/**
 * Constants for SEC Tiebreaker application
 */

/**
 * SEC team abbreviations as used by ESPN API
 * Used for initial data seeding and batch operations
 */
export const SEC_TEAMS = [
  'INVALID', // Alabama
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

/**
 * SEC Conference ID in ESPN API
 * Note: ESPN is inconsistent - scoreboard API uses "8" but team API returns "80" in groups.parent.id
 * We use 8 for queries and rely on conferenceCompetition boolean flag instead of comparing IDs
 */
export const SEC_CONFERENCE_ID = 8;

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
  [SEC_CONFERENCE_ID]: SEC_TEAMS,
} as const;
