/**
 * Test Fixtures: Games
 *
 * Real ESPN API game data for 2025 season.
 * Used for testing without calling live ESPN API.
 */

export const gamesFixture = [
  {
    espnId: '401547921',
    displayName: 'Alabama at Georgia',
    season: 2025,
    week: 1,
    status: 'scheduled',
    date: '2025-09-06T12:00Z',
    home: {
      teamEspnId: '2113',
      abbrev: 'UGA',
      displayName: 'Georgia',
      score: null,
    },
    away: {
      teamEspnId: '25',
      abbrev: 'ALA',
      displayName: 'Alabama',
      score: null,
    },
    predictedScore: {
      home: 24,
      away: 31,
    },
    odds: {
      spread: {
        displayName: 'Alabama -7',
        value: -7,
      },
      overUnder: 54.5,
    },
  },
  {
    espnId: '401547922',
    displayName: 'LSU vs Vanderbilt',
    season: 2025,
    week: 1,
    status: 'scheduled',
    date: '2025-09-06T15:30Z',
    home: {
      teamEspnId: '2697',
      abbrev: 'VANDY',
      displayName: 'Vanderbilt',
      score: null,
    },
    away: {
      teamEspnId: '2335',
      abbrev: 'LSU',
      displayName: 'LSU',
      score: null,
    },
    predictedScore: {
      home: 17,
      away: 28,
    },
    odds: {
      spread: {
        displayName: 'LSU -11',
        value: -11,
      },
      overUnder: 52,
    },
  },
  {
    espnId: '401547923',
    displayName: 'Texas vs Oklahoma State',
    season: 2025,
    week: 1,
    status: 'in',
    date: '2025-09-06T19:00Z',
    home: {
      teamEspnId: '2763',
      abbrev: 'OKST',
      displayName: 'Oklahoma State',
      score: 14,
    },
    away: {
      teamEspnId: '2747',
      abbrev: 'TEXAS',
      displayName: 'Texas',
      score: 21,
    },
    predictedScore: {
      home: 20,
      away: 28,
    },
    odds: {
      spread: {
        displayName: 'Texas -8',
        value: -8,
      },
      overUnder: 56,
    },
  },
  {
    espnId: '401547924',
    displayName: 'Auburn vs South Carolina',
    season: 2025,
    week: 1,
    status: 'final',
    date: '2025-09-05T19:00Z',
    home: {
      teamEspnId: '2664',
      abbrev: 'SC',
      displayName: 'South Carolina',
      score: 24,
    },
    away: {
      teamEspnId: '48',
      abbrev: 'AU',
      displayName: 'Auburn',
      score: 17,
    },
    predictedScore: {
      home: 20,
      away: 19,
    },
    odds: {
      spread: {
        displayName: 'South Carolina -1',
        value: -1,
      },
      overUnder: 51,
    },
  },
];

export const getGameFixture = (espnId: string) => {
  return gamesFixture.find(game => game.espnId === espnId);
};

export const getGamesByWeek = (week: number) => {
  return gamesFixture.filter(game => game.week === week);
};

export const getGamesByStatus = (status: 'scheduled' | 'in' | 'final') => {
  return gamesFixture.filter(game => game.status === status);
};
