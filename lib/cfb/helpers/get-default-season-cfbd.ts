import { getCalendarFromCfbd } from '../cfbd-rest-client';
import { logError } from '../../errorLogger';

export const getDefaultSeasonFromCfbd = async (): Promise<number> => {
  try {
    const currentYear = new Date().getFullYear();
    const calendar = await getCalendarFromCfbd(currentYear);

    if (calendar && calendar.length > 0) {
      return currentYear;
    }

    return currentYear - 1;
  } catch (error) {
    await logError(
      error,
      {
        action: 'get-default-season',
      },
      false
    );
    return new Date().getFullYear() - 1;
  }
};
