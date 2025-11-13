/**
 * Mock ESPN Client
 *
 * Provides mocked ESPN API responses for testing without
 * making live API calls during test runs.
 */

import {
  ESPNTeamResponse,
  ESPNCoreRecordResponse,
  ESPNScoreboardResponse,
} from '@/lib/espn-client';
import { gamesFixture } from '../fixtures/games.fixture';
import { secTeamsFixture } from '../fixtures/teams.fixture';

export const mockEspnClient = {
  /**
   * Mock getTeam - returns team metadata
   */
  getTeam: jest.fn((abbrev: string): Promise<ESPNTeamResponse> => {
    const team = secTeamsFixture.find((t) => t.abbrev === abbrev);
    if (!team) {
      throw new Error(`Team not found: ${abbrev}`);
    }

    return Promise.resolve({
      team: {
        id: team.id,
        name: team.displayName,
        abbreviation: abbrev,
        displayName: team.displayName,
        logos: [
          {
            href: team.logo,
            width: 500,
            height: 500,
          },
        ],
        color: team.color,
        alternateColor: team.alternateColor,
        rank: Math.floor(Math.random() * 16) + 1,
        standingSummary: `${Math.floor(Math.random() * 12)}-${Math.floor(Math.random() * 4)}`,
        groups: {
          parent: {
            id: '8',
          },
        },
        record: {
          items: [
            {
              summary: `${Math.floor(Math.random() * 12)}-${Math.floor(Math.random() * 4)}`,
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
  getTeamRecords: jest.fn((_teamId: string): Promise<ESPNCoreRecordResponse> => {
    return Promise.resolve({
      items: [
        {
          id: '1',
          name: 'total',
          type: 'total',
          summary: `${Math.floor(Math.random() * 12)}-${Math.floor(Math.random() * 4)}`,
          displayValue: `${Math.floor(Math.random() * 12)}-${Math.floor(Math.random() * 4)}`,
          stats: [
            {
              name: 'wins',
              type: 'wins',
              value: Math.floor(Math.random() * 12),
              displayValue: String(Math.floor(Math.random() * 12)),
            },
            {
              name: 'losses',
              type: 'losses',
              value: Math.floor(Math.random() * 4),
              displayValue: String(Math.floor(Math.random() * 4)),
            },
            {
              name: 'winPercent',
              type: 'winPercent',
              value: Math.random(),
              displayValue: String(Math.random().toFixed(3)),
            },
            {
              name: 'pointsFor',
              type: 'pointsFor',
              value: Math.floor(Math.random() * 500) + 200,
              displayValue: String(Math.floor(Math.random() * 500) + 200),
            },
            {
              name: 'pointsAgainst',
              type: 'pointsAgainst',
              value: Math.floor(Math.random() * 500) + 200,
              displayValue: String(Math.floor(Math.random() * 500) + 200),
            },
            {
              name: 'pointDifferential',
              type: 'pointDifferential',
              value: Math.floor(Math.random() * 200) - 100,
              displayValue: String(Math.floor(Math.random() * 200) - 100),
            },
            {
              name: 'avgPointsFor',
              type: 'avgPointsFor',
              value: Math.random() * 50 + 20,
              displayValue: String((Math.random() * 50 + 20).toFixed(2)),
            },
            {
              name: 'avgPointsAgainst',
              type: 'avgPointsAgainst',
              value: Math.random() * 50 + 20,
              displayValue: String((Math.random() * 50 + 20).toFixed(2)),
            },
          ],
        },
        {
          id: '2',
          name: 'conference',
          type: 'vsconf',
          summary: `${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 6)}`,
          displayValue: `${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 6)}`,
          stats: [],
        },
        {
          id: '3',
          name: 'home',
          type: 'homerecord',
          summary: `${Math.floor(Math.random() * 7)}-${Math.floor(Math.random() * 2)}`,
          displayValue: `${Math.floor(Math.random() * 7)}-${Math.floor(Math.random() * 2)}`,
          stats: [],
        },
        {
          id: '4',
          name: 'away',
          type: 'awayrecord',
          summary: `${Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 3)}`,
          displayValue: `${Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 3)}`,
          stats: [],
        },
      ],
    });
  }),

  /**
   * Mock getSchedule - returns games
   */
  getSchedule: jest.fn(
    (options: {
      season?: number;
      week?: number;
      groups?: number;
    }): Promise<ESPNScoreboardResponse> => {
      const { season, week, groups } = options;
      // Default to SEC (8) if no conference specified, but allow any conference for flexibility
      const conferenceId = groups?.toString() || '8';
      let games = [...gamesFixture];

      if (season) {
        games = games.filter((g) => g.season === season);
      }
      if (week) {
        games = games.filter((g) => g.week === week);
      }

      const currentSeason = season || games[0]?.season || 2025;
      const currentWeek = week || games[0]?.week || 1;

      return Promise.resolve({
        events: games.map((g) => ({
          id: g.espnId,
          competitions: [
            {
              id: g.espnId,
              date: g.date,
              conferenceCompetition: true,
              neutralSite: false,
              competitors: [
                {
                  homeAway: 'home' as const,
                  team: {
                    id: g.home.teamEspnId,
                    abbreviation: g.home.abbrev,
                    displayName: g.home.displayName || g.home.abbrev,
                    logo: (g.home as { logo?: string }).logo || '',
                    color: (g.home as { color?: string }).color || '000000',
                    conferenceId,
                  },
                  score: g.home.score?.toString() || '0',
                  records: [],
                },
                {
                  homeAway: 'away' as const,
                  team: {
                    id: g.away.teamEspnId,
                    abbreviation: g.away.abbrev,
                    displayName: g.away.displayName || g.away.abbrev,
                    logo: (g.away as { logo?: string }).logo || '',
                    color: (g.away as { color?: string }).color || '000000',
                    conferenceId,
                  },
                  score: g.away.score?.toString() || '0',
                  records: [],
                },
              ],
              status: {
                type: {
                  state: (g.status === 'final' ? 'post' : g.status === 'in' ? 'in' : 'pre') as
                    | 'pre'
                    | 'in'
                    | 'post',
                  completed: g.status === 'final',
                },
              },
              week: {
                number: g.week || currentWeek,
              },
              season: {
                year: g.season || currentSeason,
              },
              odds: g.odds
                ? [
                    {
                      details: g.odds.spread?.displayName || '',
                      spread: g.odds.spread?.value || 0,
                      overUnder: g.odds.overUnder || 0,
                      awayTeamOdds: {
                        favorite: (g.odds.spread?.value || 0) < 0,
                      },
                      homeTeamOdds: {
                        favorite: (g.odds.spread?.value || 0) > 0,
                      },
                    },
                  ]
                : undefined,
              groups: {
                id: conferenceId,
              },
            },
          ],
        })),
        season: {
          year: currentSeason,
        },
        week: {
          number: currentWeek,
        },
      });
    }
  ),

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
