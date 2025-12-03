import { createESPNClient } from '../espn-client';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';

export const getDefaultSeasonFromESPN = async (
  sport: SportSlug,
  conf: ConferenceSlug
): Promise<number> => {
  try {
    const { conferences, espnRoute } = sports[sport];
    const conferenceMeta = conferences[conf];
    if (!conferenceMeta) {
      return new Date().getFullYear();
    }

    const client = createESPNClient(espnRoute);
    const calendarResponse = await client.getScoreboard({
      groups: conferenceMeta.espnId,
    });

    const leagueData = calendarResponse.leagues?.[0];
    if (!leagueData?.season?.endDate) {
      return new Date().getFullYear();
    }

    const endDate = new Date(leagueData.season.endDate);
    const now = new Date();
    const seasonYear = leagueData.season.year;

    if (now <= endDate) {
      return seasonYear;
    } else {
      return seasonYear + 1;
    }
  } catch {
    return new Date().getFullYear();
  }
};

