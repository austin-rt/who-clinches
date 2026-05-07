import { reshapeCfbdGames } from '@/lib/reshape-games';
import type { Game } from 'cfbd';

jest.mock('@/lib/cfb/helpers/prefill-helpers', () => ({
  calculatePredictedScoreFromOdds: jest.fn().mockReturnValue({ home: 28, away: 21 }),
  getDefaultPredictedScore: jest.fn().mockReturnValue({ home: 24, away: 21 }),
}));

jest.mock('city-timezones', () => ({
  findFromCityStateProvince: jest.fn((query: string) => {
    if (query.includes('Atlanta')) {
      return [
        {
          country: 'United States of America',
          state_ansi: 'GA',
          province: 'GA',
          timezone: 'America/New_York',
        },
      ];
    }
    if (query.includes('London')) {
      return [{ country: 'United Kingdom', province: 'England', timezone: 'Europe/London' }];
    }
    return [];
  }),
}));

const baseGame = {
  id: 1,
  season: 2025,
  week: 1,
  seasonType: 'regular' as const,
  startDate: '2099-09-06T12:00:00Z',
  startTimeTBD: false,
  completed: false,
  conferenceGame: true,
  neutralSite: false,
  attendance: null,
  venueId: null,
  homeId: 100,
  homeTeam: 'Alabama',
  homeConference: null,
  homeClassification: null,
  homePoints: null,
  homeLineScores: null,
  homePostgameWinProbability: null,
  homePregameElo: null,
  homePostgameElo: null,
  awayId: 200,
  awayTeam: 'Auburn',
  awayConference: null,
  awayClassification: null,
  awayPoints: null,
  awayLineScores: null,
  awayPostgameWinProbability: null,
  awayPregameElo: null,
  awayPostgameElo: null,
  excitementIndex: null,
  highlights: null,
  notes: null,
  venue: 'Atlanta, GA' as string | null,
} satisfies Game & { spread?: number; overUnder?: number; favoriteId?: number };

describe('reshapeCfbdGames', () => {
  it('returns empty result for null or empty input', () => {
    expect(reshapeCfbdGames([])).toEqual({ games: [], teams: [] });
    expect(reshapeCfbdGames(null as unknown as Game[])).toEqual({ games: [], teams: [] });
  });

  it('completed game has state "post"', () => {
    const game = { ...baseGame, completed: true, homePoints: 28, awayPoints: 14 };
    const { games } = reshapeCfbdGames([game]);
    expect(games[0].state).toBe('post');
  });

  it('future game has state "pre"', () => {
    const game = { ...baseGame, startDate: '2099-12-01T12:00:00Z' };
    const { games } = reshapeCfbdGames([game]);
    expect(games[0].state).toBe('pre');
  });

  it('past-start, not-completed game has state "in"', () => {
    const game = { ...baseGame, startDate: '2000-01-01T12:00:00Z', completed: false };
    const { games } = reshapeCfbdGames([game]);
    expect(games[0].state).toBe('in');
  });

  it('prioritizes US timezone match over foreign match', () => {
    const game = { ...baseGame, venue: 'Atlanta, GA' };
    const { games } = reshapeCfbdGames([game]);
    expect(games[0].venue.timezone).toBe('America/New_York');
  });

  it('uses first timezone match when no US match', () => {
    const game = { ...baseGame, venue: 'London, UK' };
    const { games } = reshapeCfbdGames([game]);
    expect(games[0].venue.timezone).toBe('Europe/London');
  });

  it('defaults to America/New_York when no city/state', () => {
    const game = { ...baseGame, venue: null };
    const { games } = reshapeCfbdGames([game]);
    expect(games[0].venue.timezone).toBe('America/New_York');
  });

  it('uses explicit favoriteId when provided', () => {
    const game = { ...baseGame, favoriteId: 200, spread: -3 };
    const { games } = reshapeCfbdGames([game]);
    expect(games[0].odds.favoriteTeamId).toBe('200');
  });

  it('infers favoriteTeamId from spread direction', () => {
    const homeGame = { ...baseGame, spread: -3 };
    const awayGame = { ...baseGame, spread: 3 };

    const { games: homeResult } = reshapeCfbdGames([homeGame]);
    expect(homeResult[0].odds.favoriteTeamId).toBe('100');

    const { games: awayResult } = reshapeCfbdGames([awayGame]);
    expect(awayResult[0].odds.favoriteTeamId).toBe('200');
  });
});
