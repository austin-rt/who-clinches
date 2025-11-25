import { createESPNClient } from '../espn-client';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';

export const isInSeasonFromESPN = async (
  sport: SportSlug,
  conf: ConferenceSlug
): Promise<boolean> => {
  try {
    const { conferences, espnRoute } = sports[sport];
    const conferenceMeta = conferences[conf];

    if (!conferenceMeta) {
      return true;
    }

    const client = createESPNClient(espnRoute);

    const calendarResponse = await client.getScoreboard({
      groups: conferenceMeta.espnId,
    });

    const leagueData = calendarResponse.leagues?.[0];
    if (!leagueData) {
      return true;
    }

    const regularSeason = leagueData.calendar?.find((cal) => cal.label === 'Regular Season');

    if (!regularSeason?.startDate || !regularSeason?.endDate) {
      return true;
    }

    const now = new Date();
    const start = new Date(regularSeason.startDate);
    const end = new Date(regularSeason.endDate);

    return now >= start && now <= end;
  } catch {
    return true;
  }
};
