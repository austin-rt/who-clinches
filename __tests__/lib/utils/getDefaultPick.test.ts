import {
  getDefaultSelectedTeam,
  calculateDefaultScores,
  isPickAtDefault,
} from '@/lib/utils/getDefaultPick';
import { GameLean } from '@/lib/types';

const HOME_ID = 'home-team';
const AWAY_ID = 'away-team';

const makeGame = (overrides: Partial<GameLean> = {}): GameLean =>
  ({
    id: 'game-1',
    completed: false,
    home: { teamId: HOME_ID, score: null },
    away: { teamId: AWAY_ID, score: null },
    odds: { favoriteTeamId: null },
    predictedScore: null,
    ...overrides,
  }) as GameLean;

describe('getDefaultSelectedTeam', () => {
  it('returns actual winner for completed game where home won', () => {
    const game = makeGame({
      completed: true,
      home: { teamId: HOME_ID, score: 31 } as GameLean['home'],
      away: { teamId: AWAY_ID, score: 24 } as GameLean['away'],
    });
    expect(getDefaultSelectedTeam(game)).toBe(HOME_ID);
  });

  it('returns actual winner for completed game where away won', () => {
    const game = makeGame({
      completed: true,
      home: { teamId: HOME_ID, score: 10 } as GameLean['home'],
      away: { teamId: AWAY_ID, score: 17 } as GameLean['away'],
    });
    expect(getDefaultSelectedTeam(game)).toBe(AWAY_ID);
  });

  it('falls through to predictedScore when completed game is tied', () => {
    const game = makeGame({
      completed: true,
      home: { teamId: HOME_ID, score: 20 } as GameLean['home'],
      away: { teamId: AWAY_ID, score: 20 } as GameLean['away'],
      predictedScore: { home: 14, away: 28 },
    });
    expect(getDefaultSelectedTeam(game)).toBe(AWAY_ID);
  });

  it('returns predicted winner when home is favored', () => {
    const game = makeGame({
      predictedScore: { home: 35, away: 21 },
    });
    expect(getDefaultSelectedTeam(game)).toBe(HOME_ID);
  });

  it('returns predicted winner when away is favored', () => {
    const game = makeGame({
      predictedScore: { home: 17, away: 24 },
    });
    expect(getDefaultSelectedTeam(game)).toBe(AWAY_ID);
  });

  it('falls through to odds favorite when predicted scores are tied', () => {
    const game = makeGame({
      predictedScore: { home: 24, away: 24 },
      odds: { favoriteTeamId: AWAY_ID, spread: null, overUnder: null },
    });
    expect(getDefaultSelectedTeam(game)).toBe(AWAY_ID);
  });

  it('falls back to home team when no other signal exists', () => {
    const game = makeGame();
    expect(getDefaultSelectedTeam(game)).toBe(HOME_ID);
  });
});

describe('calculateDefaultScores', () => {
  it('uses actual scores for completed game when picking the actual winner', () => {
    const game = makeGame({
      completed: true,
      home: { teamId: HOME_ID, score: 28 } as GameLean['home'],
      away: { teamId: AWAY_ID, score: 21 } as GameLean['away'],
    });
    expect(calculateDefaultScores(game, HOME_ID)).toEqual({
      homeScore: 28,
      awayScore: 21,
    });
  });

  it('bumps score to winner+1 for completed game when picking the actual loser', () => {
    const game = makeGame({
      completed: true,
      home: { teamId: HOME_ID, score: 28 } as GameLean['home'],
      away: { teamId: AWAY_ID, score: 21 } as GameLean['away'],
    });
    expect(calculateDefaultScores(game, AWAY_ID)).toEqual({
      homeScore: 28,
      awayScore: 29,
    });
  });

  it('returns hardcoded 28-21 when no predicted score exists', () => {
    const game = makeGame();
    expect(calculateDefaultScores(game, HOME_ID)).toEqual({
      homeScore: 28,
      awayScore: 21,
    });
  });

  it('uses predicted scores when picking predicted winner', () => {
    const game = makeGame({
      predictedScore: { home: 31, away: 17 },
    });
    expect(calculateDefaultScores(game, HOME_ID)).toEqual({
      homeScore: 31,
      awayScore: 17,
    });
  });

  it('bumps score to opponent+1 when picking predicted loser', () => {
    const game = makeGame({
      predictedScore: { home: 31, away: 17 },
    });
    expect(calculateDefaultScores(game, AWAY_ID)).toEqual({
      homeScore: 31,
      awayScore: 32,
    });
  });

  it('bumps picked team past tie for completed game with equal scores', () => {
    const game = makeGame({
      completed: true,
      home: { teamId: HOME_ID, score: 20 } as GameLean['home'],
      away: { teamId: AWAY_ID, score: 20 } as GameLean['away'],
    });
    expect(calculateDefaultScores(game, HOME_ID)).toEqual({
      homeScore: 21,
      awayScore: 20,
    });
  });

  it('bumps picked team past tie for equal predicted scores', () => {
    const game = makeGame({
      predictedScore: { home: 24, away: 24 },
    });
    expect(calculateDefaultScores(game, HOME_ID)).toEqual({
      homeScore: 25,
      awayScore: 24,
    });
  });
});

describe('isPickAtDefault', () => {
  it('returns true when pick is undefined', () => {
    const game = makeGame();
    expect(isPickAtDefault(game, undefined)).toBe(true);
  });

  it('returns true when pick matches computed default', () => {
    const game = makeGame({
      predictedScore: { home: 31, away: 17 },
    });
    expect(isPickAtDefault(game, { homeScore: 31, awayScore: 17 })).toBe(true);
  });

  it('returns false when pick differs from default', () => {
    const game = makeGame({
      predictedScore: { home: 31, away: 17 },
    });
    expect(isPickAtDefault(game, { homeScore: 17, awayScore: 32 })).toBe(false);
  });

  it('returns false when only one score differs', () => {
    const game = makeGame({
      predictedScore: { home: 31, away: 17 },
    });
    expect(isPickAtDefault(game, { homeScore: 31, awayScore: 20 })).toBe(false);
  });
});
