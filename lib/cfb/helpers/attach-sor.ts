import { TeamLean } from '@/lib/types';
import type { TeamFPI } from 'cfbd';

const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^the\s+/i, '');
};

export const attachSorToTeams = (
  teams: TeamLean[],
  fpiRatings: TeamFPI[]
): TeamLean[] => {
  if (!fpiRatings || fpiRatings.length === 0) {
    return teams.map((team) => ({ ...team, sor: undefined }));
  }

  const sorMap = new Map<string, number>();

  for (const fpi of fpiRatings) {
    if (
      fpi.team &&
      fpi.resumeRanks?.strengthOfRecord !== undefined &&
      fpi.resumeRanks.strengthOfRecord !== null
    ) {
      const normalizedName = normalizeTeamName(fpi.team);
      sorMap.set(normalizedName, fpi.resumeRanks.strengthOfRecord);
    }
  }

  return teams.map((team) => {
    let sor: number | null | undefined = undefined;

    // Try all name variations
    const nameVariations = [
      team.name,
      team.displayName,
      team.shortDisplayName,
      team.abbreviation,
    ].filter((n): n is string => !!n);

    for (const name of nameVariations) {
      const normalizedName = normalizeTeamName(name);
      if (sorMap.has(normalizedName)) {
        sor = sorMap.get(normalizedName)!;
        break;
      }
      // Try with "State" -> "St" variations
      if (name.includes('State')) {
        const stName = normalizeTeamName(name.replace(/State/g, 'St'));
        if (sorMap.has(stName)) {
          sor = sorMap.get(stName)!;
          break;
        }
      }
    }

    if (sor === undefined) {
      sor = null;
    }

    return { ...team, sor };
  });
};
