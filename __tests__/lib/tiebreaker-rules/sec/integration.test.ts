/**
 * SEC Tiebreaker Rules - Full Standings Integration Tests
 *
 * Tests for complete tiebreaker flow and standings calculation
 */

import { breakTie, calculateStandings } from '@/lib/tiebreaker-helpers';
import { createMockGame } from './test-helpers';

describe('SEC Tiebreaker Rules - Full Standings Integration', () => {
  it('Two-team tie for second place - Rule A resolves', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'A', 'C', 28, 24, 'ALA', 'LSU'),
      createMockGame('3', 'B', 'C', 28, 24, 'UA', 'LSU'),
    ];

    const explanations = new Map<string, string[]>();
    const result = breakTie(['A', 'B'], games, ['A', 'B', 'C'], explanations);

    expect(result.ranked.length).toBe(2);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('Three-team tie for first place - Rule A eliminates one team', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'A', 'C', 28, 24, 'ALA', 'LSU'),
      createMockGame('3', 'B', 'C', 28, 24, 'UA', 'LSU'),
    ];

    const explanations = new Map<string, string[]>();
    const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C'], explanations);

    expect(result.ranked.length).toBe(3);
    expect(result.steps.some((step) => step.rule.includes('Head-to-Head'))).toBe(true);
  });

  it('Full standings calculation with multiple teams', () => {
    const games = [
      createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
      createMockGame('2', 'A', 'C', 28, 24, 'ALA', 'LSU'),
      createMockGame('3', 'B', 'C', 28, 24, 'UA', 'LSU'),
      createMockGame('4', 'A', 'D', 28, 24, 'ALA', 'UGA'),
      createMockGame('5', 'B', 'D', 17, 20, 'UA', 'UGA'),
      createMockGame('6', 'C', 'D', 17, 20, 'LSU', 'UGA'),
    ];

    const result = calculateStandings(games, ['A', 'B', 'C', 'D']);

    expect(result.standings.length).toBe(4);
    expect(result.standings[0].rank).toBe(1);
    expect(result.standings[3].rank).toBe(4);
  });
});
