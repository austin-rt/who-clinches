/**
 * Mock ESPN Client
 *
 * Provides mocked ESPN API responses for testing without
 * making live API calls during test runs.
 */

import { gamesFixture } from '../fixtures/games.fixture';
import { secTeamsFixture } from '../fixtures/teams.fixture';

export const mockEspnClient = {
  /**
   * Mock getTeam - returns team metadata
   */
  getTeam: jest.fn((abbrev: string) => {
    const team = secTeamsFixture.find(t => t.abbrev === abbrev);
    if (!team) {
      throw new Error(`Team not found: ${abbrev}`);
    }

    return Promise.resolve({
      team: {
        id: team.id,
        abbreviation: abbrev,
        displayName: team.displayName,
        logo: team.logo,
        color: team.color,
        alternateColor: team.alternateColor,
        rank: Math.floor(Math.random() * 16) + 1,
        standingSummary: `${Math.floor(Math.random() * 12)}-${Math.floor(Math.random() * 4)}`,
        record: {
          items: [
            {
              summary: `${Math.floor(Math.random() * 12)}-${Math.floor(Math.random() * 4)}`,
              type: 'total',
              stats: [
                { name: 'wins', value: Math.floor(Math.random() * 12) },
                { name: 'losses', value: Math.floor(Math.random() * 4) },
                { name: 'winPercent', value: Math.random() },
              ],
            },
          ],
        },
      },
    });
  }),

  /**
   * Mock getTeamRecords - returns team statistics
   */
  getTeamRecords: jest.fn((teamId: string) => {
    return Promise.resolve({
      items: [
        {
          name: 'total',
          type: 'total',
          summary: `${Math.floor(Math.random() * 12)}-${Math.floor(Math.random() * 4)}`,
          stats: [
            { name: 'wins', value: Math.floor(Math.random() * 12) },
            { name: 'losses', value: Math.floor(Math.random() * 4) },
            { name: 'winPercent', value: Math.random() },
            { name: 'pointsFor', value: Math.floor(Math.random() * 500) + 200 },
            { name: 'pointsAgainst', value: Math.floor(Math.random() * 500) + 200 },
            { name: 'pointDifferential', value: Math.floor(Math.random() * 200) - 100 },
            { name: 'avgPointsFor', value: Math.random() * 50 + 20 },
            { name: 'avgPointsAgainst', value: Math.random() * 50 + 20 },
          ],
        },
        {
          name: 'conference',
          type: 'conference',
          summary: `${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 6)}`,
          stats: [],
        },
        {
          name: 'home',
          type: 'home',
          summary: `${Math.floor(Math.random() * 7)}-${Math.floor(Math.random() * 2)}`,
          stats: [],
        },
        {
          name: 'away',
          type: 'away',
          summary: `${Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 3)}`,
          stats: [],
        },
      ],
    });
  }),

  /**
   * Mock getSchedule - returns games
   */
  getSchedule: jest.fn((options: any) => {
    const { season, week, conferenceId } = options;
    let games = [...gamesFixture];

    if (season) {
      games = games.filter(g => g.season === season);
    }
    if (week) {
      games = games.filter(g => g.week === week);
    }

    return Promise.resolve({
      events: games.map(g => ({
        id: g.espnId,
        uid: `s:${g.season}~l:25~e:${g.espnId}`,
        date: g.date,
        name: g.displayName,
        shortName: g.displayName,
        status: {
          type: {
            name: g.status,
            state: g.status === 'final' ? 'post' : g.status === 'in' ? 'in' : 'pre',
          },
        },
        competitions: [
          {
            id: g.espnId,
            uid: `s:${g.season}~l:25~e:${g.espnId}`,
            date: g.date,
            attendance: g.status === 'final' ? Math.floor(Math.random() * 100000) + 50000 : null,
            competitors: [
              {
                id: g.home.teamEspnId,
                uid: `s:25~t:${g.home.teamEspnId}`,
                team: {
                  id: g.home.teamEspnId,
                  abbreviation: g.home.abbrev,
                  displayName: g.home.displayName,
                },
                homeAway: 'home',
                score: g.home.score?.toString(),
                curScore: g.home.score?.toString(),
              },
              {
                id: g.away.teamEspnId,
                uid: `s:25~t:${g.away.teamEspnId}`,
                team: {
                  id: g.away.teamEspnId,
                  abbreviation: g.away.abbrev,
                  displayName: g.away.displayName,
                },
                homeAway: 'away',
                score: g.away.score?.toString(),
                curScore: g.away.score?.toString(),
              },
            ],
            odds: g.odds ? [
              {
                provider: {
                  name: 'ESPN',
                },
                spread: {
                  displayName: g.odds.spread.displayName,
                  value: g.odds.spread.value,
                },
                overUnder: g.odds.overUnder,
              },
            ] : [],
            predictor: g.predictedScore ? {
              homeScore: g.predictedScore.home,
              awayScore: g.predictedScore.away,
            } : null,
          },
        ],
      })),
    });
  }),

  /**
   * Mock reset - clears all mock call history
   */
  reset: jest.fn(() => {
    mockEspnClient.getTeam.mockClear();
    mockEspnClient.getTeamRecords.mockClear();
    mockEspnClient.getSchedule.mockClear();
  }),
};

/**
 * Setup mock for tests
 * Use in jest.setup.js or beforeEach
 */
export const setupEspnMocks = () => {
  mockEspnClient.reset();
};
