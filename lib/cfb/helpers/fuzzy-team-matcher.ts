import Fuse, { type IFuseOptions } from 'fuse.js';

export interface TeamIndexEntry {
  id: number;
  school: string;
  mascot: string | null;
  abbreviation: string;
  alternateNames: string[];
  conference: string | null;
}

const fuseOptions: IFuseOptions<TeamIndexEntry> = {
  keys: [
    { name: 'school', weight: 0.35 },
    { name: 'mascot', weight: 0.25 },
    { name: 'abbreviation', weight: 0.2 },
    { name: 'alternateNames', weight: 0.2 },
  ],
  threshold: 0.35,
  includeScore: true,
};

export interface FuzzyMatchResult {
  team: TeamIndexEntry;
  score: number;
}

export const createTeamMatcher = (teams: TeamIndexEntry[]) => {
  const fuse = new Fuse(teams, fuseOptions);

  return {
    search: (query: string, limit: number = 5): FuzzyMatchResult[] =>
      fuse.search(query, { limit }).map((r) => ({ team: r.item, score: r.score ?? 1 })),

    bestMatch: (query: string): FuzzyMatchResult | null => {
      const results = fuse.search(query, { limit: 1 });
      if (results.length === 0) return null;
      return { team: results[0].item, score: results[0].score ?? 1 };
    },

    isAmbiguous: (query: string, ambiguityGap: number = 0.1): boolean => {
      const results = fuse.search(query, { limit: 2 });
      if (results.length < 2) return false;
      const [first, second] = results;
      return Math.abs((first.score ?? 0) - (second.score ?? 0)) < ambiguityGap;
    },

    topMatches: (query: string, limit: number = 3): FuzzyMatchResult[] =>
      fuse.search(query, { limit }).map((r) => ({ team: r.item, score: r.score ?? 1 })),
  };
};
