import type { Conference, SeasonType } from 'cfbd';
import type { GameTypeMap } from './types';
import { CFBConferenceTiebreakerConfig } from '@/lib/cfb/tiebreaker-rules/core/types';
import { CFB_SEC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/sec/config';
import { CFB_MAC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/mac/config';
import { CFB_ACC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/acc/config';
import { CFB_B1G_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/b1g/config';
import { CFB_BIG12_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/big12/config';
import { CFB_PAC12_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/pac12/config';
import { CFB_CUSA_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/cusa/config';
import { CFB_MWC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/mwc/config';
import { CFB_AAC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/aac/config';
import { CFB_SUNBELT_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/sunbelt/config';

export const JSON_SERVER_URL = 'http://localhost:3001';

// Map CFBD SeasonType to GameType with display names and abbreviations
export const GAME_TYPE: GameTypeMap = {
  regular: { name: 'Regular Season', abbreviation: 'reg' },
  postseason: { name: 'Postseason', abbreviation: 'post' },
  both: { name: 'Regular Season', abbreviation: 'reg' },
  allstar: { name: 'All-Star', abbreviation: 'allstar' },
  spring_regular: { name: 'Spring Regular', abbreviation: 'spring_reg' },
  spring_postseason: { name: 'Spring Postseason', abbreviation: 'spring_post' },
} as const;

export type SportSlug = 'cfb';

// Re-export CFBD SeasonType values as constants for convenience
export const CFBD_SEASON_TYPE: Record<Uppercase<SeasonType>, SeasonType> = {
  REGULAR: 'regular',
  POSTSEASON: 'postseason',
  BOTH: 'both',
  ALLSTAR: 'allstar',
  SPRING_REGULAR: 'spring_regular',
  SPRING_POSTSEASON: 'spring_postseason',
} as const;

const VALID_SPORTS: SportSlug[] = ['cfb'];

export const isValidSport = (sport: string): sport is SportSlug => {
  return VALID_SPORTS.includes(sport as SportSlug);
};

export interface CFBConferenceMetadata {
  cfbdId: NonNullable<Conference['abbreviation']>;
  name: string;
  theme: string;
  simulationDisclaimer?: string;
}

export const CFB_CONFERENCE_METADATA = {
  sec: {
    cfbdId: 'SEC',
    name: 'SEC',
    theme: 'sec',
  },
  acc: {
    cfbdId: 'ACC',
    name: 'ACC',
    theme: 'acc',
    simulationDisclaimer:
      'there is a tie that cannot be broken by head-to-head or common opponents',
  },
  b1g: {
    cfbdId: 'B1G',
    name: 'Big Ten',
    theme: 'b1g',
    simulationDisclaimer:
      'there is a tie that cannot be broken by head-to-head or common opponents',
  },
  big12: {
    cfbdId: 'B12',
    name: 'Big 12',
    theme: 'big12',
    simulationDisclaimer:
      'there is a tie that cannot be broken by head-to-head or common opponents',
  },
  pac: {
    cfbdId: 'PAC',
    name: 'Pac-12',
    theme: 'pac12',
    simulationDisclaimer:
      'there is a tie that cannot be broken by head-to-head or common opponents',
  },
  aac: {
    cfbdId: 'AAC',
    name: 'American Athletic',
    theme: 'aac',
    simulationDisclaimer: 'there is a 3+ way tie with no head-to-head results',
  },
  mac: {
    cfbdId: 'MAC',
    name: 'MAC',
    theme: 'mac',
    simulationDisclaimer:
      'there is a tie that cannot be broken by head-to-head or common opponents',
  },
  cusa: {
    cfbdId: 'CUSA',
    name: 'Conference USA',
    theme: 'cusa',
    simulationDisclaimer:
      'there is a tie that cannot be broken by head-to-head or common opponents',
  },
  mwc: {
    cfbdId: 'MWC',
    name: 'Mountain West',
    theme: 'mw',
    simulationDisclaimer: 'there is a 3+ way tie with no head-to-head results',
  },
  sunbelt: {
    cfbdId: 'SBC',
    name: 'Sun Belt',
    theme: 'sunbelt',
    simulationDisclaimer:
      'there is a tie that cannot be broken by head-to-head or common opponents',
  },
} as const satisfies Record<string, CFBConferenceMetadata>;

export type CFBConferenceAbbreviation = keyof typeof CFB_CONFERENCE_METADATA;

export const CFB_CONFERENCE_ABBREVIATIONS = Object.keys(
  CFB_CONFERENCE_METADATA
) as CFBConferenceAbbreviation[];

export const getConferenceMetadata = (conf: string): CFBConferenceMetadata | null => {
  return conf in CFB_CONFERENCE_METADATA
    ? CFB_CONFERENCE_METADATA[conf as CFBConferenceAbbreviation]
    : null;
};

export const isValidConference = (conf: string): conf is CFBConferenceAbbreviation => {
  return conf in CFB_CONFERENCE_METADATA;
};

export const CFB_CONFERENCE_CONFIGS: Record<string, CFBConferenceTiebreakerConfig> = {
  SEC: CFB_SEC_TIEBREAKER_CONFIG,
  MAC: CFB_MAC_TIEBREAKER_CONFIG,
  ACC: CFB_ACC_TIEBREAKER_CONFIG,
  B1G: CFB_B1G_TIEBREAKER_CONFIG,
  B12: CFB_BIG12_TIEBREAKER_CONFIG,
  PAC: CFB_PAC12_TIEBREAKER_CONFIG,
  CUSA: CFB_CUSA_TIEBREAKER_CONFIG,
  MWC: CFB_MWC_TIEBREAKER_CONFIG,
  AAC: CFB_AAC_TIEBREAKER_CONFIG,
  SBC: CFB_SUNBELT_TIEBREAKER_CONFIG,
};

export const CFB_AVAILABLE_CONFERENCES = CFB_CONFERENCE_ABBREVIATIONS.filter(
  (key) => CFB_CONFERENCE_METADATA[key].cfbdId in CFB_CONFERENCE_CONFIGS
);
