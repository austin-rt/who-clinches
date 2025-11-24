import { createESPNClient } from '../espn-client';
import { isInSeason } from './season-check';
import { CONFERENCE_METADATA, type ConferenceSlug } from '../constants';

/**
 * Check if we're currently in season for a given sport using ESPN calendar data
 * Falls back to hardcoded dates if ESPN calendar is unavailable
 *
 * @param sport - Sport slug (e.g., 'cfb')
 * @param league - League slug (e.g., 'college-football')
 * @param conf - Conference slug (e.g., 'sec')
 * @param season - Season year (e.g., 2025)
 * @returns true if current date is within the ESPN calendar's season dates, false otherwise
 */
export const isInSeasonFromESPN = async (
  sport: string,
  league: string,
  conf: ConferenceSlug,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  season: number
): Promise<boolean> => {
  try {
    // Convert conference slug to ESPN conference ID
    const conferenceId = CONFERENCE_METADATA[conf].espnId;
    if (!conferenceId) {
      // Invalid conference, fallback to hardcoded dates
      return isInSeason(sport);
    }

    const client = createESPNClient(sport, league);

    // Fetch calendar from ESPN (without season parameter - ESPN only returns calendar dates without season)
    const calendarResponse = await client.getScoreboard({
      groups: conferenceId,
    });

    const leagueData = calendarResponse.leagues?.[0];
    if (!leagueData) {
      // No league data, fallback to hardcoded dates
      return isInSeason(sport);
    }

    // Use Regular Season calendar dates (more accurate than top-level calendarStartDate/calendarEndDate)
    const regularSeason = leagueData.calendar?.find((cal) => cal.label === 'Regular Season');

    if (!regularSeason?.startDate || !regularSeason?.endDate) {
      // No Regular Season dates, fallback to hardcoded dates
      return isInSeason(sport);
    }

    // Parse dates and check if current date is within Regular Season range
    const now = new Date();
    const start = new Date(regularSeason.startDate);
    const end = new Date(regularSeason.endDate);

    return now >= start && now <= end;
  } catch {
    // If ESPN calendar fetch fails, fallback to hardcoded dates
    return isInSeason(sport);
  }
};

