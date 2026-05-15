import type { TeamMetadata } from '@/app/store/api';
import type { TeamLean } from '@/lib/types';

export const toTeamLean = (tm: TeamMetadata): TeamLean => ({
  _id: tm.id,
  name: tm.name,
  displayName: tm.displayName,
  shortDisplayName: tm.shortDisplayName,
  abbreviation: tm.abbrev,
  mascot: tm.mascot ?? null,
  alternateNames: tm.alternateNames ?? [],
  logo: tm.logo,
  color: tm.color,
  alternateColor: tm.alternateColor,
  conferenceId: tm.conferenceId,
  division: tm.division ?? null,
  record: tm.record,
  conferenceStanding: tm.conferenceStanding,
  nationalRank: tm.nationalRank ?? null,
  spPlusRating: tm.spPlusRating ?? null,
  sor: tm.sor ?? null,
});
