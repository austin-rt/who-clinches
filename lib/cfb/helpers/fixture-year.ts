import { getRuntimeConfig } from '@/lib/admin/runtime-config';

export const isFixtureDataSource = (): boolean => {
  return process.env.FIXTURE_YEAR !== undefined || process.env.NODE_ENV === 'test';
};

export const getFixtureYear = async (): Promise<number | null> => {
  const config = await getRuntimeConfig();
  if (config.fixtureYearOn && config.fixtureYear !== null) {
    return config.fixtureYear;
  }
  return null;
};
