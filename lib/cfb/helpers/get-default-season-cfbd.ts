import { getCalendarFromCfbd } from '../cfbd-rest-client';

export const getDefaultSeasonFromCfbd = async (): Promise<number> => {
  try {
    const currentYear = new Date().getFullYear();
    const now = new Date();

    // Check current year's calendar
    const currentYearCalendar = await getCalendarFromCfbd(currentYear);
    
    if (currentYearCalendar && currentYearCalendar.length > 0) {
      // Check if we're in the current year's season
      for (const week of currentYearCalendar) {
        const firstGameStart = new Date(week.startDate);
        const lastGameStart = new Date(week.endDate);

        if (now >= firstGameStart && now <= lastGameStart) {
          return currentYear;
        }
      }
    }

    // Check previous year's calendar (for early season games that might span years)
    const previousYear = currentYear - 1;
    const previousYearCalendar = await getCalendarFromCfbd(previousYear);
    
    if (previousYearCalendar && previousYearCalendar.length > 0) {
      for (const week of previousYearCalendar) {
        const firstGameStart = new Date(week.startDate);
        const lastGameStart = new Date(week.endDate);

        if (now >= firstGameStart && now <= lastGameStart) {
          return previousYear;
        }
      }
    }

    // If we're not in any active season, check which season is most recent
    // If we're before the current year's season starts, use previous year
    if (currentYearCalendar && currentYearCalendar.length > 0) {
      const firstWeek = currentYearCalendar[0];
      const firstGameStart = new Date(firstWeek.startDate);
      
      if (now < firstGameStart) {
        // We're before the current season starts, use previous year
        return previousYear;
      }
    }

    // Default to current year
    return currentYear;
  } catch {
    // Fallback to current year on error
    return new Date().getFullYear();
  }
};

