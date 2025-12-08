import type { Conference } from 'cfbd';

export type SportSlug = 'cfb';

const VALID_SPORTS: SportSlug[] = ['cfb'];

export const isValidSport = (sport: string): sport is SportSlug => {
  return VALID_SPORTS.includes(sport as SportSlug);
};

export interface ConferenceMetadata {
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
} as const satisfies Record<string, ConferenceMetadata>;

export type ConferenceAbbreviation = keyof typeof CFB_CONFERENCE_METADATA;

export const getConferenceMetadata = (conf: string): ConferenceMetadata | null => {
  return conf in CFB_CONFERENCE_METADATA
    ? CFB_CONFERENCE_METADATA[conf as ConferenceAbbreviation]
    : null;
};

export const isValidConference = (conf: string): conf is ConferenceAbbreviation => {
  return conf in CFB_CONFERENCE_METADATA;
};
