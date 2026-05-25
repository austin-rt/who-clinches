export const getDefaultNflSeason = (): number => {
  const envYear = process.env.NFL_FIXTURE_YEAR;
  if (envYear) return Number(envYear);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return month >= 9 ? year : year - 1;
};
