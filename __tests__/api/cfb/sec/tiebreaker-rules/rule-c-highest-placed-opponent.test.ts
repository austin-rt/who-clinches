/**
 * SEC Tiebreaker Rule C: Highest Placed Common Opponent - Unit Tests
 *
 * Tests extracted directly from the official SEC tiebreaker rules document.
 * Rule C: Record against highest (best) placed common Conference opponent,
 * proceeding through the Conference standings among the tied teams
 */

import { applyRuleCHighestPlacedOpponent } from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
import { createMockGame } from './test-helpers';

describe('SEC Tiebreaker Rules - Rule C: Highest Placed Common Opponent', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example #1: Team B beats Team D, Team C loses to Team D, Team B advances', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'C', 'D', 17, 20, 'LSU', 'UGA'),
        createMockGame('5', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('6', 'C', 'E', 28, 24, 'LSU', 'TENN'),
        createMockGame('7', 'D', 'E', 28, 24, 'UGA', 'TENN'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team B beats Team D, Team C loses to Team D, Team B advances', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'C', 'D', 17, 20, 'LSU', 'UGA'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
    });

    it('Example #3: Combined records when D and E are tied, Team B 2-0, Team C 0-2, Team B advances', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('5', 'C', 'D', 17, 20, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 17, 20, 'LSU', 'TENN'),
        createMockGame('7', 'D', 'E', 28, 24, 'UGA', 'TENN'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
    });

    it('Example #4: Only Team D is common when D and E are tied, Team B beats D, Team C loses to D, Team B advances', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('5', 'C', 'D', 17, 20, 'LSU', 'UGA'),
        createMockGame('6', 'D', 'E', 28, 24, 'UGA', 'TENN'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
    });
  });

  describe('Three-Team Tie (or More) for First Place', () => {
    it('Example #1: Team B beats Team D, Team C loses to Team D, Team B advances', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('5', 'C', 'D', 17, 20, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 28, 24, 'LSU', 'TENN'),
        createMockGame('7', 'D', 'E', 28, 24, 'UGA', 'TENN'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A and Team B both beat Team D, Team C loses; A and B advance', () => {
      const games = [
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'B', null, null, 'ALA', 'UA'),
        createMockGame('3', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('4', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('5', 'C', 'D', 17, 20, 'LSU', 'UGA'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E'];
      const result = applyRuleCHighestPlacedOpponent(['A', 'B', 'C'], games, allTeams);

      expect(result.winners).toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #3: Team A beats Team D, Team B and C lose; Team A advances', () => {
      const games = [
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'B', null, null, 'ALA', 'UA'),
        createMockGame('3', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('4', 'B', 'D', 17, 20, 'UA', 'UGA'),
        createMockGame('5', 'C', 'D', 17, 20, 'LSU', 'UGA'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E'];
      const result = applyRuleCHighestPlacedOpponent(['A', 'B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #4: Combined records when D and E are tied (head-to-head cannot break tie), Team A 2-0, Team B 1-1, Team C 0-2; Team A advances', () => {
      // According to official rules: "The tie among Team D and Team E could not be broken"
      // This means D and E don't play each other, or head-to-head fails to break the tie
      // So we combine records against both D and E
      const games = [
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'TENN'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 17, 20, 'UA', 'TENN'),
        createMockGame('5', 'C', 'D', 17, 20, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 17, 20, 'LSU', 'TENN'),
        // D and E don't play each other, so head-to-head cannot break the tie
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['A', 'B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });

  describe('Three-Team Tie (or More) for Second Place', () => {
    it('Example #1: Team B beats Team E, Team C and D lose; Team B advances', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('3', 'A', 'D', null, null, 'ALA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('5', 'B', 'F', 28, 24, 'UA', 'FLA'),
        createMockGame('6', 'C', 'E', 17, 20, 'LSU', 'TENN'),
        createMockGame('7', 'C', 'F', 28, 24, 'LSU', 'FLA'),
        createMockGame('8', 'D', 'E', 17, 20, 'UGA', 'TENN'),
        createMockGame('9', 'D', 'F', 28, 24, 'UGA', 'FLA'),
        createMockGame('10', 'E', 'F', 28, 24, 'TENN', 'FLA'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C', 'D'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
      expect(result.winners).not.toContain('D');
    });

    it('Example #2: Team B beats Team E, Team C and D lose; Team B advances', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('3', 'A', 'D', null, null, 'ALA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('5', 'C', 'E', 17, 20, 'LSU', 'TENN'),
        createMockGame('6', 'D', 'E', 17, 20, 'UGA', 'TENN'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C', 'D'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
      expect(result.winners).not.toContain('D');
    });

    it('Example #3: Team B and C beat Team E, Team D loses; B and C revert to two-team tiebreaker', () => {
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('3', 'A', 'D', null, null, 'ALA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('5', 'C', 'E', 28, 24, 'LSU', 'TENN'),
        createMockGame('6', 'D', 'E', 17, 20, 'UGA', 'TENN'),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C', 'D'], games, allTeams);

      expect(result.winners).toContain('B');
      expect(result.winners).toContain('C');
      expect(result.winners).not.toContain('D');
    });

    it('Example #4: Combined records when E and F are tied (head-to-head cannot break tie), Team B 2-0, Team C 1-1, Team D 0-2; Team B advances', () => {
      // According to official rules: "The tie among Team E and Team F could not be broken"
      // This means E and F don't play each other, or head-to-head fails to break the tie
      // So we combine records against both E and F
      const games = [
        createMockGame('1', 'A', 'B', 28, 24, 'ALA', 'UA'),
        createMockGame('2', 'A', 'C', null, null, 'ALA', 'LSU'),
        createMockGame('3', 'A', 'D', null, null, 'ALA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('5', 'B', 'F', 28, 24, 'UA', 'FLA'),
        createMockGame('6', 'C', 'E', 28, 24, 'LSU', 'TENN'),
        createMockGame('7', 'C', 'F', 17, 20, 'LSU', 'FLA'),
        createMockGame('8', 'D', 'E', 17, 20, 'UGA', 'TENN'),
        createMockGame('9', 'D', 'F', 17, 20, 'UGA', 'FLA'),
        // E and F don't play each other, so head-to-head cannot break the tie
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C', 'D'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
      expect(result.winners).not.toContain('D');
    });
  });
});
