export interface GameFilter {
  season: number;
  conference?: string;
  week?: number;
  seasonType?: string;
}

export const buildGameWhere = (filter: GameFilter): Record<string, unknown> => {
  const where: Record<string, unknown> = { season: { _eq: filter.season } };

  if (filter.week !== undefined) {
    where.week = { _eq: filter.week };
  }
  if (filter.seasonType) {
    where.seasonType = { _eq: filter.seasonType };
  }
  if (filter.conference) {
    where._or = [
      { homeConference: { _eq: filter.conference } },
      { awayConference: { _eq: filter.conference } },
    ];
  }

  return where;
};

export const buildTeamWhere = (
  season: number,
  filter: { conference?: string; classification?: string } = {}
): Record<string, unknown> => {
  const where: Record<string, unknown> = {
    active: { _eq: true },
    startYear: { _lte: season },
    _or: [{ endYear: { _isNull: true } }, { endYear: { _gte: season } }],
  };
  if (filter.conference) {
    where.conference = { _eq: filter.conference };
  }
  if (filter.classification) {
    where.classification = { _eq: filter.classification };
  }
  return where;
};
