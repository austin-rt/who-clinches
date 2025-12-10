import type { Game } from 'cfbd';
import { ReshapedGame, ReshapeResult, TeamLean } from './types';
import cityTimezones from 'city-timezones';
import {
  calculatePredictedScoreFromOdds,
  getDefaultPredictedScore,
} from './cfb/helpers/prefill-helpers';

const getGameState = (
  game: Game & { spread?: number; overUnder?: number; favoriteId?: number }
): 'pre' | 'in' | 'post' => {
  if (game.completed) {
    return 'post';
  }
  const gameDate = new Date(game.startDate);
  const now = new Date();
  if (now >= gameDate) {
    return 'in';
  }
  return 'pre';
};

const getGameType = (
  seasonType: Game['seasonType']
): { name: string; abbreviation: string } | undefined => {
  const typeMap: Record<string, { name: string; abbreviation: string }> = {
    regular: { name: 'Regular Season', abbreviation: 'reg' },
    postseason: { name: 'Postseason', abbreviation: 'post' },
    both: { name: 'Regular Season', abbreviation: 'reg' },
  };
  return typeMap[seasonType?.toLowerCase() ?? ''];
};

export const reshapeCfbdGames = (
  cfbdGames: Array<Game & { spread?: number; overUnder?: number; favoriteId?: number }>,
  teamMap?: Map<string, TeamLean>
): ReshapeResult<ReshapedGame> => {
  if (!cfbdGames || cfbdGames.length === 0) {
    return { games: [], teams: [] };
  }

  const reshapedGames = cfbdGames
    .map((game) => {
      const state = getGameState(game);
      const gameType = getGameType(game.seasonType);

      const homeTeam = teamMap?.get(String(game.homeId));
      const awayTeam = teamMap?.get(String(game.awayId));

      const venueCity = game.venue?.split(',')[0]?.trim() || '';
      const venueState = game.venue?.split(',')[1]?.trim() || '';
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

      let favoriteTeamId: string | null = null;
      const spread: number | null = game.spread ?? null;
      const overUnder: number | null = game.overUnder ?? null;

      if (game.favoriteId) {
        favoriteTeamId = String(game.favoriteId);
      } else if (spread !== null) {
        if (spread < 0) {
          favoriteTeamId = String(game.homeId);
        } else if (spread > 0) {
          favoriteTeamId = String(game.awayId);
        }
      }

      return {
        id: String(game.id),
        displayName: `${game.awayTeam} @ ${game.homeTeam}`,
        date: game.startDate,
        week: game.week ?? null,
        season: game.season,
        sport: 'football',
        league: 'college-football',
        state,
        completed: game.completed,
        conferenceGame: game.conferenceGame || false,
        neutralSite: game.neutralSite || false,
        venue: {
          fullName: game.venue || 'TBD',
          city: venueCity,
          state: venueState,
          timezone,
        },
        home: {
          teamId: String(game.homeId),
          abbrev: homeTeam?.abbreviation || game.homeTeam,
          displayName: homeTeam?.displayName || game.homeTeam,
          shortDisplayName: homeTeam?.shortDisplayName || game.homeTeam,
          logo: homeTeam?.logo || '',
          color: homeTeam?.color || '000000',
          alternateColor: homeTeam?.alternateColor || '000000',
          score: game.homePoints ?? null,
          rank: null,
          division: homeTeam?.division || null,
        },
        away: {
          teamId: String(game.awayId),
          abbrev: awayTeam?.abbreviation || game.awayTeam,
          displayName: awayTeam?.displayName || game.awayTeam,
          shortDisplayName: awayTeam?.shortDisplayName || game.awayTeam,
          logo: awayTeam?.logo || '',
          color: awayTeam?.color || '000000',
          alternateColor: awayTeam?.alternateColor || '000000',
          score: game.awayPoints ?? null,
          rank: null,
          division: awayTeam?.division || null,
        },
        odds: {
          favoriteTeamId,
          spread,
          overUnder,
        },
        predictedScore: (() => {
          if (
            game.homePoints !== null &&
            game.homePoints !== undefined &&
            game.awayPoints !== null &&
            game.awayPoints !== undefined
          ) {
            return { home: game.homePoints, away: game.awayPoints };
          }
          const oddsScore = calculatePredictedScoreFromOdds(
            overUnder,
            spread,
            favoriteTeamId,
            String(game.homeId)
          );
          return oddsScore || getDefaultPredictedScore();
        })(),
        gameType,
        notes: game.notes || null,
      };
    })
    .filter((game) => game !== null);

  return { games: reshapedGames, teams: [] };
};
