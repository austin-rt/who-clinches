import { getCalendarFromCfbd } from '../cfbd-rest-client';
import { logError } from '../../errorLogger';

export const getDefaultSeasonFromCfbd = async (): Promise<number> => {
  try {
    const currentYear = new Date().getFullYear();
    const calendar = await getCalendarFromCfbd(currentYear);

    if (calendar && calendar.length > 0) {
      return currentYear;
    }

    const previousYear = currentYear - 1;
    const previousCalendar = await getCalendarFromCfbd(previousYear);

    if (previousCalendar && previousCalendar.length > 0) {
      return previousYear;
    }

    return currentYear;
  } catch (error) {
    await logError(
      error,
      {
        action: 'get-default-season',
      },
      false
    );
    return new Date().getFullYear();
  }
};
