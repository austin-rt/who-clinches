import { applyRuleBCommonOpponents } from '@/lib/cfb/tiebreaker-rules/common/rule-b-common-opponents';
import { createGameLean } from './test-helpers';

describe('Common Tiebreaker Rules - Rule B: Common Opponents', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A 2-0 vs common, Team B 1-1, Team A advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: 30, abbrev: 'ALA' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
      ];

      const result = applyRuleBCommonOpponents(['A', 'B'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
    });
  });

  describe('Three-Team Tie (or More) for First Place', () => {
    it('Example #1: Team A 2-0, Team B 1-1, Team C 0-2; Rule B identifies Team A as winner (in full flow: Team A 1st, Teams B and C exit for recursive two-team tiebreaker)', () => {
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
      ];

      const result = applyRuleBCommonOpponents(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A 2-0, Team B 2-0, Team C 1-1; Rule B identifies Teams A and B as winners (in full flow: Teams A and B advance, Team C eliminated, A and B revert to two-team tiebreaker)', () => {
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
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
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
      ];

      const result = applyRuleBCommonOpponents(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A 2-0, Team B 2-0, Team C 1-1; Rule B identifies Teams A and B as winners (in full flow: Team C eliminated, Teams A and B revert to two-team tiebreaker)', () => {
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
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
      ];

      const result = applyRuleBCommonOpponents(['A', 'B', 'C'], games);

      expect(result.winners).toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });
});
