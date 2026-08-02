import { buildSimulationOverrides } from '@/lib/utils/buildSimulationOverrides';
import type { GameLean } from '@/lib/types';

const liveGame = (overrides: Partial<GameLean> = {}): GameLean =>
  ({
    id: 'g1',
    state: 'in',
    completed: false,
    home: { teamId: '61', score: 0 },
    away: { teamId: '333', score: 0 },
    predictedScore: { home: 28, away: 21 },
    odds: { favoriteTeamId: '61', spread: -7, overUnder: 49 },
    ...overrides,
  }) as unknown as GameLean;

describe('buildSimulationOverrides', () => {
  it('passes through a pick that already has a winner', () => {
    const result = buildSimulationOverrides([liveGame()], {
      g1: { homeScore: 31, awayScore: 17 },
    });

    expect(result.g1).toEqual({ homeScore: 31, awayScore: 17 });
  });

  it('replaces a winnerless pick with a decisive default', () => {
    const result = buildSimulationOverrides([liveGame()], {
      g1: { homeScore: 0, awayScore: 0 },
    });

    expect(result.g1.homeScore).not.toBe(result.g1.awayScore);
  });

  it('keeps the projected winner when replacing a winnerless pick', () => {
    const result = buildSimulationOverrides([liveGame()], {
      g1: { homeScore: 0, awayScore: 0 },
    });

    expect(result.g1.homeScore).toBeGreaterThan(result.g1.awayScore);
  });

  it('drops a winnerless pick for a game outside the simulated set', () => {
    const result = buildSimulationOverrides([], { g1: { homeScore: 0, awayScore: 0 } });

    expect(result.g1).toBeUndefined();
  });

  it('emits no winnerless override for any pick', () => {
    const result = buildSimulationOverrides([liveGame()], {
      g1: { homeScore: 0, awayScore: 0 },
    });

    Object.values(result).forEach((override) => {
      expect(override.homeScore).not.toBe(override.awayScore);
    });
  });
});
