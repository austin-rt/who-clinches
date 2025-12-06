import { applyRuleCHighestPlacedOpponent } from '@/lib/cfb/tiebreaker-rules/common/rule-c-highest-placed-opponent';
import { createGameLean } from './test-helpers';

describe('Common Tiebreaker Rules - Rule C: Highest Placed Common Opponent', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example #1: Team B beats Team D, Team C loses to Team D, Team B advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team B beats Team D, Team C loses to Team D, Team B advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
    });

    it('Example #3: Combined records when D and E are tied, Team B 2-0, Team C 0-2, Team B advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
    });

    it('Example #4: Only Team D is common when D and E are tied, Team B beats D, Team C loses to D, Team B advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
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
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A and Team B both beat Team D, Team C loses; A and B advance', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'B', score: null, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E'];
      const result = applyRuleCHighestPlacedOpponent(['A', 'B', 'C'], games, allTeams);

      expect(result.winners).toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #3: Team A beats Team D, Team B and C lose; Team A advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'B', score: null, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
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
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
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
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'D', score: null, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'D', score: 17, abbrev: 'UGA' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '9',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C', 'D'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
      expect(result.winners).not.toContain('D');
    });

    it('Example #2: Team B beats Team E, Team C and D lose; Team B advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'D', score: null, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'D', score: 17, abbrev: 'UGA' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
      ];

      const allTeams = ['A', 'B', 'C', 'D', 'E', 'F'];
      const result = applyRuleCHighestPlacedOpponent(['B', 'C', 'D'], games, allTeams);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('C');
      expect(result.winners).not.toContain('D');
    });

    it('Example #3: Team B and C beat Team E, Team D loses; B and C revert to two-team tiebreaker', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'D', score: null, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'D', score: 17, abbrev: 'UGA' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
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
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'D', score: null, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'F', score: 20, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'D', score: 17, abbrev: 'UGA' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '9',
          home: { teamId: 'D', score: 17, abbrev: 'UGA' },
          away: { teamId: 'F', score: 20, abbrev: 'FLA' },
        }),
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
