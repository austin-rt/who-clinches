import { getFixtureYear } from '@/lib/cfb/helpers/fixture-year';

export const getDefaultNflSeason = async (): Promise<number> => {
  const fixtureYear = await getFixtureYear();
  if (fixtureYear !== null) return fixtureYear;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return month >= 9 ? year : year - 1;
};
