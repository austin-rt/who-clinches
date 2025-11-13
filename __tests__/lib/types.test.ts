/**
 * Unit Tests: Type Definitions
 *
 * Tests for type contracts and data structure integrity.
 * Verifies interfaces can be properly instantiated with valid data.
 */

import { ReshapedGame, TeamRecord, ReshapedTeam } from '@/lib/types';

describe('ReshapedGame Type', () => {
  it('can create valid completed game', () => {
    const game: ReshapedGame = {
      espnId: '123456',
      displayName: 'LSU @ ALA',
      date: '2025-09-06T12:00Z',
      week: 1,
      season: 2025,
      sport: 'football',
      league: 'college-football',
      state: 'post',
      completed: true,
      conferenceGame: true,
      neutralSite: false,
      home: {
        teamEspnId: '25',
        abbrev: 'ALA',
        displayName: 'Alabama',
        score: 28,
        rank: 5,
        logo: 'https://example.com/ala.png',
        color: 'ba0c2f',
      },
      away: {
        teamEspnId: '2335',
        abbrev: 'LSU',
        displayName: 'LSU',
        score: 24,
        rank: 10,
        logo: 'https://example.com/lsu.png',
        color: '4d1d4d',
      },
      odds: {
        favoriteTeamEspnId: '25',
        spread: -7,
        overUnder: 54.5,
      },
      lastUpdated: new Date(),
    };

    expect(game.espnId).toBe('123456');
    expect(game.home.score).toBe(28);
    expect(game.completed).toBe(true);
  });

  it('can create valid pre-game without scores', () => {
    const game: ReshapedGame = {
      espnId: '789012',
      displayName: 'TEX @ OU',
      date: '2025-09-13T15:30Z',
      week: 2,
      season: 2025,
      sport: 'football',
      league: 'college-football',
      state: 'pre',
      completed: false,
      conferenceGame: true,
      neutralSite: false,
      home: {
        teamEspnId: '2747',
        abbrev: 'OU',
        displayName: 'Oklahoma',
        score: null,
        rank: 8,
        logo: 'https://example.com/ou.png',
        color: 'cc0000',
      },
      away: {
        teamEspnId: '2747',
        abbrev: 'TEX',
        displayName: 'Texas',
        score: null,
        rank: 12,
        logo: 'https://example.com/tex.png',
        color: 'bf5700',
      },
      odds: {
        favoriteTeamEspnId: '2747',
        spread: -3.5,
        overUnder: 60.0,
      },
      lastUpdated: new Date(),
    };

    expect(game.home.score).toBeNull();
    expect(game.away.score).toBeNull();
    expect(game.completed).toBe(false);
  });

  it('can create game with unranked teams', () => {
    const game: ReshapedGame = {
      espnId: '345678',
      displayName: 'UGA @ VANDY',
      date: '2025-09-20T12:00Z',
      week: 3,
      season: 2025,
      sport: 'football',
      league: 'college-football',
      state: 'post',
      completed: true,
      conferenceGame: true,
      neutralSite: false,
      home: {
        teamEspnId: '2697',
        abbrev: 'VANDY',
        displayName: 'Vanderbilt',
        score: 17,
        rank: null,
        logo: 'https://example.com/vandy.png',
        color: '222222',
      },
      away: {
        teamEspnId: '2113',
        abbrev: 'UGA',
        displayName: 'Georgia',
        score: 24,
        rank: null,
        logo: 'https://example.com/uga.png',
        color: 'ba0021',
      },
      odds: {
        favoriteTeamEspnId: '2113',
        spread: -6,
        overUnder: 45,
      },
      lastUpdated: new Date(),
    };

    expect(game.home.rank).toBeNull();
    expect(game.away.rank).toBeNull();
  });

  it('can create game with optional predicted score', () => {
    const game: ReshapedGame = {
      espnId: '901234',
      displayName: 'AU @ ARK',
      date: '2025-10-04T14:00Z',
      week: 5,
      season: 2025,
      sport: 'football',
      league: 'college-football',
      state: 'pre',
      completed: false,
      conferenceGame: true,
      neutralSite: false,
      home: {
        teamEspnId: '2638',
        abbrev: 'ARK',
        displayName: 'Arkansas',
        score: null,
        rank: 15,
        logo: 'https://example.com/ark.png',
        color: 'a30d2d',
      },
      away: {
        teamEspnId: '48',
        abbrev: 'AU',
        displayName: 'Auburn',
        score: null,
        rank: 20,
        logo: 'https://example.com/au.png',
        color: 'ff6600',
      },
      odds: {
        favoriteTeamEspnId: '2638',
        spread: -3,
        overUnder: 48.5,
      },
      predictedScore: {
        home: 24,
        away: 21,
      },
      lastUpdated: new Date(),
    };

    expect(game.predictedScore).toBeDefined();
    expect(game.predictedScore?.home).toBe(24);
    expect(game.predictedScore?.away).toBe(21);
  });

  it('game state must be valid', () => {
    const validStates: Array<'pre' | 'in' | 'post'> = ['pre', 'in', 'post'];

    validStates.forEach((state) => {
      const game: ReshapedGame = {
        espnId: '111111',
        displayName: 'TEST @ TEST',
        date: '2025-01-01T00:00Z',
        week: 1,
        season: 2025,
        sport: 'football',
        league: 'college-football',
        state,
        completed: state === 'post',
        conferenceGame: true,
        neutralSite: false,
        home: {
          teamEspnId: '1',
          abbrev: 'H',
          displayName: 'Home',
          score: state === 'post' ? 28 : null,
          rank: null,
          logo: '',
          color: '',
        },
        away: {
          teamEspnId: '2',
          abbrev: 'A',
          displayName: 'Away',
          score: state === 'post' ? 24 : null,
          rank: null,
          logo: '',
          color: '',
        },
        odds: {
          favoriteTeamEspnId: null,
          spread: null,
          overUnder: null,
        },
        lastUpdated: new Date(),
      };

      expect(game.state).toBe(state);
    });
  });

  it('can create neutral site game', () => {
    const game: ReshapedGame = {
      espnId: '555555',
      displayName: 'TENN @ UK',
      date: '2025-11-29T15:30Z',
      week: 14,
      season: 2025,
      sport: 'football',
      league: 'college-football',
      state: 'post',
      completed: true,
      conferenceGame: true,
      neutralSite: true,
      home: {
        teamEspnId: '2429',
        abbrev: 'UK',
        displayName: 'Kentucky',
        score: 31,
        rank: null,
        logo: 'https://example.com/uk.png',
        color: '0033cc',
      },
      away: {
        teamEspnId: '2633',
        abbrev: 'TENN',
        displayName: 'Tennessee',
        score: 28,
        rank: 18,
        logo: 'https://example.com/tenn.png',
        color: 'ff6600',
      },
      odds: {
        favoriteTeamEspnId: null,
        spread: null,
        overUnder: null,
      },
      lastUpdated: new Date(),
    };

    expect(game.neutralSite).toBe(true);
  });

  it('lastUpdated is required and must be Date', () => {
    const game: ReshapedGame = {
      espnId: '666666',
      displayName: 'MISS @ MSST',
      date: '2025-11-27T19:00Z',
      week: 13,
      season: 2025,
      sport: 'football',
      league: 'college-football',
      state: 'post',
      completed: true,
      conferenceGame: true,
      neutralSite: false,
      home: {
        teamEspnId: '2709',
        abbrev: 'MSST',
        displayName: 'Mississippi State',
        score: 42,
        rank: null,
        logo: 'https://example.com/msst.png',
        color: '660066',
      },
      away: {
        teamEspnId: '2393',
        abbrev: 'MISS',
        displayName: 'Ole Miss',
        score: 35,
        rank: null,
        logo: 'https://example.com/miss.png',
        color: 'c60c30',
      },
      odds: {
        favoriteTeamEspnId: '2709',
        spread: -7,
        overUnder: 80,
      },
      lastUpdated: new Date('2025-11-27T19:30:00Z'),
    };

    expect(game.lastUpdated instanceof Date).toBe(true);
  });
});

describe('TeamRecord Type', () => {
  it('can create complete record', () => {
    const record: TeamRecord = {
      overall: '10-2',
      conference: '7-1',
      home: '5-0',
      away: '5-2',
      stats: {
        wins: 10,
        losses: 2,
        winPercent: 0.833,
        pointsFor: 350,
        pointsAgainst: 240,
        pointDifferential: 110,
        avgPointsFor: 29.2,
        avgPointsAgainst: 20.0,
      },
    };

    expect(record.overall).toBe('10-2');
    expect(record.stats?.wins).toBe(10);
    expect(record.stats?.winPercent).toBe(0.833);
  });

  it('can create partial record with only overall', () => {
    const record: TeamRecord = {
      overall: '8-4',
    };

    expect(record.overall).toBe('8-4');
    expect(record.conference).toBeUndefined();
    expect(record.stats).toBeUndefined();
  });

  it('can create record with only stats', () => {
    const record: TeamRecord = {
      stats: {
        wins: 9,
        losses: 3,
      },
    };

    expect(record.stats?.wins).toBe(9);
    expect(record.overall).toBeUndefined();
  });

  it('conference can be null or string', () => {
    const recordWithConf: TeamRecord = {
      conference: '6-2',
    };

    const recordWithoutConf: TeamRecord = {
      conference: null,
    };

    expect(recordWithConf.conference).toBe('6-2');
    expect(recordWithoutConf.conference).toBeNull();
  });

  it('win percent can be 0', () => {
    const record: TeamRecord = {
      stats: {
        wins: 0,
        losses: 12,
        winPercent: 0,
      },
    };

    expect(record.stats?.winPercent).toBe(0);
  });

  it('win percent can be 1.0 (perfect)', () => {
    const record: TeamRecord = {
      stats: {
        wins: 12,
        losses: 0,
        winPercent: 1.0,
      },
    };

    expect(record.stats?.winPercent).toBe(1.0);
  });
});

describe('ReshapedTeam Type', () => {
  it('can create complete team', () => {
    const team: ReshapedTeam = {
      _id: '25',
      name: 'Alabama Crimson Tide',
      displayName: 'Alabama',
      abbreviation: 'ALA',
      logo: 'https://example.com/ala-logo.png',
      color: 'ba0c2f',
      alternateColor: 'ffffff',
      conferenceId: '8',
      record: {
        overall: '10-2',
        conference: '7-1',
        stats: {
          wins: 10,
          losses: 2,
          winPercent: 0.833,
          avgPointsFor: 31.5,
          avgPointsAgainst: 18.2,
        },
      },
      conferenceStanding: '6-1',
      nationalRanking: 5,
      playoffSeed: 1,
      nextGameId: '401547925',
      lastUpdated: new Date(),
    };

    expect(team._id).toBe('25');
    expect(team.displayName).toBe('Alabama');
    expect(team.color).toBe('ba0c2f');
    expect(team.nationalRanking).toBe(5);
  });

  it('can create team with minimal fields', () => {
    const team: ReshapedTeam = {
      _id: '2335',
      name: 'LSU Tigers',
      displayName: 'LSU',
      abbreviation: 'LSU',
      logo: 'https://example.com/lsu-logo.png',
      color: '4d1d4d',
      alternateColor: 'ffd700',
      conferenceId: '8',
      lastUpdated: new Date(),
    };

    expect(team._id).toBe('2335');
    expect(team.record).toBeUndefined();
    expect(team.nationalRanking).toBeUndefined();
  });

  it('national ranking can be null for unranked', () => {
    const team: ReshapedTeam = {
      _id: '2697',
      name: 'Vanderbilt Commodores',
      displayName: 'Vanderbilt',
      abbreviation: 'VANDY',
      logo: 'https://example.com/vandy-logo.png',
      color: '222222',
      alternateColor: 'gold',
      conferenceId: '8',
      nationalRanking: null,
      lastUpdated: new Date(),
    };

    expect(team.nationalRanking).toBeNull();
  });

  it('can have playoff seed', () => {
    const team: ReshapedTeam = {
      _id: '25',
      name: 'Alabama Crimson Tide',
      displayName: 'Alabama',
      abbreviation: 'ALA',
      logo: 'https://example.com/ala-logo.png',
      color: 'ba0c2f',
      alternateColor: 'ffffff',
      conferenceId: '8',
      playoffSeed: 1,
      lastUpdated: new Date(),
    };

    expect(team.playoffSeed).toBe(1);
  });

  it('playoff seed can be null', () => {
    const team: ReshapedTeam = {
      _id: '2638',
      name: 'Arkansas Razorbacks',
      displayName: 'Arkansas',
      abbreviation: 'ARK',
      logo: 'https://example.com/ark-logo.png',
      color: 'a30d2d',
      alternateColor: 'ffffff',
      conferenceId: '8',
      playoffSeed: null,
      lastUpdated: new Date(),
    };

    expect(team.playoffSeed).toBeNull();
  });

  it('next game ID is optional', () => {
    const team: ReshapedTeam = {
      _id: '2113',
      name: 'Georgia Bulldogs',
      displayName: 'Georgia',
      abbreviation: 'UGA',
      logo: 'https://example.com/uga-logo.png',
      color: 'ba0021',
      alternateColor: 'ffffff',
      conferenceId: '8',
      lastUpdated: new Date(),
    };

    expect(team.nextGameId).toBeUndefined();
  });

  it('can have conference standing', () => {
    const team: ReshapedTeam = {
      _id: '25',
      name: 'Alabama Crimson Tide',
      displayName: 'Alabama',
      abbreviation: 'ALA',
      logo: 'https://example.com/ala-logo.png',
      color: 'ba0c2f',
      alternateColor: 'ffffff',
      conferenceId: '8',
      conferenceStanding: '1-0',
      lastUpdated: new Date(),
    };

    expect(team.conferenceStanding).toBe('1-0');
  });

  it('lastUpdated is required and must be Date', () => {
    const team: ReshapedTeam = {
      _id: '2335',
      name: 'LSU Tigers',
      displayName: 'LSU',
      abbreviation: 'LSU',
      logo: 'https://example.com/lsu-logo.png',
      color: '4d1d4d',
      alternateColor: 'ffd700',
      conferenceId: '8',
      lastUpdated: new Date('2025-11-12T18:30:00Z'),
    };

    expect(team.lastUpdated instanceof Date).toBe(true);
  });
});

describe('Type Compatibility', () => {
  it('game with all fields matches ReshapedGame', () => {
    const game: ReshapedGame = {
      espnId: '123',
      displayName: 'A @ B',
      date: '2025-01-01T00:00Z',
      week: 1,
      season: 2025,
      sport: 'football',
      league: 'college-football',
      state: 'post',
      completed: true,
      conferenceGame: true,
      neutralSite: false,
      home: {
        teamEspnId: '1',
        abbrev: 'A',
        displayName: 'Team A',
        score: 28,
        rank: 10,
        logo: 'https://example.com/a.png',
        color: 'ff0000',
      },
      away: {
        teamEspnId: '2',
        abbrev: 'B',
        displayName: 'Team B',
        score: 24,
        rank: 15,
        logo: 'https://example.com/b.png',
        color: '0000ff',
      },
      odds: {
        favoriteTeamEspnId: '1',
        spread: -4,
        overUnder: 52,
      },
      lastUpdated: new Date(),
    };

    // Should compile without errors
    expect(game.espnId).toBeDefined();
  });

  it('team with all fields matches ReshapedTeam', () => {
    const team: ReshapedTeam = {
      _id: '1',
      name: 'Team One',
      displayName: 'Team',
      abbreviation: 'T1',
      logo: 'https://example.com/t1.png',
      color: 'aabbcc',
      alternateColor: 'ddeeff',
      conferenceId: '1',
      record: {
        overall: '10-2',
        stats: {
          wins: 10,
          losses: 2,
        },
      },
      conferenceStanding: '5-1',
      nationalRanking: 5,
      playoffSeed: 2,
      nextGameId: '12345',
      lastUpdated: new Date(),
    };

    // Should compile without errors
    expect(team._id).toBeDefined();
  });
});
