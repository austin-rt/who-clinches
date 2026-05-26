import type { NflConference, NflDivisionId, NflTeamMeta } from '@/lib/nfl/constants';

export type FilterScope =
  | { level: 'league' }
  | { level: 'conference'; conference: NflConference }
  | { level: 'division'; conference: NflConference; division: string; divisionId: NflDivisionId }
  | {
      level: 'team';
      conference: NflConference;
      division: string;
      divisionId: NflDivisionId;
      team: NflTeamMeta;
    };
