/**
 * Constants for SEC Tiebreaker application
 */

/**
 * SEC team abbreviations as used by ESPN API
 * Used for initial data seeding and batch operations
 */
export const SEC_TEAMS = [
  "ALA", // Alabama
  "ARK", // Arkansas
  "AUB", // Auburn
  "FLA", // Florida
  "UGA", // Georgia
  "UK", // Kentucky
  "LSU", // LSU
  "MISS", // Ole Miss
  "MSU", // Mississippi State
  "MIZ", // Missouri
  "OU", // Oklahoma
  "SC", // South Carolina
  "TENN", // Tennessee
  "TEX", // Texas
  "TA&M", // Texas A&M
  "VAN", // Vanderbilt
] as const;

/**
 * SEC Conference ID in ESPN API
 */
export const SEC_CONFERENCE_ID = 8;

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
