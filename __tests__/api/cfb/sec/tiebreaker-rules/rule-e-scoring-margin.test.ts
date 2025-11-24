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

import { applyRuleEScoringMargin } from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
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

  describe('Calculation Formula Validation', () => {
    it('Validates exact calculation formula from official example: Team A 31-28 vs Team B produces +30.9% margin', () => {
      // From rule-e-scoring-margin.txt lines 43-61 (Appendix A example):
      // - Week 1: Team A defeats Team B 31-28
      // - Team B averaged 24 points scored per game for the season
      // - Team B averaged 21 points allowed per game for the season
      // - Calculation:
      //   - Offense: (31/21)*100 = 147.6%
      //   - Defense: (28/24)*100 = 116.7%
      //   - Margin: 147.6% - 116.7% = +30.9%
      //
      // To validate the formula, we set up:
      // - Team A plays only Team B (31-28 win, so Team A scored 31, Team B scored 28)
      // - Team B plays 8 games total to establish averages:
      //   - 24 points scored per game average (8 games * 24 = 192 total points scored)
      //   - 21 points allowed per game average (8 games * 21 = 168 total points allowed)
      // - Team B vs A: scored 28, allowed 31
      // - For other 7 games: need 192 - 28 = 164 points scored, 168 - 31 = 137 points allowed
      // - Solution: 4 games with 23 scored/19 allowed, 3 games with 24 scored/20 allowed
      //   - Scored: 4*23 + 3*24 = 92 + 72 = 164 ✓
      //   - Allowed: 4*19 + 3*20 = 76 + 60 = 136 (need 137, close enough - will be 20.875 avg)
      //   - Actually: 3*19 + 4*20 = 57 + 80 = 137 ✓
      //   - So: 3 games with 23 scored/19 allowed, 4 games with 24 scored/20 allowed
      //   - Scored: 3*23 + 4*24 = 69 + 96 = 165 (1 off, but close)
      //   - Let's use: 1 game 22/19, 2 games 23/19, 4 games 24/20
      //   - Scored: 22 + 46 + 96 = 164 ✓
      //   - Allowed: 19 + 38 + 80 = 137 ✓
      const games = [
        // The key game: Team A defeats Team B 31-28
        // Team A (home) scored 31, Team B (away) scored 28
        createMockGame('1', 'A', 'B', 31, 28, 'ALA', 'UA'),
        // Team B's other 7 games to establish season averages
        // Need: 164 points scored, 137 points allowed
        // Solution: 1 game 22/19, 2 games 23/19, 4 games 24/20
        // Total scored: 28 + 22 + 46 + 96 = 192, avg = 24 ✓
        // Total allowed: 31 + 19 + 38 + 80 = 168, avg = 21 ✓
        createMockGame('2', 'B', 'C', 22, 19, 'UA', 'LSU'),
        createMockGame('3', 'B', 'D', 23, 19, 'UA', 'UGA'),
        createMockGame('4', 'B', 'E', 23, 19, 'UA', 'TENN'),
        createMockGame('5', 'B', 'F', 24, 20, 'UA', 'FLA'),
        createMockGame('6', 'B', 'G', 24, 20, 'UA', 'AUB'),
        createMockGame('7', 'B', 'H', 24, 20, 'UA', 'ARK'),
        createMockGame('8', 'B', 'I', 24, 20, 'UA', 'TEX'),
        // Additional games to complete the conference schedule
        // (needed so averages are calculated correctly)
        // Additional games to complete the conference schedule
        // (needed so averages are calculated correctly)
        createMockGame('9', 'C', 'D', 19, 22, 'LSU', 'UGA'),
        createMockGame('10', 'C', 'E', 19, 23, 'LSU', 'TENN'),
        createMockGame('11', 'C', 'F', 20, 24, 'LSU', 'FLA'),
        createMockGame('12', 'C', 'G', 20, 24, 'LSU', 'AUB'),
        createMockGame('13', 'C', 'H', 20, 24, 'LSU', 'ARK'),
        createMockGame('14', 'C', 'I', 20, 24, 'LSU', 'TEX'),
        createMockGame('15', 'D', 'E', 19, 23, 'UGA', 'TENN'),
        createMockGame('16', 'D', 'F', 20, 24, 'UGA', 'FLA'),
        createMockGame('17', 'D', 'G', 20, 24, 'UGA', 'AUB'),
        createMockGame('18', 'D', 'H', 20, 24, 'UGA', 'ARK'),
        createMockGame('19', 'D', 'I', 20, 24, 'UGA', 'TEX'),
        createMockGame('20', 'E', 'F', 20, 24, 'TENN', 'FLA'),
        createMockGame('21', 'E', 'G', 20, 24, 'TENN', 'AUB'),
        createMockGame('22', 'E', 'H', 20, 24, 'TENN', 'ARK'),
        createMockGame('23', 'E', 'I', 20, 24, 'TENN', 'TEX'),
        createMockGame('24', 'F', 'G', 24, 20, 'FLA', 'AUB'),
        createMockGame('25', 'F', 'H', 24, 20, 'FLA', 'ARK'),
        createMockGame('26', 'F', 'I', 24, 20, 'FLA', 'TEX'),
        createMockGame('27', 'G', 'H', 20, 24, 'AUB', 'ARK'),
        createMockGame('28', 'G', 'I', 20, 24, 'AUB', 'TEX'),
        createMockGame('29', 'H', 'I', 24, 20, 'ARK', 'TEX'),
        // Add Team Z with a lower margin to ensure Team A wins
        // Team Z plays one game: scores 20, allows 20 vs opponent that averages 20 scored/20 allowed
        // Margin: (20/20)*100 - (20/20)*100 = 100 - 100 = 0%
        createMockGame('30', 'Z', 'J', 20, 20, 'VAND', 'OKLA'),
        createMockGame('31', 'J', 'K', 20, 20, 'OKLA', 'MISS'),
      ];

      // Need at least 2 teams for the function to work (it returns early if < 2)
      // Team Z has 0% margin, Team A should have ~30.9% margin, so Team A wins
      const result = applyRuleEScoringMargin(['A', 'Z'], games);

      // Team A only plays Team B, so the margin for that game is the average margin
      // Expected calculation from official example:
      // - Offense: (31/21)*100 = 147.619...% (capped at 200%, so 147.619%)
      // - Defense: (28/24)*100 = 116.666...%
      // - Margin: 147.619 - 116.666 = 30.952...%
      // Official example states: +30.9%
      expect(result.detail).toContain('Best relative scoring margin');
      // Extract the margin value from the detail string
      const marginMatch = result.detail.match(/margin: ([\d.-]+)/);
      expect(marginMatch).toBeTruthy();
      if (marginMatch) {
        const margin = parseFloat(marginMatch[1]);
        // Should be approximately +30.9% (allowing for floating point precision)
        // The exact value is 30.952..., so we check it's close to 30.95
        expect(margin).toBeCloseTo(30.95, 1);
      }
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
