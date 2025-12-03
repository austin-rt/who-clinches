import type { EspnScoreboardGenerated } from './espn/espn-scoreboard-generated';
import { ReshapedGame, ReshapeResult, TeamLean } from './types';
import cityTimezones from 'city-timezones';
import {
  calculatePredictedScoreFromOdds,
  getDefaultPredictedScore,
} from './cfb/helpers/prefill-helpers';
import { GAME_TYPE_MAP } from '@/lib/constants/game-types';

export const reshapeScoreboardData = (
  espnResponse: EspnScoreboardGenerated,
  espnRoute: string = 'football/college-football',
  season?: number,
  teamMap?: Map<string, TeamLean>
): ReshapeResult<ReshapedGame> => {
  const [sport, league] = espnRoute.split('/');
  if (!espnResponse.events || espnResponse.events.length === 0) {
    return { games: [], teams: [] };
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

      const homeTeam = competitors.find((c) => c.homeAway === 'home');
      const awayTeam = competitors.find((c) => c.homeAway === 'away');

      if (!homeTeam || !awayTeam) {
        return null;
      }

      const awayScore = awayTeam.score ? parseInt(awayTeam.score, 10) : null;
      const homeScore = homeTeam.score ? parseInt(homeTeam.score, 10) : null;

      const awayRank =
        awayTeam.curatedRank?.current === 99 ? null : awayTeam.curatedRank?.current || null;
      const homeRank =
        homeTeam.curatedRank?.current === 99 ? null : homeTeam.curatedRank?.current || null;

      let favoriteTeamEspnId: string | null = null;
      let spread: number | null = null;
      let overUnder: number | null = null;

      if (competition.odds && competition.odds.length > 0) {
        const odds = competition.odds[0];

        overUnder = odds.overUnder ?? null;
        spread = odds.spread ?? null;

        if (odds.awayTeamOdds?.favorite === true) {
          favoriteTeamEspnId = awayTeam.team.id;
        } else if (odds.homeTeamOdds?.favorite === true) {
          favoriteTeamEspnId = homeTeam.team.id;
        }
      } else {
        favoriteTeamEspnId = null;
        spread = null;
        overUnder = null;
      }

      const venueCity = competition.venue.address?.city ?? '';
      const venueState = competition.venue.address?.state ?? '';
      let timezone = 'America/New_York';

      if (venueCity && venueState) {
        const cityStateQuery = `${venueCity} ${venueState}`;
        const matches = cityTimezones.findFromCityStateProvince(cityStateQuery);
        if (matches && matches.length > 0) {
          const usMatch = matches.find(
            (match) =>
              match.country === 'United States of America' &&
              (match.state_ansi === venueState || match.province === venueState)
          );
          if (usMatch) {
            timezone = usMatch.timezone;
          } else {
            timezone = matches[0].timezone;
          }
        }
      }

      if (timezone === 'America/New_York' && venueState && venueCity) {
        const stateNameMap: Record<string, string> = {
          AL: 'Alabama',
          AR: 'Arkansas',
          LA: 'Louisiana',
          MS: 'Mississippi',
          MO: 'Missouri',
          TN: 'Tennessee',
          TX: 'Texas',
          FL: 'Florida',
          GA: 'Georgia',
          KY: 'Kentucky',
          SC: 'South Carolina',
        };
        const stateName = stateNameMap[venueState] || venueState;
        const stateMatches = cityTimezones.findFromCityStateProvince(stateName);
        if (stateMatches && stateMatches.length > 0) {
          const usStateMatches = stateMatches.filter(
            (match) =>
              match.country === 'United States of America' &&
              (match.state_ansi === venueState || match.province === stateName)
          );
          if (usStateMatches.length > 0) {
            const cityLower = venueCity.toLowerCase();
            const cityMatch = usStateMatches.find(
              (match) =>
                match.city.toLowerCase().includes(cityLower) ||
                cityLower.includes(match.city.toLowerCase())
            );
            if (cityMatch) {
              timezone = cityMatch.timezone;
            } else {
              const timezoneCounts = new Map<string, number>();
              usStateMatches.forEach((match) => {
                timezoneCounts.set(match.timezone, (timezoneCounts.get(match.timezone) || 0) + 1);
              });
              const mostCommonTimezone = Array.from(timezoneCounts.entries()).sort(
                (a, b) => b[1] - a[1]
              )[0]?.[0];
              timezone = mostCommonTimezone || usStateMatches[0].timezone;
            }
          }
        }
      }

      const gameTypeNumber = event.season?.type;
      const gameType = gameTypeNumber ? GAME_TYPE_MAP[gameTypeNumber] : undefined;

      return {
        espnId: event.id,
        displayName: `${awayTeam.team.abbreviation} @ ${homeTeam.team.abbreviation}`,
        date: competition.startDate || competition.date,
        attendance: competition.attendance,
        week: event.week?.number || espnResponse.week?.number || null,
        season:
          season || event.season?.year || espnResponse.season?.year || new Date().getFullYear(),
        sport,
        league,
        state: competition.status.type.state,
        completed: competition.status.type.completed,
        conferenceGame: competition.conferenceCompetition || false,
        neutralSite: competition.neutralSite || false,
        venue: {
          fullName: competition.venue.fullName,
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
          color: homeTeam.team.color,
          shortDisplayName:
            teamMap?.get(homeTeam.team.id)?.shortDisplayName ?? homeTeam.team.shortDisplayName,
          alternateColor:
            teamMap?.get(homeTeam.team.id)?.alternateColor ?? homeTeam.team.alternateColor,
        },
        away: {
          teamEspnId: awayTeam.team.id,
          abbrev: awayTeam.team.abbreviation,
          displayName: awayTeam.team.displayName,
          score: awayScore,
          rank: awayRank,
          logo: awayTeam.team.logo,
          color: awayTeam.team.color,
          shortDisplayName:
            teamMap?.get(awayTeam.team.id)?.shortDisplayName ?? awayTeam.team.shortDisplayName,
          alternateColor:
            teamMap?.get(awayTeam.team.id)?.alternateColor ?? awayTeam.team.alternateColor,
        },
        odds: {
          favoriteTeamEspnId,
          spread,
          overUnder,
        },
        predictedScore: (() => {
          if (homeScore !== null && awayScore !== null) {
            return { home: homeScore, away: awayScore };
          }
          const oddsScore = calculatePredictedScoreFromOdds(
            overUnder,
            spread,
            favoriteTeamEspnId,
            homeTeam.team.id
          );
          return oddsScore || getDefaultPredictedScore();
        })(),
        gameType,
      };
    })
    .filter((game) => game !== null);

  return { games: reshapedGames, teams: [] };
};
