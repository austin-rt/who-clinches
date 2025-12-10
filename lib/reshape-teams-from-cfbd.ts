import type { Team } from 'cfbd';
import type { ReshapedTeam } from './types';

export const extractTeamsFromCfbd = (cfbdTeams: Team[], conferenceId: string): ReshapedTeam[] => {
  return cfbdTeams.map((team) => ({
    _id: String(team.id),
    name: team.school,
    displayName: team.school + (team.mascot ? ` ${team.mascot}` : ''),
    shortDisplayName: team.school,
    abbreviation: team.abbreviation ?? '',
    logo: team.logos?.[0] || '',
    color: team.color || '000000',
    alternateColor: team.alternateColor || '000000',
    conference: team.conference || conferenceId,
    division: team.division || null,
    record: {
      overall: '0-0',
      conference: '0-0',
      home: '0-0',
      away: '0-0',
      stats: {},
    },
    conferenceStanding: '',
  }));
};
