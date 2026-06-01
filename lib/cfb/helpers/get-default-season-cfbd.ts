import { getCalendarFromCfbd } from '../cfbd-rest-client';
import { logError } from '../../errorLogger';
import { getFixtureYear } from './fixture-year';
import { getDefaultSeason } from '@/lib/helpers/get-default-season';

export const getDefaultSeasonFromCfbd = async (): Promise<number> => {
  if (process.env.FIXTURE_YEAR) {
    const fixtureYear = await getFixtureYear();
    if (fixtureYear !== null) return fixtureYear;
  }

  const base = getDefaultSeason();

  try {
    const now = new Date();
    const month = now.getMonth() + 1;

    if (month >= 4) return base;

    const currentYear = now.getFullYear();
    const calendar = await getCalendarFromCfbd(currentYear);
    if (calendar && calendar.length > 0) return currentYear;

    return currentYear - 1;
  } catch (error) {
    await logError(error, { action: 'get-default-season' });
    return base;
  }
};
