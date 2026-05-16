import { getRuntimeConfig } from '@/lib/admin/runtime-config';

export const isFixtureDataSource = (): boolean => {
  return process.env.FIXTURE_YEAR !== undefined || process.env.NODE_ENV === 'test';
};

export const isFixtureDataSourceAsync = async (): Promise<boolean> => {
  if (process.env.NODE_ENV === 'test') return true;
  if (process.env.FIXTURE_YEAR !== undefined) return true;
  const config = await getRuntimeConfig();
  return config.fixtureYearOn;
};

export const getFixtureYear = async (): Promise<number | null> => {
  const config = await getRuntimeConfig();
  if (config.fixtureYearOn && config.fixtureYear !== null) {
    return config.fixtureYear;
  }
  return null;
};
