import { SPORT_SEASON_DATES } from '../constants';

/**
 * Check if we're currently in season for a given sport
 * @param sport - Sport slug (e.g., 'cfb')
 * @returns true if current date is within the sport's season dates, false otherwise
 */
export const isInSeason = (sport: string): boolean => {
  const seasonDates = SPORT_SEASON_DATES[sport];
  if (!seasonDates) {
    // If sport not found, default to allowing (for backwards compatibility or new sports)
    return true;
  }

  const now = new Date();
  const year = now.getFullYear();
  const seasonStart = new Date(year, seasonDates.startMonth, seasonDates.startDay);
  const seasonEnd = new Date(year, seasonDates.endMonth, seasonDates.endDay);

  return now >= seasonStart && now <= seasonEnd;
};

