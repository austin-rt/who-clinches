import { getRuntimeConfig } from '@/lib/admin/runtime-config';

export const getFixtureYearSync = (): number | null => {
  if (process.env.FIXTURE_YEAR) {
    return parseInt(process.env.FIXTURE_YEAR, 10);
  }
  return null;
};

export const getFixtureYear = async (): Promise<number | null> => {
  if (process.env.VERCEL_ENV === 'production') {
    return getFixtureYearSync();
  }
  const config = await getRuntimeConfig();
  if (config.fixtureYearOn && config.fixtureYear !== null) {
    return config.fixtureYear;
  }
  return getFixtureYearSync();
};
