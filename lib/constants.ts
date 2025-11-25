export type SportSlug = 'cfb';

export type ConferenceSlug = 'sec';

export interface ConferenceMetadata {
  espnId: string;
  name: string;
  abbreviation: string;
  teams: number;
  confGames: number;
}

export interface SportConfig {
  espnRoute: string;
  conferences: Record<ConferenceSlug, ConferenceMetadata>;
}

export type SportsConfig = Record<SportSlug, SportConfig>;

export const sports: SportsConfig = {
  cfb: {
    espnRoute: 'football/college-football',
    conferences: {
      sec: {
        espnId: '8',
        name: 'SEC',
        abbreviation: 'SEC',
        teams: 16,
        confGames: 8,
      },
    },
  },
} as const;

export const RECORD_TYPE_OVERALL = 'overall';
export const RECORD_TYPE_HOME = 'homerecord';
export const RECORD_TYPE_HOME_BASKETBALL = 'home';
export const RECORD_TYPE_AWAY = 'awayrecord';
export const RECORD_TYPE_AWAY_BASKETBALL = 'road';
export const RECORD_TYPE_CONFERENCE = 'vsconf';

export const STAT_AVG_POINTS_FOR = 'avgPointsFor';
export const STAT_AVG_POINTS_AGAINST = 'avgPointsAgainst';
export const STAT_WINS = 'wins';
export const STAT_LOSSES = 'losses';
export const STAT_DIFFERENTIAL = 'differential';
