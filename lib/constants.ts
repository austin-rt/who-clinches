import type { SeasonType } from 'cfbd';
import type { GameTypeMap } from './types';
import {
  CFB_SPORT,
  type CFBConferenceMetadata,
  type CFBConferenceAbbreviation,
} from '@/lib/cfb/constants';

export const JSON_SERVER_URL = 'http://localhost:3001';

export const GAME_TYPE: GameTypeMap = {
  regular: { name: 'Regular Season', abbreviation: 'reg' },
  postseason: { name: 'Postseason', abbreviation: 'post' },
  both: { name: 'Regular Season', abbreviation: 'reg' },
  allstar: { name: 'All-Star', abbreviation: 'allstar' },
  spring_regular: { name: 'Spring Regular', abbreviation: 'spring_reg' },
  spring_postseason: { name: 'Spring Postseason', abbreviation: 'spring_post' },
} as const;

export const CFBD_SEASON_TYPE: Record<Uppercase<SeasonType>, SeasonType> = {
  REGULAR: 'regular',
  POSTSEASON: 'postseason',
  BOTH: 'both',
  ALLSTAR: 'allstar',
  SPRING_REGULAR: 'spring_regular',
  SPRING_POSTSEASON: 'spring_postseason',
} as const;

export const SPORT_METADATA = {
  cfb: CFB_SPORT,
} as const;

export type SportSlug = keyof typeof SPORT_METADATA;

const VALID_SPORTS = Object.keys(SPORT_METADATA) as SportSlug[];

export const isValidSport = (sport: string): sport is SportSlug => {
  return VALID_SPORTS.includes(sport as SportSlug);
};

export const getConferenceMetadata = (conf: string): CFBConferenceMetadata | null => {
  return conf in CFB_SPORT.conferences
    ? CFB_SPORT.conferences[conf as CFBConferenceAbbreviation]
    : null;
};

export const isValidConference = (conf: string): conf is CFBConferenceAbbreviation => {
  return conf in CFB_SPORT.conferences;
};
