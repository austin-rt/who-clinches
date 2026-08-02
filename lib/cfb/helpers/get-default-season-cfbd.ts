import { getCalendar } from '../calendar-cached';
import { logError } from '../../errorLogger';
import { getFixtureYear } from './fixture-year';

export const getDefaultSeasonFromCfbd = async (): Promise<number> => {
  if (process.env.FIXTURE_YEAR) {
    const fixtureYear = await getFixtureYear();
    if (fixtureYear !== null) return fixtureYear;
  }

  const currentYear = new Date().getFullYear();

  try {
    const calendar = await getCalendar(currentYear);
    if (calendar && calendar.length > 0) return currentYear;
    return currentYear - 1;
  } catch (error) {
    await logError(error, { action: 'get-default-season' });
    return currentYear - 1;
  }
};
