import type { Conference } from 'cfbd';
import { CFBConferenceTiebreakerConfig } from '@/lib/cfb/tiebreaker-rules/core/types';
import { CFB_SEC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/sec/config';
import { CFB_MAC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/mac/config';
import { CFB_ACC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/acc/config';
import { CFB_B1G_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/b1g/config';

export type SportSlug = 'cfb';

const VALID_SPORTS: SportSlug[] = ['cfb'];

export const isValidSport = (sport: string): sport is SportSlug => {
  return VALID_SPORTS.includes(sport as SportSlug);
};

export interface CFBConferenceMetadata {
  cfbdId: NonNullable<Conference['abbreviation']>;
  name: string;
}

export const CFB_CONFERENCE_METADATA = {
  sec: {
    cfbdId: 'SEC',
    name: 'SEC',
  },
  acc: {
    cfbdId: 'ACC',
    name: 'ACC',
  },
  b1g: {
    cfbdId: 'B1G',
    name: 'Big Ten',
  },
  big12: {
    cfbdId: 'B12',
    name: 'Big 12',
  },
  pac: {
    cfbdId: 'PAC',
    name: 'Pac-12',
  },
  aac: {
    cfbdId: 'AAC',
    name: 'American Athletic',
  },
  mac: {
    cfbdId: 'MAC',
    name: 'MAC',
  },
  cusa: {
    cfbdId: 'CUSA',
    name: 'Conference USA',
  },
  mwc: {
    cfbdId: 'MWC',
    name: 'Mountain West',
  },
  sunbelt: {
    cfbdId: 'SBC',
    name: 'Sun Belt',
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
};

export const CFB_AVAILABLE_CONFERENCES = CFB_CONFERENCE_ABBREVIATIONS.filter(
  (key) => CFB_CONFERENCE_METADATA[key].cfbdId in CFB_CONFERENCE_CONFIGS
);
