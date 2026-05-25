export const getDefaultNflSeason = (): number => {
  const fixtureYear = process.env.FIXTURE_YEAR;
  if (fixtureYear) return Number(fixtureYear);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return month >= 9 ? year : year - 1;
};
