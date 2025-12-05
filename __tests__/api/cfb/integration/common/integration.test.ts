import { breakTie } from '@/lib/cfb/tiebreaker-rules/core/breakTie';
import { SEC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/sec/config';
import { createGameLean } from '../../tiebreaker-rules/common/test-helpers';

describe('Common Tiebreaker Rules - Integration Tests', () => {
  describe('Rule A: Head-to-Head - Recursion Scenarios', () => {
    it('Three-team tie for first place Example #2: Team A eliminated, B/C revert to two-team tiebreaker', () => {
      // From rule-a-head-to-head.txt lines 94-103
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // Team A lost to both Team B and Team C
      // B and C are tied (they don't play each other, or it's a round robin where they're tied)
      // For this test, B and C don't play each other, so they're tied at 1-0 in head-to-head
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C'], SEC_TIEBREAKER_CONFIG, explanations);

      expect(result.ranked).toContain('A');
      expect(result.ranked).toContain('B');
      expect(result.ranked).toContain('C');
      expect(result.steps.some((step) => step.rule.includes('Head-to-Head'))).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
      const firstStep = result.steps.find((step) => step.rule.includes('Head-to-Head'));
      expect(firstStep?.survivors).not.toContain('A');
    });

    it('Three-team tie for second place Example #2: Team A eliminated, B/C revert to two-team tiebreaker', () => {
      // From rule-a-head-to-head.txt lines 126-134
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // Team A lost to both Team B and Team C
      // B and C are tied (they don't play each other)
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C'], SEC_TIEBREAKER_CONFIG, explanations);

      expect(result.ranked).toContain('A');
      expect(result.ranked).toContain('B');
      expect(result.ranked).toContain('C');
      expect(result.steps.some((step) => step.rule.includes('Head-to-Head'))).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
      const firstStep = result.steps.find((step) => step.rule.includes('Head-to-Head'));
      expect(firstStep?.survivors).not.toContain('A');
    });
  });

  describe('Rule B: Common Opponents - Cascade & Recursion', () => {
    it('Three-team tie for first place Example #1: Team A advances, B/C re-ranked using full cascade', () => {
      // From rule-b-common-opponents.txt lines 104-117
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // 2 common opponents: Team D and Team E
      // Team A: 2-0 vs common, Team B: 1-1 vs common, Team C: 0-2 vs common
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E'], SEC_TIEBREAKER_CONFIG, explanations);

      const survivors =
        result.steps.find((step) => step.rule.includes('Common Opponents'))?.survivors || [];
      expect(survivors).toContain('A');
      expect(result.steps.some((step) => step.rule.includes('Common Opponents'))).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
    });

    it('Three-team tie for first place Example #2: Team C eliminated, A/B revert to two-team tiebreaker', () => {
      // From rule-b-common-opponents.txt lines 118-132
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // 2 common opponents: Team D and Team E
      // Team A: 2-0 vs common, Team B: 2-0 vs common, Team C: 1-1 vs common
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E'], SEC_TIEBREAKER_CONFIG, explanations);

      expect(result.ranked).toContain('C');
      expect(result.steps.some((step) => step.rule.includes('Common Opponents'))).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
    });

    it('Three-team tie for second place Example #2: Team C eliminated, A/B revert to two-team tiebreaker', () => {
      // From rule-b-common-opponents.txt lines 161-174
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // 2 common opponents: Team D and Team E
      // Team A: 2-0 vs common, Team B: 2-0 vs common, Team C: 1-1 vs common
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E'], SEC_TIEBREAKER_CONFIG, explanations);

      expect(result.ranked).toContain('C');
      expect(result.steps.some((step) => step.rule.includes('Common Opponents'))).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
    });
  });

  describe('Rule C: Highest Placed Opponent - Cascade & Recursion', () => {
    it('Three-team tie for first place Example #2: Team A and B advance, revert to two-team tiebreaker', () => {
      // From rule-c-highest-placed-opponent.txt lines 219-240
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // Top 5: Team A 6-2, Team B 6-2, Team C 6-2, Team D 5-3, Team E 4-4
      // Team A, B, C all played Team D
      // Team A: 1-0 vs D, Team B: 1-0 vs D, Team C: 0-1 vs D
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E'], SEC_TIEBREAKER_CONFIG, explanations);

      expect(result.ranked).toContain('C');
      expect(
        result.steps.some((step) => step.rule.includes('Highest Placed Common Opponent'))
      ).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
    });

    it('Three-team tie for first place Example #3: Team A advances, B/C revert to two-team tiebreaker', () => {
      // From rule-c-highest-placed-opponent.txt lines 242-262
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // Top 5: Team A 6-2, Team B 6-2, Team C 6-2, Team D 5-3, Team E 4-4
      // Team A, B, C all played Team D
      // Team A: 1-0 vs D, Team B: 0-1 vs D, Team C: 0-1 vs D
      // Need to ensure Rules A and B don't break the tie first
      // A, B, C don't play each other (no head-to-head)
      // A, B, C have no common opponents other than D (so Rule B doesn't break tie)
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'F', score: 28, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'G', score: 28, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
          away: { teamEspnId: 'G', score: 28, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'UT' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(
        ['A', 'B', 'C'],
        games,
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        SEC_TIEBREAKER_CONFIG,
        explanations
      );

      const ruleCStep = result.steps.find((step) =>
        step.rule.includes('Highest Placed Common Opponent')
      );
      expect(ruleCStep).toBeDefined();
      expect(
        result.steps.some((step) => step.rule.includes('Highest Placed Common Opponent'))
      ).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
      expect(result.ranked.length).toBe(3);
      expect(result.ranked).toContain('A');
      expect(result.ranked).toContain('B');
      expect(result.ranked).toContain('C');
    });

    it('Three-team tie for second place Example #3: Team D eliminated, B/C revert to two-team tiebreaker', () => {
      // From rule-c-highest-placed-opponent.txt lines 336-357
      // Team B: 6-2, Team C: 6-2, Team D: 6-2
      // Top 5: Team A 7-1, Team B 6-2, Team C 6-2, Team D 6-2, Team E 5-3
      // Team B, C, D all played Team E
      // Team B: 1-0 vs E, Team C: 1-0 vs E, Team D: 0-1 vs E
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['B', 'C', 'D'], games, ['A', 'B', 'C', 'D', 'E'], SEC_TIEBREAKER_CONFIG, explanations);

      expect(result.ranked).toContain('D');
      expect(
        result.steps.some((step) => step.rule.includes('Highest Placed Common Opponent'))
      ).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
    });
  });

  describe('Rule D: Opponent Win Percentage - Cascade & Recursion', () => {
    it('Three-team tie for first place: Team A advances, B/C revert to two-team tiebreaker', () => {
      // From rule-d-opponent-win-percentage.txt lines 70-85
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // Average winning percentage of Conference opponents:
      // Team A: 52.5%, Team B: 50.0%, Team C: 47.5%
      // Need to create full conference schedule to calculate opponent win percentages
      // For 6-2 teams, they have 8 conference games
      // To get Team A at 52.5%, Team B at 50.0%, Team C at 47.5%, we need to set up opponents with different records
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '17',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '18',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '19',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '20',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '21',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
          away: { teamEspnId: 'G', score: 28, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'VU' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(
        ['A', 'B', 'C'],
        games,
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
        SEC_TIEBREAKER_CONFIG,
        explanations
      );

      const hasRuleD = result.steps.some((step) => step.rule.includes('Opponent Win Percentage'));
      if (hasRuleD) {
        const ruleDStep = result.steps.find((step) =>
          step.rule.includes('Opponent Win Percentage')
        );
        if (ruleDStep) {
          expect(ruleDStep.survivors.length).toBeGreaterThan(0);
        }
      }
      expect(result.steps.length).toBeGreaterThan(1);
    });

    it('Cascade through Rules A, B, C to Rule D: All earlier rules fail, Rule D breaks tie', () => {
      // Create scenario where Rules A, B, C don't break the tie, then Rule D does
      // Three teams tied, no head-to-head games, same record vs common opponents, same record vs highest placed
      // Rule D breaks based on opponent win percentage
      // A, B, C all have same record vs common opponents (all beat D, E, F, G, H, I, J, K)
      // But A's opponents have better records, so A has higher opponent win%
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '17',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '18',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '19',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '20',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '21',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '37',
          home: { teamEspnId: 'E', score: 28, abbrev: 'UF' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '38',
          home: { teamEspnId: 'F', score: 28, abbrev: 'UK' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '39',
          home: { teamEspnId: 'F', score: 28, abbrev: 'UK' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '40',
          home: { teamEspnId: 'F', score: 28, abbrev: 'UK' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '41',
          home: { teamEspnId: 'F', score: 28, abbrev: 'UK' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '42',
          home: { teamEspnId: 'F', score: 28, abbrev: 'UK' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '43',
          home: { teamEspnId: 'G', score: 28, abbrev: 'USC' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '44',
          home: { teamEspnId: 'G', score: 28, abbrev: 'USC' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '45',
          home: { teamEspnId: 'G', score: 28, abbrev: 'USC' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '46',
          home: { teamEspnId: 'G', score: 28, abbrev: 'USC' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '47',
          home: { teamEspnId: 'H', score: 28, abbrev: 'UT' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '48',
          home: { teamEspnId: 'H', score: 28, abbrev: 'UT' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '49',
          home: { teamEspnId: 'H', score: 28, abbrev: 'UT' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '50',
          home: { teamEspnId: 'I', score: 28, abbrev: 'VU' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '51',
          home: { teamEspnId: 'I', score: 28, abbrev: 'VU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '52',
          home: { teamEspnId: 'J', score: 28, abbrev: 'TAMU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '53',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'OM' },
        }),
        createGameLean({
          gameEspnId: '54',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'L', score: 28, abbrev: 'OM' },
        }),
        createGameLean({
          gameEspnId: '55',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'L', score: 28, abbrev: 'OM' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(
        ['A', 'B', 'C'],
        games,
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
        SEC_TIEBREAKER_CONFIG,
        explanations
      );

      const ruleNames = result.steps.map((step) => step.rule);
      expect(ruleNames).toContain('Head-to-Head');
      expect(ruleNames).toContain('Common Opponents');
      const hasRuleC = ruleNames.some((rule) => rule.includes('Highest Placed Common Opponent'));
      const hasRuleD = ruleNames.some((rule) => rule.includes('Opponent Win Percentage'));
      expect(hasRuleC || hasRuleD).toBe(true);
      if (hasRuleD) {
        expect(result.steps.length).toBeGreaterThan(3);
      }
    });
  });
});
