import { TeamLean } from '@/lib/types';
import type { TeamSP } from 'cfbd';

const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^the\s+/i, '');
};

export const attachSpPlusToTeams = (teams: TeamLean[], spRatings: TeamSP[]): TeamLean[] => {
  if (!spRatings || spRatings.length === 0) {
    return teams.map((team) => ({ ...team, spPlusRating: undefined }));
  }

  const spMap = new Map<string, number>();

  for (const sp of spRatings) {
    // MWC uses SP+ ranking (not rating) for composite average
    // Use ranking if available, fall back to rating
    const value = sp.ranking !== undefined && sp.ranking !== null ? sp.ranking : sp.rating;
    if (sp.team && value !== undefined && value !== null) {
      const normalizedName = normalizeTeamName(sp.team);
      spMap.set(normalizedName, value);
      // Also try with common variations
      if (sp.team.includes('State')) {
        spMap.set(normalizedName.replace(' state', ' st'), value);
      }
    }
  }

  return teams.map((team) => {
    let rating: number | null | undefined = undefined;

    // Try all name variations
    const nameVariations = [
      team.name,
      team.displayName,
      team.shortDisplayName,
      team.abbreviation,
    ].filter((n): n is string => !!n);

    for (const name of nameVariations) {
      const normalizedName = normalizeTeamName(name);
      if (spMap.has(normalizedName)) {
        rating = spMap.get(normalizedName)!;
        break;
      }
      // Try with "State" -> "St" variations
      if (name.includes('State')) {
        const stName = normalizeTeamName(name.replace(/State/g, 'St'));
        if (spMap.has(stName)) {
          rating = spMap.get(stName)!;
          break;
        }
      }
    }

    if (rating === undefined) {
      rating = null;
    }

    return { ...team, spPlusRating: rating };
  });
};
