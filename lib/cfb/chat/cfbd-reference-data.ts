import type { TeamLean } from '@/lib/types';

export const CFBD_CONFERENCE_PARAMS: Record<string, string> = {
  SEC: 'SEC',
  ACC: 'ACC',
  'Big Ten': 'B1G',
  'Big 12': 'Big 12',
  'Pac-12': 'Pac-12',
  AAC: 'AAC',
  'Conference USA': 'CUSA',
  MAC: 'MAC',
  'Mountain West': 'MWC',
  'Sun Belt': 'SBC',
  Independents: 'Ind',
};

export const buildTeamReferenceContext = (teams: TeamLean[]): string => {
  const entries = teams.map((t) => `${t.shortDisplayName} (id: ${t._id})`).join(', ');
  return `Teams in this conference (CFBD IDs): ${entries}`;
};
