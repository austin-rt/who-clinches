import { applyRuleBCommonOpponents } from '@/lib/cfb/tiebreaker-rules/common/rule-b-common-opponents';
import { createGameLean } from './test-helpers';

describe('Common Tiebreaker Rules - Rule B: Common Opponents', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A 2-0 vs common, Team B 1-1, Team A advances', () => {
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 30, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'B', score: 17, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
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
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'B', score: 17, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
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
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
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
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'B', score: 17, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
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
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
      ];

      const result = applyRuleBCommonOpponents(['A', 'B', 'C'], games);

      expect(result.winners).toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });
});
