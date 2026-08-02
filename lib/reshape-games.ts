import type { Game } from 'cfbd';
import { ReshapedGame, ReshapeResult, TeamLean, GameType } from './types';
import cityTimezones from 'city-timezones';
import { GAME_TYPE } from './constants';
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

const getGameType = (seasonType: Game['seasonType']): GameType | undefined => {
  if (!seasonType) return undefined;
  return GAME_TYPE[seasonType];
};

export interface VenueRecord {
  name: string | null;
  city: string | null;
  state: string | null;
  timezone: string | null;
}

export const reshapeCfbdGames = (
  cfbdGames: Array<Game & { spread?: number; overUnder?: number; favoriteId?: number }>,
  teamMap?: Map<string, TeamLean>,
  venueMap?: Map<number, VenueRecord>
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

      const venueRecord = game.venueId ? venueMap?.get(game.venueId) : undefined;
      const venueName = venueRecord?.name || game.venue || 'TBD';
      const venueCity = venueRecord?.city || game.venue?.split(',')[0]?.trim() || '';
      const venueState = venueRecord?.state || game.venue?.split(',')[1]?.trim() || '';
      let timezone = venueRecord?.timezone || 'America/New_York';

      if (!venueRecord?.timezone && venueCity && venueState) {
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
        startTimeTBD: game.startTimeTBD ?? false,
        week: game.week ?? null,
        season: game.season,
        sport: 'football',
        league: 'college-football',
        state,
        completed: game.completed,
        conferenceGame: game.conferenceGame || false,
        neutralSite: game.neutralSite || false,
        venue: {
          fullName: venueName,
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
