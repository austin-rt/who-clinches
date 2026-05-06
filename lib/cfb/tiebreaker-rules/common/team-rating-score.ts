import { TeamLean } from '../../../types';

export const calculateTeamRatingScore = (
  teamId: string,
  teams: TeamLean[],
  tiedTeams: string[],
  useCfpFirst: boolean
): number => {
  const team = teams.find((t) => t._id === teamId);
  if (!team) {
    return 0;
  }

  if (useCfpFirst && team.nationalRank !== undefined && team.nationalRank !== null) {
    const tiedTeamRanks = tiedTeams
      .map((tid) => {
        const t = teams.find((t) => t._id === tid);
        return t?.nationalRank !== undefined && t.nationalRank !== null ? t.nationalRank : null;
      })
      .filter((rank): rank is number => rank !== null);

    if (tiedTeamRanks.length > 0) {
      const minRank = Math.min(...tiedTeamRanks);
      const maxRank = Math.max(...tiedTeamRanks);
      const range = maxRank - minRank;

      if (range === 0) {
        return 1.0;
      }

      return 1.0 - (team.nationalRank - minRank) / range;
    }
  }

  const tiedTeamSpRatings = tiedTeams
    .map((tid) => {
      const t = teams.find((t) => t._id === tid);
      return t?.spPlusRating !== undefined && t.spPlusRating !== null
        ? { teamId: tid, rating: t.spPlusRating }
        : null;
    })
    .filter((r): r is { teamId: string; rating: number } => r !== null);

  const tiedTeamSorRatings = tiedTeams
    .map((tid) => {
      const t = teams.find((t) => t._id === tid);
      return t?.sor !== undefined && t.sor !== null ? { teamId: tid, rating: t.sor } : null;
    })
    .filter((r): r is { teamId: string; rating: number } => r !== null);

  if (
    tiedTeamSpRatings.length !== tiedTeams.length ||
    tiedTeamSorRatings.length !== tiedTeams.length
  ) {
    return 0;
  }

  const teamSp = team.spPlusRating!;
  const teamSor = team.sor!;
  const compositeAverage = (teamSp + teamSor) / 2;

  const allComposites = tiedTeams.map((tid) => {
    const t = teams.find((t) => t._id === tid);
    return (t!.spPlusRating! + t!.sor!) / 2;
  });

  const minComposite = Math.min(...allComposites);
  const maxComposite = Math.max(...allComposites);
  const compositeRange = maxComposite - minComposite;

  return compositeRange === 0 ? 0.5 : 1.0 - (compositeAverage - minComposite) / compositeRange;
};
