const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

let cached: { value: number; at: number } | null = null;
const TTL = 24 * 60 * 60 * 1000;

export const getDefaultNflSeason = async (): Promise<number> => {
  if (process.env.FIXTURE_YEAR) return Number(process.env.FIXTURE_YEAR);

  if (cached && Date.now() - cached.at < TTL) return cached.value;

  try {
    const res = await globalThis.fetch(ESPN_SCOREBOARD);
    if (res.ok) {
      const data = (await res.json()) as { season?: { year?: number } };
      if (data.season?.year) {
        cached = { value: data.season.year, at: Date.now() };
        return data.season.year;
      }
    }
  } catch {
    // fall through
  }

  const month = new Date().getMonth() + 1;
  return month >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
};
