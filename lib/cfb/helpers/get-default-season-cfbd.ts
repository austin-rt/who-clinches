import { getCalendarFromCfbd } from '../cfbd-rest-client';
import { logError } from '../../errorLogger';
import { getFixtureYear } from './fixture-year';

export const getDefaultSeasonFromCfbd = async (): Promise<number> => {
  const fixtureYear = await getFixtureYear();
  if (fixtureYear !== null && process.env.NODE_ENV === 'development') return fixtureYear;

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth();

    if (month >= 3) return currentYear;

    const calendar = await getCalendarFromCfbd(currentYear);
    if (calendar && calendar.length > 0) return currentYear;

    return currentYear - 1;
  } catch (error) {
    await logError(error, {
      action: 'get-default-season',
    });
    return new Date().getFullYear() - 1;
  }
};
