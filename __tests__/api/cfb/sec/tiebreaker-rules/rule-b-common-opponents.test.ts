/**
 * SEC Tiebreaker Rule B: Common Opponents - Unit Tests
 *
 * Tests extracted directly from the official SEC tiebreaker rules document.
 * Rule B: Record versus all common Conference opponents among the tied teams
 */

import { applyRuleBCommonOpponents } from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
import { createMockGame } from './test-helpers';

describe('SEC Tiebreaker Rules - Rule B: Common Opponents', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A 2-0 vs common, Team B 1-1, Team A advances', () => {
      const games = [
        createMockGame('1', 'A', 'C', 28, 24, 'ALA', 'LSU'),
        createMockGame('2', 'B', 'C', 28, 24, 'UA', 'LSU'),
        createMockGame('3', 'A', 'D', 30, 20, 'ALA', 'UGA'),
        createMockGame('4', 'B', 'D', 17, 20, 'UA', 'UGA'),
      ];

      const result = applyRuleBCommonOpponents(['A', 'B'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
    });
  });

  describe('Three-Team Tie (or More) for First Place', () => {
    it('Example #1: Team A 2-0, Team B 1-1, Team C 0-2; Rule B identifies Team A as winner (in full flow: Team A 1st, Teams B and C exit for recursive two-team tiebreaker)', () => {
      const games = [
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'TENN'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 17, 20, 'UA', 'TENN'),
        createMockGame('5', 'C', 'D', 17, 20, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 17, 20, 'LSU', 'TENN'),
      ];

      const result = applyRuleBCommonOpponents(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A 2-0, Team B 2-0, Team C 1-1; Rule B identifies Teams A and B as winners (in full flow: Teams A and B advance, Team C eliminated, A and B revert to two-team tiebreaker)', () => {
      const games = [
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'TENN'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('5', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 17, 20, 'LSU', 'TENN'),
      ];

      const result = applyRuleBCommonOpponents(['A', 'B', 'C'], games);

      expect(result.winners).toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });

  describe('Three-Team Tie (or More) for Second Place', () => {
    it('Example #1: Team A 2-0, Team B 1-1, Team C 0-2; Team A advances', () => {
      const games = [
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'TENN'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 17, 20, 'UA', 'TENN'),
        createMockGame('5', 'C', 'D', 17, 20, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 17, 20, 'LSU', 'TENN'),
      ];

      const result = applyRuleBCommonOpponents(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A 2-0, Team B 2-0, Team C 1-1; Rule B identifies Teams A and B as winners (in full flow: Team C eliminated, Teams A and B revert to two-team tiebreaker)', () => {
      const games = [
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'TENN'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('5', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 17, 20, 'LSU', 'TENN'),
      ];

      const result = applyRuleBCommonOpponents(['A', 'B', 'C'], games);

      expect(result.winners).toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });
});
