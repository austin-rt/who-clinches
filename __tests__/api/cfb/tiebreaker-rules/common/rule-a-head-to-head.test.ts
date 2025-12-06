import { applyRuleAHeadToHead } from '@/lib/cfb/tiebreaker-rules/common/rule-a-head-to-head';
import { createGameLean } from './test-helpers';

describe('Common Tiebreaker Rules - Rule A: Head-to-Head', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A defeats Team B, Team A advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
      ];

      const result = applyRuleAHeadToHead(['A', 'B'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
    });
  });

  describe('Three-Team Tie (or More) for First Place', () => {
    it('Example #1: Team A defeats both Team B and Team C, Team A advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A loses to both Team B and Team C, Team A eliminated, B and C advance', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'A', score: 24, abbrev: 'ALA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'A', score: 24, abbrev: 'ALA' },
        }),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C'], games);

      expect(result.winners).not.toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).toContain('C');
    });

    it('Example #3: Team D loses to A, B, C; Team D eliminated, A, B, C revert to beginning', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C', 'D'], games);

      expect(result.winners).not.toContain('D');
      expect(result.winners.length).toBe(3);
    });
  });

  describe('Three-Team Tie (or More) for Second Place', () => {
    it('Example #1: Team A defeats both Team B and Team C, Team A advances', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });

    it('Example #2: Team A loses to both Team B and Team C, Team A eliminated', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'A', score: 24, abbrev: 'ALA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'A', score: 24, abbrev: 'ALA' },
        }),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C'], games);

      expect(result.winners).not.toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).toContain('C');
    });

    it('Example #3: Team D loses to A, B, C; Team D eliminated', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
      ];

      const result = applyRuleAHeadToHead(['A', 'B', 'C', 'D'], games);

      expect(result.winners).not.toContain('D');
      expect(result.winners.length).toBe(3);
    });
  });
});
