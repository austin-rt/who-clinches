import { getCalendarFromCfbd } from '../cfbd-rest-client';

export const isInSeasonFromCfbd = async (): Promise<boolean> => {
  try {
    const now = Date.now();
    const currentYear = new Date().getFullYear();

    const checkYear = async (year: number): Promise<boolean> => {
      const calendar = await getCalendarFromCfbd(year);
      if (calendar.length === 0) return false;

      const seasonStart = new Date(calendar[0].startDate).getTime();
      const seasonEnd = new Date(calendar[calendar.length - 1].endDate).getTime();

      return now >= seasonStart && now <= seasonEnd;
    };

    return (await checkYear(currentYear)) || (await checkYear(currentYear - 1));
  } catch {
    return false;
  }
};
