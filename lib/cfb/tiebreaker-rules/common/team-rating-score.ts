import { TeamLean, GameLean } from '../../../types';
import type { TeamSP, TeamFPI } from 'cfbd';

const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^the\s+/i, '');
};

const findTeamSpRating = (
  teamId: string,
  teams: TeamLean[],
  spRatings: TeamSP[],
  games?: GameLean[]
): number | null => {
  const team = teams.find((t) => t._id === teamId);
  if (!team) return null;

  // Try to find SP+ rating by matching team names
  let nameVariations = [
    team.name,
    team.displayName,
    team.shortDisplayName,
    team.abbreviation,
  ].filter((n): n is string => !!n);

  // If team names are null, try to get them from games
  if (nameVariations.length === 0 && games) {
    const game = games.find((g) => g.home.teamId === teamId || g.away.teamId === teamId);
    if (game) {
      const gameTeam = game.home.teamId === teamId ? game.home : game.away;
      nameVariations = [gameTeam.displayName, gameTeam.shortDisplayName, gameTeam.abbrev].filter(
        (n): n is string => !!n
      );
    }
  }

  for (const sp of spRatings) {
    if (!sp.team) continue;
    const spName = normalizeTeamName(sp.team);
    for (const name of nameVariations) {
      const normalizedName = normalizeTeamName(name);
      if (spName === normalizedName) {
        const value = sp.ranking !== undefined && sp.ranking !== null ? sp.ranking : sp.rating;
        return value;
      }
      // Try with "State" -> "St" variations
      if (name.includes('State')) {
        const stName = normalizeTeamName(name.replace(/State/g, 'St'));
        if (spName === stName || spName.includes(stName) || stName.includes(spName)) {
          const value = sp.ranking !== undefined && sp.ranking !== null ? sp.ranking : sp.rating;
          return value;
        }
      }
    }
  }

  return null;
};

const findTeamSorRating = (
  teamId: string,
  teams: TeamLean[],
  fpiRatings: TeamFPI[],
  games?: GameLean[]
): number | null => {
  const team = teams.find((t) => t._id === teamId);
  if (!team) return null;

  // Try to find SOR rating by matching team names
  let nameVariations = [
    team.name,
    team.displayName,
    team.shortDisplayName,
    team.abbreviation,
  ].filter((n): n is string => !!n);

  // If team names are null, try to get them from games
  if (nameVariations.length === 0 && games) {
    const game = games.find((g) => g.home.teamId === teamId || g.away.teamId === teamId);
    if (game) {
      const gameTeam = game.home.teamId === teamId ? game.home : game.away;
      nameVariations = [gameTeam.displayName, gameTeam.shortDisplayName, gameTeam.abbrev].filter(
        (n): n is string => !!n
      );
    }
  }

  for (const fpi of fpiRatings) {
    if (!fpi.team || !fpi.resumeRanks?.strengthOfRecord) continue;
    const fpiName = normalizeTeamName(fpi.team);
    for (const name of nameVariations) {
      const normalizedName = normalizeTeamName(name);
      if (fpiName === normalizedName) {
        const sor = fpi.resumeRanks.strengthOfRecord;
        return sor;
      }
      // Try with "State" -> "St" variations
      if (name.includes('State')) {
        const stName = normalizeTeamName(name.replace(/State/g, 'St'));
        if (fpiName === stName || fpiName.includes(stName) || stName.includes(fpiName)) {
          const sor = fpi.resumeRanks.strengthOfRecord;
          return sor;
        }
      }
    }
  }

  return null;
};

export const calculateTeamRatingScore = (
  teamId: string,
  teams: TeamLean[],
  tiedTeams: string[],
  useCfpFirst: boolean,
  spRatings?: TeamSP[],
  fpiRatings?: TeamFPI[],
  games?: GameLean[]
): number => {
  const team = teams.find((t) => t._id === teamId);
  if (!team) {
    return 0;
  }

  if (useCfpFirst && team.cfpRank !== undefined && team.cfpRank !== null) {
    const tiedTeamRanks = tiedTeams
      .map((tid) => {
        const t = teams.find((t) => t._id === tid);
        return t?.cfpRank !== undefined && t.cfpRank !== null ? t.cfpRank : null;
      })
      .filter((rank): rank is number => rank !== null);

    if (tiedTeamRanks.length > 0) {
      const minRank = Math.min(...tiedTeamRanks);
      const maxRank = Math.max(...tiedTeamRanks);
      const range = maxRank - minRank;

      if (range === 0) {
        return 1.0;
      }

      const normalized = 1.0 - (team.cfpRank - minRank) / range;
      return normalized;
    }
  }

  // If SP+ and FPI data are provided, use them directly
  if (spRatings && fpiRatings && spRatings.length > 0 && fpiRatings.length > 0) {
    const tiedTeamSpRatings = tiedTeams
      .map((tid) => {
        const rating = findTeamSpRating(tid, teams, spRatings, games);
        return rating !== null ? { teamId: tid, rating } : null;
      })
      .filter((r): r is { teamId: string; rating: number } => r !== null);

    const tiedTeamSorRatings = tiedTeams
      .map((tid) => {
        const rating = findTeamSorRating(tid, teams, fpiRatings, games);
        return rating !== null ? { teamId: tid, rating } : null;
      })
      .filter((r): r is { teamId: string; rating: number } => r !== null);

    // If SP+ or SOR is not available for all tied teams, fall through to attached data
    if (
      tiedTeamSpRatings.length === tiedTeams.length &&
      tiedTeamSorRatings.length === tiedTeams.length
    ) {
      // MWC uses composite average of rankings (lower = better)
      // Official MWC uses: SP+, SOR, KPI, SportSource (4 systems)
      // We only have SP+ and SOR, so we need to weight them to approximate the 4-system average
      // Since KPI and SportSource are not available, we can't perfectly match the official results
      // However, we can try to weight SP+ and SOR to better approximate what the 4-system average would be
      // Based on the official results, UNLV (45.50) and Boise State (47.75) should rank above SDSU (51.00)
      // If our 2-system average doesn't match, we may need to adjust weights
      const teamSp = findTeamSpRating(teamId, teams, spRatings, games)!;
      const teamSor = findTeamSorRating(teamId, teams, fpiRatings, games)!;

      // Official MWC uses 4 systems: SP+, SOR, KPI, SportSource
      // We only have SP+ and SOR, so we use equal weights: (SP+ + SOR) / 2
      // This approximates what (SP+ + SOR + KPI + SportSource) / 4 would be
      // However, without KPI and SportSource, we cannot match the official results exactly
      // The actual SP+ and SOR values may also differ from what MWC used
      const compositeAverage = (teamSp + teamSor) / 2;

      const allComposites = tiedTeams.map((tid) => {
        const sp = findTeamSpRating(tid, teams, spRatings, games)!;
        const sor = findTeamSorRating(tid, teams, fpiRatings, games)!;
        // Use same weighting as above: equal weights
        const composite = (sp + sor) / 2;
        return composite;
      });

      const minComposite = Math.min(...allComposites);
      const maxComposite = Math.max(...allComposites);
      const compositeRange = maxComposite - minComposite;

      return compositeRange === 0 ? 0.5 : 1.0 - (compositeAverage - minComposite) / compositeRange;
    }
  }

  // Fallback to attached team data if SP+/FPI data not provided
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
