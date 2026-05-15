import { getTeamsFromCfbd } from '../cfbd-rest-client';
import { createTeamMatcher, type TeamIndexEntry } from './fuzzy-team-matcher';

let cachedIndex: TeamIndexEntry[] | null = null;

export const loadTeamIndex = async (): Promise<TeamIndexEntry[]> => {
  if (cachedIndex) return cachedIndex;

  const cfbdTeams = await getTeamsFromCfbd({ classification: 'fbs' });

  cachedIndex = cfbdTeams.map((t) => ({
    id: t.id ?? 0,
    school: t.school ?? '',
    mascot: t.mascot ?? null,
    abbreviation: t.abbreviation ?? '',
    alternateNames: (t as unknown as { alternateNames?: string[] }).alternateNames ?? [],
    conference: t.conference ?? null,
  }));

  return cachedIndex;
};

export const getTeamMatcher = async () => {
  const index = await loadTeamIndex();
  return createTeamMatcher(index);
};
