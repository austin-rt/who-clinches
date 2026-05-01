import {
  getGamesFromCfbd,
  getTeamsFromCfbd,
  getLinesFromCfbd,
  getCalendarFromCfbd,
  getTeamStatsFromCfbd,
  getRankingsFromCfbd,
  getSpFromCfbd,
  getFpiFromCfbd,
  getUserInfoFromCfbd,
} from './cfbd-rest-client';
import { cfbdGraphQLClient } from './cfbd-graphql-client';
import { isInSeasonFromCfbd } from './helpers/season-check-cfbd';
import { logError } from '../errorLogger';
import type {
  Game,
  BettingGame,
  Team,
  UserInfo,
  TeamStat,
  PollWeek,
  TeamSP,
  TeamFPI,
} from 'cfbd';

const allowGraphQL = (): boolean => {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
};

export class CFBDClient {
  isInSeason(): Promise<boolean> {
    return isInSeasonFromCfbd();
  }

  async getGames(params: {
    year?: number;
    week?: number;
    seasonType?: string;
    team?: string;
    conference?: string;
    id?: number;
  }): Promise<Array<Game & { spread?: number; overUnder?: number; favoriteId?: number }>> {
    const inSeason = await this.isInSeason();

    if (inSeason && allowGraphQL()) {
      try {
        const result = await cfbdGraphQLClient.getGameAggregate({
          season: params.year,
          week: params.week,
          conference: params.conference,
        });
        void getUserInfoFromCfbd();
        return result.gameAggregate.nodes.map((node) => ({
          id: node.id,
          season: node.season,
          week: node.week,
          seasonType: node.seasonType as Game['seasonType'],
          startDate: node.startDate,
          startTimeTBD: false,
          completed: node.completed,
          neutralSite: node.neutralSite,
          conferenceGame: node.conferenceGame,
          attendance: null,
          venueId: null,
          venue: node.venue ?? null,
          homeId: node.homeId,
          homeTeam: node.homeTeam,
          homeConference: null,
          homeClassification: null,
          homePoints: node.homePoints ?? null,
          homeLineScores: null,
          homePostgameWinProbability: null,
          homePregameElo: null,
          homePostgameElo: null,
          awayId: node.awayId,
          awayTeam: node.awayTeam,
          awayConference: null,
          awayClassification: null,
          awayPoints: node.awayPoints ?? null,
          awayLineScores: null,
          awayPostgameWinProbability: null,
          awayPregameElo: null,
          awayPostgameElo: null,
          excitementIndex: null,
          highlights: null,
          notes: null,
          spread: node.spread,
          overUnder: node.overUnder,
          favoriteId: node.favoriteId,
        }));
      } catch (error) {
        await logError(
          error,
          {
            action: 'get-games-graphql-fallback',
            params,
          },
          false
        );
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
            favoriteId:
              spread !== null && spread !== undefined
                ? spread < 0
                  ? game.homeId
                  : spread > 0
                    ? game.awayId
                    : undefined
                : undefined,
          };
        }
        return game;
      });
    } catch (error) {
      await logError(
        error,
        {
          action: 'enrich-games-with-lines',
          params,
        },
        false
      );
      return games;
    }
  }

  async getTeams(params?: { conference?: string; classification?: string }): Promise<Team[]> {
    const inSeason = await this.isInSeason();

    if (inSeason && allowGraphQL()) {
      try {
        const result = await cfbdGraphQLClient.getCurrentTeams({
          conference: params?.conference,
        });
        void getUserInfoFromCfbd();
        return result.currentTeams.nodes.map((node) => ({
          id: node.id,
          school: node.school,
          mascot: null,
          abbreviation: node.abbreviation ?? null,
          alternateNames: null,
          conference: node.conference ?? null,
          division: null,
          classification: null,
          color: node.color ?? null,
          alternateColor: node.altColor ?? null,
          logos: node.logos ?? null,
          twitter: null,
          location: null,
        }));
      } catch (error) {
        await logError(
          error,
          {
            action: 'get-teams-graphql-fallback',
            params,
          },
          false
        );
        return getTeamsFromCfbd(params);
      }
    }

    return getTeamsFromCfbd(params);
  }

  getCalendar(year?: number) {
    if (!year) {
      year = new Date().getFullYear();
    }
    return getCalendarFromCfbd(year);
  }

  /**
   * Get team stats for all teams or filtered by conference/team.
   *
   * @param params.year - Required: Season year
   * @param params.conference - Optional: Filter by conference (e.g., 'SEC', 'B1G')
   * @param params.team - Optional: Filter by specific team
   * @param params.startWeek - Optional: Start week filter
   * @param params.endWeek - Optional: End week filter
   *
   * @example
   * // Get stats for ALL teams in one call
   * const allStats = await cfbdClient.getTeamStats({ year: 2025 });
   *
   * @example
   * // Get stats for one conference
   * const secStats = await cfbdClient.getTeamStats({ year: 2025, conference: 'SEC' });
   */
  getTeamStats(params: {
    year: number;
    conference?: string;
    team?: string;
    startWeek?: number;
    endWeek?: number;
  }): Promise<TeamStat[]> {
    return getTeamStatsFromCfbd(params);
  }

  getRemainingCalls(forceRefresh = false): Promise<UserInfo | null> {
    return getUserInfoFromCfbd(forceRefresh);
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
