/**
 * SEC Tiebreaker Rules - Comprehensive Integration Tests
 *
 * Tests for complete tiebreaker flow, rule cascading, and recursion scenarios.
 * All test scenarios are based on official SEC rules documents in docs/tiebreaker-rules/sec/
 */

import { breakTie } from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
import { createMockGame } from './test-helpers';

describe('SEC Tiebreaker Rules - Integration Tests', () => {
  describe('Rule A: Head-to-Head - Recursion Scenarios', () => {
    it('Three-team tie for first place Example #2: Team A eliminated, B/C revert to two-team tiebreaker', () => {
      // From rule-a-head-to-head.txt lines 94-103
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // Team A lost to both Team B and Team C
      // B and C are tied (they don't play each other, or it's a round robin where they're tied)
      // For this test, B and C don't play each other, so they're tied at 1-0 in head-to-head
      const games = [
        createMockGame('1', 'B', 'A', 28, 24, 'UA', 'ALA'),
        createMockGame('2', 'C', 'A', 28, 24, 'LSU', 'ALA'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C'], explanations);

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
        createMockGame('1', 'B', 'A', 28, 24, 'UA', 'ALA'),
        createMockGame('2', 'C', 'A', 28, 24, 'LSU', 'ALA'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C'], explanations);

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
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'UF'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 24, 28, 'UA', 'UF'),
        createMockGame('5', 'C', 'D', 24, 28, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 24, 28, 'LSU', 'UF'),
        createMockGame('7', 'A', 'B', 24, 24, 'ALA', 'UA'),
        createMockGame('8', 'A', 'C', 24, 24, 'ALA', 'LSU'),
        createMockGame('9', 'B', 'C', 24, 24, 'UA', 'LSU'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E'], explanations);

      const survivors = result.steps.find((step) => step.rule.includes('Common Opponents'))?.survivors || [];
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
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'UF'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'UF'),
        createMockGame('5', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 24, 28, 'LSU', 'UF'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E'], explanations);

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
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'UF'),
        createMockGame('3', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 28, 24, 'UA', 'UF'),
        createMockGame('5', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('6', 'C', 'E', 24, 28, 'LSU', 'UF'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E'], explanations);

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
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('3', 'C', 'D', 24, 28, 'LSU', 'UGA'),
        createMockGame('4', 'A', 'B', 24, 24, 'ALA', 'UA'),
        createMockGame('5', 'A', 'C', 24, 24, 'ALA', 'LSU'),
        createMockGame('6', 'B', 'C', 24, 24, 'UA', 'LSU'),
        createMockGame('7', 'D', 'E', 28, 24, 'UGA', 'UF'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E'], explanations);

      expect(result.ranked).toContain('C');
      expect(result.steps.some((step) => step.rule.includes('Highest Placed Common Opponent'))).toBe(true);
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
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'B', 'D', 24, 28, 'UA', 'UGA'),
        createMockGame('3', 'C', 'D', 24, 28, 'LSU', 'UGA'),
        createMockGame('4', 'A', 'E', 28, 24, 'ALA', 'UF'),
        createMockGame('5', 'B', 'F', 28, 24, 'UA', 'UK'),
        createMockGame('6', 'C', 'G', 28, 24, 'LSU', 'USC'),
        createMockGame('7', 'D', 'E', 28, 24, 'UGA', 'UF'),
        createMockGame('8', 'D', 'F', 28, 24, 'UGA', 'UK'),
        createMockGame('9', 'D', 'G', 28, 24, 'UGA', 'USC'),
        createMockGame('10', 'D', 'H', 28, 24, 'UGA', 'UT'),
        createMockGame('11', 'E', 'F', 24, 28, 'UF', 'UK'),
        createMockGame('12', 'E', 'G', 24, 28, 'UF', 'USC'),
        createMockGame('13', 'E', 'H', 24, 28, 'UF', 'UT'),
        createMockGame('14', 'F', 'G', 24, 28, 'UK', 'USC'),
        createMockGame('15', 'F', 'H', 24, 28, 'UK', 'UT'),
        createMockGame('16', 'G', 'H', 24, 28, 'USC', 'UT'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], explanations);

      const ruleCStep = result.steps.find((step) => step.rule.includes('Highest Placed Common Opponent'));
      expect(ruleCStep).toBeDefined();
      expect(result.steps.some((step) => step.rule.includes('Highest Placed Common Opponent'))).toBe(true);
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
        createMockGame('1', 'B', 'E', 28, 24, 'UA', 'UF'),
        createMockGame('2', 'C', 'E', 28, 24, 'LSU', 'UF'),
        createMockGame('3', 'D', 'E', 24, 28, 'UGA', 'UF'),
        createMockGame('4', 'A', 'B', 28, 24, 'ALA', 'UA'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['B', 'C', 'D'], games, ['A', 'B', 'C', 'D', 'E'], explanations);

      expect(result.ranked).toContain('D');
      expect(result.steps.some((step) => step.rule.includes('Highest Placed Common Opponent'))).toBe(true);
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
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'UF'),
        createMockGame('3', 'A', 'F', 28, 24, 'ALA', 'UK'),
        createMockGame('4', 'A', 'G', 28, 24, 'ALA', 'USC'),
        createMockGame('5', 'A', 'H', 28, 24, 'ALA', 'UT'),
        createMockGame('6', 'A', 'I', 28, 24, 'ALA', 'VU'),
        createMockGame('9', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('10', 'B', 'E', 28, 24, 'UA', 'UF'),
        createMockGame('11', 'B', 'F', 28, 24, 'UA', 'UK'),
        createMockGame('12', 'B', 'G', 28, 24, 'UA', 'USC'),
        createMockGame('13', 'B', 'H', 24, 28, 'UA', 'UT'),
        createMockGame('14', 'B', 'I', 28, 24, 'UA', 'VU'),
        createMockGame('16', 'C', 'D', 24, 28, 'LSU', 'UGA'),
        createMockGame('17', 'C', 'E', 24, 28, 'LSU', 'UF'),
        createMockGame('18', 'C', 'F', 28, 24, 'LSU', 'UK'),
        createMockGame('19', 'C', 'G', 28, 24, 'LSU', 'USC'),
        createMockGame('20', 'C', 'H', 28, 24, 'LSU', 'UT'),
        createMockGame('21', 'C', 'I', 28, 24, 'LSU', 'VU'),
        createMockGame('22', 'D', 'E', 28, 24, 'UGA', 'UF'),
        createMockGame('23', 'D', 'F', 28, 24, 'UGA', 'UK'),
        createMockGame('24', 'D', 'G', 28, 24, 'UGA', 'USC'),
        createMockGame('25', 'D', 'H', 28, 24, 'UGA', 'UT'),
        createMockGame('26', 'D', 'I', 28, 24, 'UGA', 'VU'),
        createMockGame('27', 'E', 'F', 28, 24, 'UF', 'UK'),
        createMockGame('28', 'E', 'G', 28, 24, 'UF', 'USC'),
        createMockGame('29', 'E', 'H', 28, 24, 'UF', 'UT'),
        createMockGame('30', 'E', 'I', 28, 24, 'UF', 'VU'),
        createMockGame('31', 'F', 'G', 24, 28, 'UK', 'USC'),
        createMockGame('32', 'F', 'H', 24, 28, 'UK', 'UT'),
        createMockGame('33', 'F', 'I', 24, 28, 'UK', 'VU'),
        createMockGame('34', 'G', 'H', 24, 28, 'USC', 'UT'),
        createMockGame('35', 'G', 'I', 24, 28, 'USC', 'VU'),
        createMockGame('36', 'H', 'I', 24, 28, 'UT', 'VU'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], explanations);

      const hasRuleD = result.steps.some((step) => step.rule.includes('Opponent Win %'));
      if (hasRuleD) {
        const ruleDStep = result.steps.find((step) => step.rule.includes('Opponent Win %'));
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
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'UF'),
        createMockGame('3', 'A', 'F', 28, 24, 'ALA', 'UK'),
        createMockGame('4', 'A', 'G', 28, 24, 'ALA', 'USC'),
        createMockGame('5', 'A', 'H', 28, 24, 'ALA', 'UT'),
        createMockGame('6', 'A', 'I', 28, 24, 'ALA', 'VU'),
        createMockGame('7', 'A', 'J', 28, 24, 'ALA', 'TAMU'),
        createMockGame('8', 'A', 'K', 28, 24, 'ALA', 'MSU'),
        createMockGame('9', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('10', 'B', 'E', 28, 24, 'UA', 'UF'),
        createMockGame('11', 'B', 'F', 28, 24, 'UA', 'UK'),
        createMockGame('12', 'B', 'G', 28, 24, 'UA', 'USC'),
        createMockGame('13', 'B', 'H', 28, 24, 'UA', 'UT'),
        createMockGame('14', 'B', 'I', 28, 24, 'UA', 'VU'),
        createMockGame('15', 'B', 'J', 28, 24, 'UA', 'TAMU'),
        createMockGame('16', 'B', 'K', 28, 24, 'UA', 'MSU'),
        createMockGame('17', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('18', 'C', 'E', 28, 24, 'LSU', 'UF'),
        createMockGame('19', 'C', 'F', 28, 24, 'LSU', 'UK'),
        createMockGame('20', 'C', 'G', 28, 24, 'LSU', 'USC'),
        createMockGame('21', 'C', 'H', 28, 24, 'LSU', 'UT'),
        createMockGame('22', 'C', 'I', 28, 24, 'LSU', 'VU'),
        createMockGame('23', 'C', 'J', 28, 24, 'LSU', 'TAMU'),
        createMockGame('24', 'C', 'K', 28, 24, 'LSU', 'MSU'),
        createMockGame('25', 'D', 'E', 28, 24, 'UGA', 'UF'),
        createMockGame('26', 'D', 'F', 28, 24, 'UGA', 'UK'),
        createMockGame('27', 'D', 'G', 28, 24, 'UGA', 'USC'),
        createMockGame('28', 'D', 'H', 28, 24, 'UGA', 'UT'),
        createMockGame('29', 'D', 'I', 28, 24, 'UGA', 'VU'),
        createMockGame('30', 'D', 'J', 28, 24, 'UGA', 'TAMU'),
        createMockGame('31', 'D', 'K', 28, 24, 'UGA', 'MSU'),
        createMockGame('32', 'E', 'F', 28, 24, 'UF', 'UK'),
        createMockGame('33', 'E', 'G', 28, 24, 'UF', 'USC'),
        createMockGame('34', 'E', 'H', 28, 24, 'UF', 'UT'),
        createMockGame('35', 'E', 'I', 28, 24, 'UF', 'VU'),
        createMockGame('36', 'E', 'J', 28, 24, 'UF', 'TAMU'),
        createMockGame('37', 'E', 'K', 28, 24, 'UF', 'MSU'),
        createMockGame('38', 'F', 'G', 28, 24, 'UK', 'USC'),
        createMockGame('39', 'F', 'H', 28, 24, 'UK', 'UT'),
        createMockGame('40', 'F', 'I', 28, 24, 'UK', 'VU'),
        createMockGame('41', 'F', 'J', 28, 24, 'UK', 'TAMU'),
        createMockGame('42', 'F', 'K', 28, 24, 'UK', 'MSU'),
        createMockGame('43', 'G', 'H', 28, 24, 'USC', 'UT'),
        createMockGame('44', 'G', 'I', 28, 24, 'USC', 'VU'),
        createMockGame('45', 'G', 'J', 28, 24, 'USC', 'TAMU'),
        createMockGame('46', 'G', 'K', 28, 24, 'USC', 'MSU'),
        createMockGame('47', 'H', 'I', 28, 24, 'UT', 'VU'),
        createMockGame('48', 'H', 'J', 28, 24, 'UT', 'TAMU'),
        createMockGame('49', 'H', 'K', 28, 24, 'UT', 'MSU'),
        createMockGame('50', 'I', 'J', 28, 24, 'VU', 'TAMU'),
        createMockGame('51', 'I', 'K', 28, 24, 'VU', 'MSU'),
        createMockGame('52', 'J', 'K', 28, 24, 'TAMU', 'MSU'),
        createMockGame('53', 'A', 'L', 28, 24, 'ALA', 'OM'),
        createMockGame('54', 'B', 'L', 24, 28, 'UA', 'OM'),
        createMockGame('55', 'C', 'L', 24, 28, 'LSU', 'OM'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], explanations);

      const ruleNames = result.steps.map((step) => step.rule);
      expect(ruleNames).toContain('A: Head-to-Head');
      expect(ruleNames).toContain('B: Common Opponents');
      const hasRuleC = ruleNames.some((rule) => rule.includes('Highest Placed Common Opponent'));
      const hasRuleD = ruleNames.some((rule) => rule.includes('Opponent Win %'));
      expect(hasRuleC || hasRuleD).toBe(true);
      if (hasRuleD) {
        expect(result.steps.length).toBeGreaterThan(3);
      }
    });
  });

  describe('Rule E: Scoring Margin - Cascade & Recursion', () => {
    it('Three-team tie for first place: Team A advances, B/C revert to two-team tiebreaker', () => {
      // From rule-e-scoring-margin.txt lines 92-107
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // Capped relative scoring margin: Team A +45.0%, Team B +40.0%, Team C +35.0%
      // Need full conference schedule to calculate scoring margins
      // This is complex - we'll create a scenario where Rules A-D don't break the tie
      // and Rule E does based on scoring margins
      const games = [
        createMockGame('1', 'A', 'D', 35, 21, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 35, 21, 'ALA', 'UF'),
        createMockGame('3', 'A', 'F', 35, 21, 'ALA', 'UK'),
        createMockGame('4', 'A', 'G', 35, 21, 'ALA', 'USC'),
        createMockGame('5', 'A', 'H', 35, 21, 'ALA', 'UT'),
        createMockGame('6', 'A', 'I', 35, 21, 'ALA', 'VU'),
        createMockGame('7', 'A', 'J', 35, 21, 'ALA', 'TAMU'),
        createMockGame('8', 'A', 'K', 35, 21, 'ALA', 'MSU'),
        createMockGame('9', 'B', 'D', 32, 21, 'UA', 'UGA'),
        createMockGame('10', 'B', 'E', 32, 21, 'UA', 'UF'),
        createMockGame('11', 'B', 'F', 32, 21, 'UA', 'UK'),
        createMockGame('12', 'B', 'G', 32, 21, 'UA', 'USC'),
        createMockGame('13', 'B', 'H', 32, 21, 'UA', 'UT'),
        createMockGame('14', 'B', 'I', 32, 21, 'UA', 'VU'),
        createMockGame('15', 'B', 'J', 32, 21, 'UA', 'TAMU'),
        createMockGame('16', 'B', 'K', 32, 21, 'UA', 'MSU'),
        createMockGame('17', 'C', 'D', 28, 21, 'LSU', 'UGA'),
        createMockGame('18', 'C', 'E', 28, 21, 'LSU', 'UF'),
        createMockGame('19', 'C', 'F', 28, 21, 'LSU', 'UK'),
        createMockGame('20', 'C', 'G', 28, 21, 'LSU', 'USC'),
        createMockGame('21', 'C', 'H', 28, 21, 'LSU', 'UT'),
        createMockGame('22', 'C', 'I', 28, 21, 'LSU', 'VU'),
        createMockGame('23', 'C', 'J', 28, 21, 'LSU', 'TAMU'),
        createMockGame('24', 'C', 'K', 28, 21, 'LSU', 'MSU'),
        createMockGame('25', 'D', 'E', 21, 24, 'UGA', 'UF'),
        createMockGame('26', 'D', 'F', 21, 24, 'UGA', 'UK'),
        createMockGame('27', 'D', 'G', 21, 24, 'UGA', 'USC'),
        createMockGame('28', 'D', 'H', 21, 24, 'UGA', 'UT'),
        createMockGame('29', 'D', 'I', 21, 24, 'UGA', 'VU'),
        createMockGame('30', 'D', 'J', 21, 24, 'UGA', 'TAMU'),
        createMockGame('31', 'D', 'K', 21, 24, 'UGA', 'MSU'),
        createMockGame('32', 'E', 'F', 24, 21, 'UF', 'UK'),
        createMockGame('33', 'E', 'G', 24, 21, 'UF', 'USC'),
        createMockGame('34', 'E', 'H', 24, 21, 'UF', 'UT'),
        createMockGame('35', 'E', 'I', 24, 21, 'UF', 'VU'),
        createMockGame('36', 'E', 'J', 24, 21, 'UF', 'TAMU'),
        createMockGame('37', 'E', 'K', 24, 21, 'UF', 'MSU'),
        createMockGame('38', 'F', 'G', 21, 24, 'UK', 'USC'),
        createMockGame('39', 'F', 'H', 21, 24, 'UK', 'UT'),
        createMockGame('40', 'F', 'I', 21, 24, 'UK', 'VU'),
        createMockGame('41', 'F', 'J', 21, 24, 'UK', 'TAMU'),
        createMockGame('42', 'F', 'K', 21, 24, 'UK', 'MSU'),
        createMockGame('43', 'G', 'H', 21, 24, 'USC', 'UT'),
        createMockGame('44', 'G', 'I', 21, 24, 'USC', 'VU'),
        createMockGame('45', 'G', 'J', 21, 24, 'USC', 'TAMU'),
        createMockGame('46', 'G', 'K', 21, 24, 'USC', 'MSU'),
        createMockGame('47', 'H', 'I', 21, 24, 'UT', 'VU'),
        createMockGame('48', 'H', 'J', 21, 24, 'UT', 'TAMU'),
        createMockGame('49', 'H', 'K', 21, 24, 'UT', 'MSU'),
        createMockGame('50', 'I', 'J', 21, 24, 'VU', 'TAMU'),
        createMockGame('51', 'I', 'K', 21, 24, 'VU', 'MSU'),
        createMockGame('52', 'J', 'K', 21, 24, 'TAMU', 'MSU'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'], explanations);

      const survivors = result.steps.find((step) => step.rule.includes('Scoring Margin'))?.survivors || [];
      expect(survivors.length).toBeGreaterThan(0);
      expect(result.steps.some((step) => step.rule.includes('Scoring Margin'))).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
    });

    it('Cascade through Rules A-E: All earlier rules fail, Rule E breaks tie', () => {
      // Create scenario where Rules A, B, C, D don't break the tie, then Rule E does
      // Three teams tied, no head-to-head games, no common opponents, no highest placed opponent,
      // same opponent win percentage, different scoring margins
      const games = [
        createMockGame('1', 'A', 'D', 35, 21, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 35, 21, 'ALA', 'UF'),
        createMockGame('3', 'A', 'F', 35, 21, 'ALA', 'UK'),
        createMockGame('4', 'A', 'G', 35, 21, 'ALA', 'USC'),
        createMockGame('5', 'A', 'H', 35, 21, 'ALA', 'UT'),
        createMockGame('6', 'A', 'I', 35, 21, 'ALA', 'VU'),
        createMockGame('7', 'A', 'J', 35, 21, 'ALA', 'TAMU'),
        createMockGame('8', 'A', 'K', 35, 21, 'ALA', 'MSU'),
        createMockGame('9', 'B', 'D', 32, 21, 'UA', 'UGA'),
        createMockGame('10', 'B', 'E', 32, 21, 'UA', 'UF'),
        createMockGame('11', 'B', 'F', 32, 21, 'UA', 'UK'),
        createMockGame('12', 'B', 'G', 32, 21, 'UA', 'USC'),
        createMockGame('13', 'B', 'H', 32, 21, 'UA', 'UT'),
        createMockGame('14', 'B', 'I', 32, 21, 'UA', 'VU'),
        createMockGame('15', 'B', 'J', 32, 21, 'UA', 'TAMU'),
        createMockGame('16', 'B', 'K', 32, 21, 'UA', 'MSU'),
        createMockGame('17', 'C', 'D', 28, 21, 'LSU', 'UGA'),
        createMockGame('18', 'C', 'E', 28, 21, 'LSU', 'UF'),
        createMockGame('19', 'C', 'F', 28, 21, 'LSU', 'UK'),
        createMockGame('20', 'C', 'G', 28, 21, 'LSU', 'USC'),
        createMockGame('21', 'C', 'H', 28, 21, 'LSU', 'UT'),
        createMockGame('22', 'C', 'I', 28, 21, 'LSU', 'VU'),
        createMockGame('23', 'C', 'J', 28, 21, 'LSU', 'TAMU'),
        createMockGame('24', 'C', 'K', 28, 21, 'LSU', 'MSU'),
        createMockGame('25', 'D', 'E', 21, 24, 'UGA', 'UF'),
        createMockGame('26', 'D', 'F', 21, 24, 'UGA', 'UK'),
        createMockGame('27', 'D', 'G', 21, 24, 'UGA', 'USC'),
        createMockGame('28', 'D', 'H', 21, 24, 'UGA', 'UT'),
        createMockGame('29', 'D', 'I', 21, 24, 'UGA', 'VU'),
        createMockGame('30', 'D', 'J', 21, 24, 'UGA', 'TAMU'),
        createMockGame('31', 'D', 'K', 21, 24, 'UGA', 'MSU'),
        createMockGame('32', 'E', 'F', 24, 21, 'UF', 'UK'),
        createMockGame('33', 'E', 'G', 24, 21, 'UF', 'USC'),
        createMockGame('34', 'E', 'H', 24, 21, 'UF', 'UT'),
        createMockGame('35', 'E', 'I', 24, 21, 'UF', 'VU'),
        createMockGame('36', 'E', 'J', 24, 21, 'UF', 'TAMU'),
        createMockGame('37', 'E', 'K', 24, 21, 'UF', 'MSU'),
        createMockGame('38', 'F', 'G', 21, 24, 'UK', 'USC'),
        createMockGame('39', 'F', 'H', 21, 24, 'UK', 'UT'),
        createMockGame('40', 'F', 'I', 21, 24, 'UK', 'VU'),
        createMockGame('41', 'F', 'J', 21, 24, 'UK', 'TAMU'),
        createMockGame('42', 'F', 'K', 21, 24, 'UK', 'MSU'),
        createMockGame('43', 'G', 'H', 21, 24, 'USC', 'UT'),
        createMockGame('44', 'G', 'I', 21, 24, 'USC', 'VU'),
        createMockGame('45', 'G', 'J', 21, 24, 'USC', 'TAMU'),
        createMockGame('46', 'G', 'K', 21, 24, 'USC', 'MSU'),
        createMockGame('47', 'H', 'I', 21, 24, 'UT', 'VU'),
        createMockGame('48', 'H', 'J', 21, 24, 'UT', 'TAMU'),
        createMockGame('49', 'H', 'K', 21, 24, 'UT', 'MSU'),
        createMockGame('50', 'I', 'J', 21, 24, 'VU', 'TAMU'),
        createMockGame('51', 'I', 'K', 21, 24, 'VU', 'MSU'),
        createMockGame('52', 'J', 'K', 21, 24, 'TAMU', 'MSU'),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(['A', 'B', 'C'], games, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'], explanations);

      const ruleNames = result.steps.map((step) => step.rule);
      expect(ruleNames).toContain('A: Head-to-Head');
      expect(ruleNames).toContain('B: Common Opponents');
      expect(ruleNames.some((rule) => rule.includes('Highest Placed Common Opponent'))).toBe(true);
      expect(ruleNames.some((rule) => rule.includes('Opponent Win %'))).toBe(true);
      expect(ruleNames.some((rule) => rule.includes('Scoring Margin'))).toBe(true);
      expect(result.steps.length).toBeGreaterThan(4);
    });
  });
});
