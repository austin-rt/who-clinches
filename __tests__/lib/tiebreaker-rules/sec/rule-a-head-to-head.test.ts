/**
 * SEC Tiebreaker Rule A: Head-to-Head - Unit Tests
 *
 * Tests extracted directly from the official SEC tiebreaker rules document.
 * Rule A: Head-to-head competition among the tied teams
 */

import { applyRuleAHeadToHead } from '@/lib/tiebreaker-helpers';
import { createMockGame } from './test-helpers';

describe('SEC Tiebreaker Rules - Rule A: Head-to-Head', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A defeats Team B, Team A advances', () => {
      const games = [createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA')];

      const result = applyRuleAHeadToHead(['A', 'B'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
    });
  });

  describe('Three-Team Tie (or More) for First Place', () => {
    it('Example #1: Team A defeats both Team B and Team C, Team A advances', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', 28, 24, 'ALA', 'LSU'),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A loses to both Team B and Team C, Team A eliminated, B and C advance', () => {
      const games = [
        createMockGame('1', 'B', 'A', 28, 24, 'UA', 'ALA'),
        createMockGame('2', 'C', 'A', 28, 24, 'LSU', 'ALA'),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C'], games);

      expect(result.winners).not.toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).toContain('C');
    });

    it('Example #3: Team D loses to A, B, C; Team D eliminated, A, B, C revert to beginning', () => {
      const games = [
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('3', 'C', 'D', 28, 24, 'LSU', 'UGA'),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C', 'D'], games);

      expect(result.winners).not.toContain('D');
      expect(result.winners.length).toBe(3);
    });
  });

  describe('Three-Team Tie (or More) for Second Place', () => {
    it('Example #1: Team A defeats both Team B and Team C, Team A advances', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', 28, 24, 'ALA', 'LSU'),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A loses to both Team B and Team C, Team A eliminated', () => {
      const games = [
        createMockGame('1', 'B', 'A', 28, 24, 'UA', 'ALA'),
        createMockGame('2', 'C', 'A', 28, 24, 'LSU', 'ALA'),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C'], games);

      expect(result.winners).not.toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).toContain('C');
    });

    it('Example #3: Team D loses to A, B, C; Team D eliminated', () => {
      const games = [
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('3', 'C', 'D', 28, 24, 'LSU', 'UGA'),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C', 'D'], games);

      expect(result.winners).not.toContain('D');
      expect(result.winners.length).toBe(3);
    });
  });
});
