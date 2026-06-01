const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

let cachedSeason: { value: number; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const getDefaultSeason = async (): Promise<number> => {
  const fixtureYear = process.env.FIXTURE_YEAR;
  if (fixtureYear) return Number(fixtureYear);

  if (cachedSeason && Date.now() - cachedSeason.fetchedAt < CACHE_TTL_MS) {
    return cachedSeason.value;
  }

  try {
    const res = await globalThis.fetch(ESPN_SCOREBOARD);
    if (res.ok) {
      const data = (await res.json()) as { season?: { year?: number } };
      if (data.season?.year) {
        cachedSeason = { value: data.season.year, fetchedAt: Date.now() };
        return data.season.year;
      }
    }
  } catch {
    // fall through
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};
