/**
 * SEC Tiebreaker Rule E: Capped Relative Total Scoring Margin - Unit Tests
 *
 * Tests extracted directly from the official SEC tiebreaker rules document.
 * Rule E: Capped relative total scoring margin per SportSource Analytics versus
 * all Conference opponents among the tied teams
 *
 * Rules document specifies:
 * - Each team has 6-2 conference record (8 conference games)
 * - Team A: +45.0% scoring margin
 * - Team B: +40.0% scoring margin
 * - Team C: +35.0% scoring margin
 * - Team A advances to the championship game
 */

import { applyRuleEScoringMargin } from '@/lib/tiebreaker-helpers';
import { createMockGame } from './test-helpers';

describe('SEC Tiebreaker Rules - Rule E: Capped Relative Total Scoring Margin', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A +45.0%, Team B +40.0%, Team A advances', () => {
      // Rules document (lines 77-89):
      // - Conference records: Team A 6-2, Team B 6-2
      // - Capped relative scoring margin calculated from all 8 Conference games
      // - Team A: +45.0%, Team B: +40.0%
      // - Team A advances to the championship game
      const games = [
        // Team A: 8 conference games (6-2 record)
        createMockGame('1', 'A', 'C', 35, 28, 'ALA', 'LSU'),
        createMockGame('2', 'A', 'D', 42, 21, 'ALA', 'UGA'),
        createMockGame('3', 'A', 'E', 35, 28, 'ALA', 'TENN'),
        createMockGame('4', 'A', 'F', 38, 24, 'ALA', 'FLA'),
        createMockGame('5', 'A', 'G', 35, 21, 'ALA', 'AUB'),
        createMockGame('6', 'A', 'H', 42, 28, 'ALA', 'ARK'),
        createMockGame('7', 'A', 'I', 24, 28, 'ALA', 'TEX'),
        createMockGame('8', 'A', 'J', 21, 28, 'ALA', 'OKLA'),
        // Team B: 8 conference games (6-2 record)
        createMockGame('9', 'B', 'C', 31, 24, 'UA', 'LSU'),
        createMockGame('10', 'B', 'D', 35, 28, 'UA', 'UGA'),
        createMockGame('11', 'B', 'E', 31, 24, 'UA', 'TENN'),
        createMockGame('12', 'B', 'F', 35, 28, 'UA', 'FLA'),
        createMockGame('13', 'B', 'G', 31, 24, 'UA', 'AUB'),
        createMockGame('14', 'B', 'H', 35, 28, 'UA', 'ARK'),
        createMockGame('15', 'B', 'I', 24, 31, 'UA', 'TEX'),
        createMockGame('16', 'B', 'K', 21, 28, 'UA', 'MISS'),
        // Additional games to establish opponent season averages (required for scoring margin calculation)
        createMockGame('17', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('18', 'C', 'E', 28, 24, 'LSU', 'TENN'),
        createMockGame('19', 'C', 'F', 24, 28, 'LSU', 'FLA'),
        createMockGame('20', 'C', 'G', 28, 24, 'LSU', 'AUB'),
        createMockGame('21', 'C', 'H', 24, 28, 'LSU', 'ARK'),
        createMockGame('22', 'C', 'I', 24, 28, 'LSU', 'TEX'),
        createMockGame('23', 'C', 'J', 24, 28, 'LSU', 'OKLA'),
        createMockGame('24', 'C', 'K', 24, 28, 'LSU', 'MISS'),
        createMockGame('25', 'D', 'E', 28, 24, 'UGA', 'TENN'),
        createMockGame('26', 'D', 'F', 28, 24, 'UGA', 'FLA'),
        createMockGame('27', 'D', 'G', 28, 24, 'UGA', 'AUB'),
        createMockGame('28', 'D', 'H', 28, 24, 'UGA', 'ARK'),
        createMockGame('29', 'D', 'I', 24, 28, 'UGA', 'TEX'),
        createMockGame('30', 'D', 'J', 24, 28, 'UGA', 'OKLA'),
        createMockGame('31', 'D', 'K', 24, 28, 'UGA', 'MISS'),
        createMockGame('32', 'E', 'F', 28, 24, 'TENN', 'FLA'),
        createMockGame('33', 'E', 'G', 28, 24, 'TENN', 'AUB'),
        createMockGame('34', 'E', 'H', 28, 24, 'TENN', 'ARK'),
        createMockGame('35', 'E', 'I', 24, 28, 'TENN', 'TEX'),
        createMockGame('36', 'E', 'J', 24, 28, 'TENN', 'OKLA'),
        createMockGame('37', 'E', 'K', 24, 28, 'TENN', 'MISS'),
        createMockGame('38', 'F', 'G', 28, 24, 'FLA', 'AUB'),
        createMockGame('39', 'F', 'H', 28, 24, 'FLA', 'ARK'),
        createMockGame('40', 'F', 'I', 24, 28, 'FLA', 'TEX'),
        createMockGame('41', 'F', 'J', 24, 28, 'FLA', 'OKLA'),
        createMockGame('42', 'F', 'K', 24, 28, 'FLA', 'MISS'),
        createMockGame('43', 'G', 'H', 28, 24, 'AUB', 'ARK'),
        createMockGame('44', 'G', 'I', 24, 28, 'AUB', 'TEX'),
        createMockGame('45', 'G', 'J', 24, 28, 'AUB', 'OKLA'),
        createMockGame('46', 'G', 'K', 24, 28, 'AUB', 'MISS'),
        createMockGame('47', 'H', 'I', 24, 28, 'ARK', 'TEX'),
        createMockGame('48', 'H', 'J', 24, 28, 'ARK', 'OKLA'),
        createMockGame('49', 'H', 'K', 24, 28, 'ARK', 'MISS'),
        createMockGame('50', 'I', 'J', 28, 24, 'TEX', 'OKLA'),
        createMockGame('51', 'I', 'K', 28, 24, 'TEX', 'MISS'),
        createMockGame('52', 'J', 'K', 28, 24, 'OKLA', 'MISS'),
      ];

      const result = applyRuleEScoringMargin(['A', 'B'], games);

      // Rules document line 89: Team A advances to the championship game
      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
    });
  });

  describe('Three-Team Tie (or More) for First Place', () => {
    it('Example: Team A +45.0%, Team B +40.0%, Team C +35.0%; Team A advances', () => {
      // Rules document (lines 92-107):
      // - Conference records: Team A 6-2, Team B 6-2, Team C 6-2
      // - Capped relative scoring margin calculated from all 8 Conference games
      // - Team A: +45.0%, Team B: +40.0%, Team C: +35.0%
      // - Team A advances to the championship game
      // - Team B and Team C revert to the beginning of the two-team tiebreaker procedures for second place
      const games = [
        // Team A: 8 conference games (6-2 record)
        createMockGame('1', 'A', 'D', 42, 21, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 35, 28, 'ALA', 'TENN'),
        createMockGame('3', 'A', 'F', 38, 24, 'ALA', 'FLA'),
        createMockGame('4', 'A', 'G', 35, 21, 'ALA', 'AUB'),
        createMockGame('5', 'A', 'H', 42, 28, 'ALA', 'ARK'),
        createMockGame('6', 'A', 'I', 35, 24, 'ALA', 'TEX'),
        createMockGame('7', 'A', 'J', 24, 28, 'ALA', 'OKLA'),
        createMockGame('8', 'A', 'K', 21, 28, 'ALA', 'MISS'),
        // Team B: 8 conference games (6-2 record)
        createMockGame('9', 'B', 'D', 35, 28, 'UA', 'UGA'),
        createMockGame('10', 'B', 'E', 31, 24, 'UA', 'TENN'),
        createMockGame('11', 'B', 'F', 35, 28, 'UA', 'FLA'),
        createMockGame('12', 'B', 'G', 31, 24, 'UA', 'AUB'),
        createMockGame('13', 'B', 'H', 35, 28, 'UA', 'ARK'),
        createMockGame('14', 'B', 'I', 31, 24, 'UA', 'TEX'),
        createMockGame('15', 'B', 'J', 24, 31, 'UA', 'OKLA'),
        createMockGame('16', 'B', 'K', 21, 28, 'UA', 'MISS'),
        // Team C: 8 conference games (6-2 record)
        createMockGame('17', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('18', 'C', 'E', 28, 24, 'LSU', 'TENN'),
        createMockGame('19', 'C', 'F', 28, 24, 'LSU', 'FLA'),
        createMockGame('20', 'C', 'G', 28, 24, 'LSU', 'AUB'),
        createMockGame('21', 'C', 'H', 28, 24, 'LSU', 'ARK'),
        createMockGame('22', 'C', 'I', 28, 24, 'LSU', 'TEX'),
        createMockGame('23', 'C', 'J', 24, 28, 'LSU', 'OKLA'),
        createMockGame('24', 'C', 'K', 21, 28, 'LSU', 'MISS'),
        // Additional games to establish opponent season averages (required for scoring margin calculation)
        createMockGame('25', 'D', 'E', 28, 24, 'UGA', 'TENN'),
        createMockGame('26', 'D', 'F', 28, 24, 'UGA', 'FLA'),
        createMockGame('27', 'D', 'G', 28, 24, 'UGA', 'AUB'),
        createMockGame('28', 'D', 'H', 28, 24, 'UGA', 'ARK'),
        createMockGame('29', 'D', 'I', 24, 28, 'UGA', 'TEX'),
        createMockGame('30', 'D', 'J', 24, 28, 'UGA', 'OKLA'),
        createMockGame('31', 'D', 'K', 24, 28, 'UGA', 'MISS'),
        createMockGame('32', 'E', 'F', 28, 24, 'TENN', 'FLA'),
        createMockGame('33', 'E', 'G', 28, 24, 'TENN', 'AUB'),
        createMockGame('34', 'E', 'H', 28, 24, 'TENN', 'ARK'),
        createMockGame('35', 'E', 'I', 24, 28, 'TENN', 'TEX'),
        createMockGame('36', 'E', 'J', 24, 28, 'TENN', 'OKLA'),
        createMockGame('37', 'E', 'K', 24, 28, 'TENN', 'MISS'),
        createMockGame('38', 'F', 'G', 28, 24, 'FLA', 'AUB'),
        createMockGame('39', 'F', 'H', 28, 24, 'FLA', 'ARK'),
        createMockGame('40', 'F', 'I', 24, 28, 'FLA', 'TEX'),
        createMockGame('41', 'F', 'J', 24, 28, 'FLA', 'OKLA'),
        createMockGame('42', 'F', 'K', 24, 28, 'FLA', 'MISS'),
        createMockGame('43', 'G', 'H', 28, 24, 'AUB', 'ARK'),
        createMockGame('44', 'G', 'I', 24, 28, 'AUB', 'TEX'),
        createMockGame('45', 'G', 'J', 24, 28, 'AUB', 'OKLA'),
        createMockGame('46', 'G', 'K', 24, 28, 'AUB', 'MISS'),
        createMockGame('47', 'H', 'I', 24, 28, 'ARK', 'TEX'),
        createMockGame('48', 'H', 'J', 24, 28, 'ARK', 'OKLA'),
        createMockGame('49', 'H', 'K', 24, 28, 'ARK', 'MISS'),
        createMockGame('50', 'I', 'J', 28, 24, 'TEX', 'OKLA'),
        createMockGame('51', 'I', 'K', 28, 24, 'TEX', 'MISS'),
        createMockGame('52', 'J', 'K', 28, 24, 'OKLA', 'MISS'),
      ];

      const result = applyRuleEScoringMargin(['A', 'B', 'C'], games);

      // Rules document line 106: Team A advances to the championship game
      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
      // Rules document line 107: Team B and Team C revert to the beginning of the two-team tiebreaker procedures for second place
      // (This is handled by the tiebreaker engine, not this rule function)
    });
  });

  describe('Three-Team Tie (or More) for Second Place', () => {
    it('Example: Team A +45.0%, Team B +40.0%, Team C +35.0%; Team A advances', () => {
      // Rules document (lines 110-124):
      // - Conference records: Team A 6-2, Team B 6-2, Team C 6-2
      // - Capped relative scoring margin calculated from all 8 Conference games
      // - Team A: +45.0%, Team B: +40.0%, Team C: +35.0%
      // - Team A advances to the championship game
      const games = [
        // Team A: 8 conference games (6-2 record)
        createMockGame('1', 'A', 'D', 42, 21, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 35, 28, 'ALA', 'TENN'),
        createMockGame('3', 'A', 'F', 38, 24, 'ALA', 'FLA'),
        createMockGame('4', 'A', 'G', 35, 21, 'ALA', 'AUB'),
        createMockGame('5', 'A', 'H', 42, 28, 'ALA', 'ARK'),
        createMockGame('6', 'A', 'I', 35, 24, 'ALA', 'TEX'),
        createMockGame('7', 'A', 'J', 24, 28, 'ALA', 'OKLA'),
        createMockGame('8', 'A', 'K', 21, 28, 'ALA', 'MISS'),
        // Team B: 8 conference games (6-2 record)
        createMockGame('9', 'B', 'D', 35, 28, 'UA', 'UGA'),
        createMockGame('10', 'B', 'E', 31, 24, 'UA', 'TENN'),
        createMockGame('11', 'B', 'F', 35, 28, 'UA', 'FLA'),
        createMockGame('12', 'B', 'G', 31, 24, 'UA', 'AUB'),
        createMockGame('13', 'B', 'H', 35, 28, 'UA', 'ARK'),
        createMockGame('14', 'B', 'I', 31, 24, 'UA', 'TEX'),
        createMockGame('15', 'B', 'J', 24, 31, 'UA', 'OKLA'),
        createMockGame('16', 'B', 'K', 21, 28, 'UA', 'MISS'),
        // Team C: 8 conference games (6-2 record)
        createMockGame('17', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('18', 'C', 'E', 28, 24, 'LSU', 'TENN'),
        createMockGame('19', 'C', 'F', 28, 24, 'LSU', 'FLA'),
        createMockGame('20', 'C', 'G', 28, 24, 'LSU', 'AUB'),
        createMockGame('21', 'C', 'H', 28, 24, 'LSU', 'ARK'),
        createMockGame('22', 'C', 'I', 28, 24, 'LSU', 'TEX'),
        createMockGame('23', 'C', 'J', 24, 28, 'LSU', 'OKLA'),
        createMockGame('24', 'C', 'K', 21, 28, 'LSU', 'MISS'),
        // Additional games to establish opponent season averages (required for scoring margin calculation)
        createMockGame('25', 'D', 'E', 28, 24, 'UGA', 'TENN'),
        createMockGame('26', 'D', 'F', 28, 24, 'UGA', 'FLA'),
        createMockGame('27', 'D', 'G', 28, 24, 'UGA', 'AUB'),
        createMockGame('28', 'D', 'H', 28, 24, 'UGA', 'ARK'),
        createMockGame('29', 'D', 'I', 24, 28, 'UGA', 'TEX'),
        createMockGame('30', 'D', 'J', 24, 28, 'UGA', 'OKLA'),
        createMockGame('31', 'D', 'K', 24, 28, 'UGA', 'MISS'),
        createMockGame('32', 'E', 'F', 28, 24, 'TENN', 'FLA'),
        createMockGame('33', 'E', 'G', 28, 24, 'TENN', 'AUB'),
        createMockGame('34', 'E', 'H', 28, 24, 'TENN', 'ARK'),
        createMockGame('35', 'E', 'I', 24, 28, 'TENN', 'TEX'),
        createMockGame('36', 'E', 'J', 24, 28, 'TENN', 'OKLA'),
        createMockGame('37', 'E', 'K', 24, 28, 'TENN', 'MISS'),
        createMockGame('38', 'F', 'G', 28, 24, 'FLA', 'AUB'),
        createMockGame('39', 'F', 'H', 28, 24, 'FLA', 'ARK'),
        createMockGame('40', 'F', 'I', 24, 28, 'FLA', 'TEX'),
        createMockGame('41', 'F', 'J', 24, 28, 'FLA', 'OKLA'),
        createMockGame('42', 'F', 'K', 24, 28, 'FLA', 'MISS'),
        createMockGame('43', 'G', 'H', 28, 24, 'AUB', 'ARK'),
        createMockGame('44', 'G', 'I', 24, 28, 'AUB', 'TEX'),
        createMockGame('45', 'G', 'J', 24, 28, 'AUB', 'OKLA'),
        createMockGame('46', 'G', 'K', 24, 28, 'AUB', 'MISS'),
        createMockGame('47', 'H', 'I', 24, 28, 'ARK', 'TEX'),
        createMockGame('48', 'H', 'J', 24, 28, 'ARK', 'OKLA'),
        createMockGame('49', 'H', 'K', 24, 28, 'ARK', 'MISS'),
        createMockGame('50', 'I', 'J', 28, 24, 'TEX', 'OKLA'),
        createMockGame('51', 'I', 'K', 28, 24, 'TEX', 'MISS'),
        createMockGame('52', 'J', 'K', 28, 24, 'OKLA', 'MISS'),
      ];

      const result = applyRuleEScoringMargin(['A', 'B', 'C'], games);

      // Rules document line 124: Team A advances to the championship game
      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });
});

