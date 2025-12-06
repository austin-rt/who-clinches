import { getCalendarFromCfbd } from '../cfbd-rest-client';

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
  } catch {
    return new Date().getFullYear();
  }
};
