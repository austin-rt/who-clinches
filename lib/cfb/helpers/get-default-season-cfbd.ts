import { getFixtureYear } from './fixture-year';
import { getDefaultSeason } from '@/lib/helpers/get-default-season';

export const getDefaultSeasonFromCfbd = async (): Promise<number> => {
  if (process.env.FIXTURE_YEAR) {
    const fixtureYear = await getFixtureYear();
    if (fixtureYear !== null) return fixtureYear;
  }

  return getDefaultSeason();
};
