/**
 * Data reshaping functions for ESPN API responses
 * Transform raw ESPN data into our desired format
 */

import type { EspnScoreboardGenerated } from './espn/espn-scoreboard-generated';
import { ReshapedGame, ReshapeResult } from './types';
import cityTimezones from 'city-timezones';

/**
 * Reshape ESPN scoreboard response for our needs
 */
export const reshapeScoreboardData = (
  espnResponse: EspnScoreboardGenerated,
  sport: string = 'football',
  league: string = 'college-football'
): ReshapeResult<ReshapedGame> => {
  if (!espnResponse.events || espnResponse.events.length === 0) {
    return { games: [] };
  }

  const reshapedGames = espnResponse.events
    .map((event) => {
      const competition = event.competitions[0];
      if (!competition) {
        return null;
      }

      const competitors = competition.competitors;
      if (!competitors || competitors.length !== 2) {
        return null;
      }

      // Use ESPN's homeAway field instead of assuming array positions
      const homeTeam = competitors.find((c) => c.homeAway === 'home');
      const awayTeam = competitors.find((c) => c.homeAway === 'away');

      if (!homeTeam || !awayTeam) {
        return null;
      }

      // Parse scores
      const awayScore = awayTeam.score ? parseInt(awayTeam.score, 10) : null;
      const homeScore = homeTeam.score ? parseInt(homeTeam.score, 10) : null;

      // Parse rankings (99 = unranked)
      const awayRank =
        awayTeam.curatedRank?.current === 99 ? null : awayTeam.curatedRank?.current || null;
      const homeRank =
        homeTeam.curatedRank?.current === 99 ? null : homeTeam.curatedRank?.current || null;

      // Parse odds - explicitly handle null vs undefined
      let favoriteTeamEspnId: string | null = null;
      let spread: number | null = null;
      let overUnder: number | null = null;

      if (competition.odds && competition.odds.length > 0) {
        const odds = competition.odds[0];

        // Explicitly set to null if ESPN has the field but no value
        overUnder = odds.overUnder ?? null;
        spread = odds.spread ?? null;

        // Use ESPN's favorite boolean fields
        if (odds.awayTeamOdds?.favorite === true) {
          favoriteTeamEspnId = awayTeam.team.id;
        } else if (odds.homeTeamOdds?.favorite === true) {
          favoriteTeamEspnId = homeTeam.team.id;
        }
      } else {
        // ESPN doesn't have odds for this game - explicitly set to null
        favoriteTeamEspnId = null;
        spread = null;
        overUnder = null;
      }

      // Look up timezone from city and state
      const venueCity = competition.venue.address?.city || '';
      const venueState = competition.venue.address?.state || '';
      let timezone = 'America/New_York'; // Default to ET

      if (venueCity && venueState) {
        // city-timezones expects "City State" format (e.g., "Springfield MO")
        const cityStateQuery = `${venueCity} ${venueState}`;
        const matches = cityTimezones.findFromCityStateProvince(cityStateQuery);
        if (matches && matches.length > 0) {
          // Find the match that matches the state (to avoid picking wrong country)
          // First try to find a US match with matching state
          const usMatch = matches.find(
            (match) =>
              match.country === 'United States of America' &&
              (match.state_ansi === venueState || match.province === venueState)
          );
          if (usMatch) {
            timezone = usMatch.timezone;
          } else {
            // Fall back to first match if no state match found
            timezone = matches[0].timezone;
          }
        }
      }

      // Our reshaped format
      // Use startDate if available (local time), otherwise fall back to date (UTC)
      return {
        espnId: event.id,
        displayName: `${awayTeam.team.abbreviation} @ ${homeTeam.team.abbreviation}`,
        date: competition.startDate || competition.date,
        attendance: competition.attendance,
        week: event.week?.number || espnResponse.week?.number || null,
        season: event.season?.year || espnResponse.season?.year || new Date().getFullYear(),
        sport,
        league,
        state: competition.status.type.state,
        completed: competition.status.type.completed,
        conferenceGame: competition.conferenceCompetition || false,
        neutralSite: competition.neutralSite || false,
        venue: {
          fullName: competition.venue.fullName || '',
          city: venueCity,
          state: venueState,
          timezone,
        },
        home: {
          teamEspnId: homeTeam.team.id,
          abbrev: homeTeam.team.abbreviation,
          displayName: homeTeam.team.displayName,
          score: homeScore,
          rank: homeRank,
          logo: homeTeam.team.logo,
          color: homeTeam.team.color || '',
        },
        away: {
          teamEspnId: awayTeam.team.id,
          abbrev: awayTeam.team.abbreviation,
          displayName: awayTeam.team.displayName,
          score: awayScore,
          rank: awayRank,
          logo: awayTeam.team.logo,
          color: awayTeam.team.color || '',
        },
        odds: {
          favoriteTeamEspnId,
          spread,
          overUnder,
        },
        lastUpdated: new Date(),
      };
    })
    .filter((game) => game !== null);

  return { games: reshapedGames };
};
