import {
  getGamesFromCfbd,
  getTeamsFromCfbd,
  getLinesFromCfbd,
  getRankingsFromCfbd,
  getSpFromCfbd,
  getFpiFromCfbd,
  getUserInfoFromCfbd,
} from './cfbd-rest-client';
import { cfbdGraphQLClient } from './cfbd-graphql-client';
import { mapGqlGameToCfbdGame, mapGqlTeamToCfbdTeam } from './graphql/map-to-cfbd';
import { isInSeasonFromCfbd } from './helpers/season-check-cfbd';
import { logError } from '../errorLogger';
import { graphqlQueriesEnabled } from './helpers/graphql-flags';
import type { Game, BettingGame, Team, PollWeek, TeamSP, TeamFPI } from 'cfbd';

export class CFBDClient {
  async getGames(params: {
    year?: number;
    week?: number;
    seasonType?: string;
    team?: string;
    conference?: string;
    id?: number;
  }): Promise<Array<Game & { spread?: number; overUnder?: number; favoriteId?: number }>> {
    const inSeason = await isInSeasonFromCfbd();

    if (inSeason && (await graphqlQueriesEnabled())) {
      try {
        const nodes = await cfbdGraphQLClient.getConferenceGames({
          season: params.year ?? new Date().getFullYear(),
          conference: params.conference,
          week: params.week,
          seasonType: params.seasonType,
        });
        void getUserInfoFromCfbd();
        return nodes.map(mapGqlGameToCfbdGame);
      } catch (error) {
        await logError(error, {
          action: 'get-games-graphql-fallback',
          params,
        });
        const games = await getGamesFromCfbd(params);
        return this.enrichGamesWithLines(games, params);
      }
    }

    const games = await getGamesFromCfbd(params);
    return this.enrichGamesWithLines(games, params);
  }

  private async enrichGamesWithLines(
    games: Game[],
    params: {
      year?: number;
      week?: number;
      seasonType?: string;
      team?: string;
      conference?: string;
    }
  ): Promise<Array<Game & { spread?: number; overUnder?: number; favoriteId?: number }>> {
    try {
      const bettingGames = await getLinesFromCfbd({
        year: params.year,
        week: params.week,
        seasonType: params.seasonType,
        team: params.team,
        conference: params.conference,
      });

      const bettingGamesMap = new Map<number, BettingGame>();
      for (const bettingGame of bettingGames) {
        bettingGamesMap.set(bettingGame.id, bettingGame);
      }

      return games.map((game) => {
        const bettingGame = bettingGamesMap.get(game.id);
        if (bettingGame && bettingGame.lines.length > 0) {
          const line = bettingGame.lines[0];
          const spread = line.spread;
          return {
            ...game,
            spread: spread ?? undefined,
            overUnder: line.overUnder ?? undefined,
            favoriteId: (() => {
              if (spread === null || spread === undefined) return undefined;
              if (spread < 0) return game.homeId;
              if (spread > 0) return game.awayId;
              return undefined;
            })(),
          };
        }
        return game;
      });
    } catch (error) {
      await logError(error, {
        action: 'enrich-games-with-lines',
        params,
      });
      return games;
    }
  }

  async getTeams(params?: { conference?: string; classification?: string }): Promise<Team[]> {
    const inSeason = await isInSeasonFromCfbd();

    if (inSeason && (await graphqlQueriesEnabled())) {
      try {
        const nodes = await cfbdGraphQLClient.getConferenceTeams(new Date().getFullYear(), {
          conference: params?.conference,
          classification: params?.classification,
        });
        void getUserInfoFromCfbd();
        return nodes.map(mapGqlTeamToCfbdTeam);
      } catch (error) {
        await logError(error, {
          action: 'get-teams-graphql-fallback',
          params,
        });
        return getTeamsFromCfbd(params);
      }
    }

    return getTeamsFromCfbd(params);
  }

  /**
   * Get CFP rankings for a season.
   *
   * @param params.year - Required: Season year
   * @param params.week - Optional: Week number (null/undefined for latest)
   * @param params.seasonType - Optional: Season type filter
   *
   * @example
   * const rankings = await cfbdClient.getRankings({ year: 2025 });
   */
  getRankings(params: { year: number; week?: number; seasonType?: string }): Promise<PollWeek[]> {
    return getRankingsFromCfbd(params);
  }

  /**
   * Get SP+ ratings for teams.
   *
   * @param params.year - Required: Season year
   * @param params.team - Optional: Filter by specific team
   *
   * @example
   * const spRatings = await cfbdClient.getSp({ year: 2025 });
   */
  getSp(params: { year: number; team?: string }): Promise<TeamSP[]> {
    return getSpFromCfbd(params);
  }

  /**
   * Get FPI ratings (includes ESPN's SOR in resumeRanks.strengthOfRecord).
   *
   * @param params.year - Required: Season year
   * @param params.team - Optional: Filter by specific team
   *
   * @example
   * const fpiRatings = await cfbdClient.getFpi({ year: 2025 });
   */
  getFpi(params: { year: number; team?: string }): Promise<TeamFPI[]> {
    return getFpiFromCfbd(params);
  }
}

export const cfbdClient = new CFBDClient();
