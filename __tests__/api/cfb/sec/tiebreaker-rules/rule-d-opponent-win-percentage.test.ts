/**
 * SEC Tiebreaker Rule D: Cumulative Conference Winning Percentage - Unit Tests
 *
 * Tests extracted directly from the official SEC tiebreaker rules document.
 * Rule D: Cumulative Conference winning percentage of all Conference opponents
 * among the tied teams
 */

import { applyRuleDOpponentWinPercentage } from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
import { createMockGame } from './test-helpers';

describe('SEC Tiebreaker Rules - Rule D: Cumulative Conference Winning Percentage', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A 52.5%, Team B 50.0%, Team A advances', () => {
      // Team A: 6-2 (wins vs C,D,E,F,G,H; loses vs I,J)
      // Team B: 6-2 (wins vs C,D,E,F,G,I; loses vs H,K)
      // Team A and B play different opponents: A plays J, B plays K
      // Opponents structured so Team A's opponents have better records than Team B's opponents
      const games = [
        // Team A games (6-2)
        createMockGame('1', 'A', 'C', 28, 24, 'ALA', 'LSU'),
        createMockGame('2', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('3', 'A', 'E', 28, 24, 'ALA', 'TENN'),
        createMockGame('4', 'A', 'F', 28, 24, 'ALA', 'FLA'),
        createMockGame('5', 'A', 'G', 28, 24, 'ALA', 'AUB'),
        createMockGame('6', 'A', 'H', 28, 24, 'ALA', 'ARK'),
        createMockGame('7', 'A', 'I', 17, 20, 'ALA', 'TEX'),
        createMockGame('8', 'A', 'J', 17, 20, 'ALA', 'OKLA'),
        // Team B games (6-2)
        createMockGame('9', 'B', 'C', 28, 24, 'UA', 'LSU'),
        createMockGame('10', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('11', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('12', 'B', 'F', 28, 24, 'UA', 'FLA'),
        createMockGame('13', 'B', 'G', 28, 24, 'UA', 'AUB'),
        createMockGame('14', 'B', 'H', 17, 20, 'UA', 'ARK'),
        createMockGame('15', 'B', 'I', 28, 24, 'UA', 'TEX'),
        createMockGame('16', 'B', 'K', 17, 20, 'UA', 'MISS'),
        // Additional games to establish opponent records
        // Opponents C, D, E, F, G (common to both, need consistent records)
        createMockGame('17', 'C', 'K', 28, 24, 'LSU', 'VAND'),
        createMockGame('18', 'C', 'L', 28, 24, 'LSU', 'SCAR'),
        createMockGame('19', 'D', 'K', 28, 24, 'UGA', 'VAND'),
        createMockGame('20', 'D', 'L', 28, 24, 'UGA', 'SCAR'),
        createMockGame('21', 'E', 'K', 28, 24, 'TENN', 'VAND'),
        createMockGame('22', 'E', 'L', 28, 24, 'TENN', 'SCAR'),
        createMockGame('23', 'F', 'K', 28, 24, 'FLA', 'VAND'),
        createMockGame('24', 'F', 'L', 28, 24, 'FLA', 'SCAR'),
        createMockGame('25', 'G', 'K', 28, 24, 'AUB', 'VAND'),
        createMockGame('26', 'G', 'L', 28, 24, 'AUB', 'SCAR'),
        // Opponent I (beat A, lost to B) - needs good record for Team A to have higher %
        createMockGame('27', 'I', 'K', 28, 24, 'TEX', 'VAND'),
        createMockGame('28', 'I', 'L', 28, 24, 'TEX', 'SCAR'),
        // Opponent H (lost to A, beat B) - needs weaker record
        createMockGame('29', 'H', 'K', 17, 20, 'ARK', 'VAND'),
        createMockGame('30', 'H', 'L', 17, 20, 'ARK', 'SCAR'),
        // Opponent J (beat A) - needs good record for Team A to have higher %
        createMockGame('31', 'J', 'K', 28, 24, 'OKLA', 'MISS'),
        createMockGame('32', 'J', 'L', 28, 24, 'OKLA', 'SCAR'),
        createMockGame('33', 'J', 'M', 28, 24, 'OKLA', 'VAND'),
        // Opponent K (beat B) - needs weaker record
        createMockGame('34', 'K', 'L', 17, 20, 'MISS', 'SCAR'),
        createMockGame('35', 'K', 'M', 17, 20, 'MISS', 'VAND'),
        // Games between opponents to establish better records for I vs H
        // I (beat A) needs better record than H (beat B) for Team A to have higher opponent win%
        createMockGame('36', 'I', 'C', 28, 24, 'TEX', 'LSU'),
        createMockGame('37', 'I', 'D', 28, 24, 'TEX', 'UGA'),
        createMockGame('38', 'I', 'E', 28, 24, 'TEX', 'TENN'),
        createMockGame('39', 'I', 'F', 28, 24, 'TEX', 'FLA'),
        createMockGame('40', 'I', 'G', 28, 24, 'TEX', 'AUB'),
        createMockGame('41', 'I', 'J', 28, 24, 'TEX', 'OKLA'),
        createMockGame('42', 'I', 'K', 28, 24, 'TEX', 'MISS'),
        createMockGame('43', 'I', 'L', 28, 24, 'TEX', 'SCAR'),
        createMockGame('44', 'I', 'M', 28, 24, 'TEX', 'VAND'),
        // H (beat B) needs weaker record
        createMockGame('45', 'H', 'C', 17, 20, 'ARK', 'LSU'),
        createMockGame('46', 'H', 'D', 17, 20, 'ARK', 'UGA'),
        createMockGame('47', 'H', 'E', 17, 20, 'ARK', 'TENN'),
        createMockGame('48', 'H', 'F', 17, 20, 'ARK', 'FLA'),
        createMockGame('49', 'H', 'G', 17, 20, 'ARK', 'AUB'),
        createMockGame('50', 'H', 'I', 17, 20, 'ARK', 'TEX'),
        createMockGame('51', 'H', 'K', 17, 20, 'ARK', 'MISS'),
        createMockGame('52', 'H', 'L', 17, 20, 'ARK', 'SCAR'),
        createMockGame('53', 'H', 'M', 17, 20, 'ARK', 'VAND'),
      ];

      const result = applyRuleDOpponentWinPercentage(['A', 'B'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
    });
  });

  describe('Three-Team Tie (or More) for First Place', () => {
    it('Example: Team A 52.5%, Team B 50.0%, Team C 47.5%; Team A advances', () => {
      // Team A: 6-2 (wins vs D,E,F,G,H,I; loses vs J,K) - opponents: D,E,F,G,H,I,J,K
      // Team B: 6-2 (wins vs D,E,F,G,H,J; loses vs I,L) - opponents: D,E,F,G,H,I,J,L (L instead of K)
      // Team C: 6-2 (wins vs D,E,F,G,I,K; loses vs H,L) - opponents: D,E,F,G,H,I,K,L (L instead of J)
      // Opponents structured so Team A's opponents (J,K with good records) > Team B's (I,L with medium) > Team C's (H,L with H poor)
      const games = [
        // Team A games (6-2)
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'TENN'),
        createMockGame('3', 'A', 'F', 28, 24, 'ALA', 'FLA'),
        createMockGame('4', 'A', 'G', 28, 24, 'ALA', 'AUB'),
        createMockGame('5', 'A', 'H', 28, 24, 'ALA', 'ARK'),
        createMockGame('6', 'A', 'I', 28, 24, 'ALA', 'TEX'),
        createMockGame('7', 'A', 'J', 17, 20, 'ALA', 'OKLA'),
        createMockGame('8', 'A', 'K', 17, 20, 'ALA', 'MISS'),
        // Team B games (6-2)
        createMockGame('9', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('10', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('11', 'B', 'F', 28, 24, 'UA', 'FLA'),
        createMockGame('12', 'B', 'G', 28, 24, 'UA', 'AUB'),
        createMockGame('13', 'B', 'H', 28, 24, 'UA', 'ARK'),
        createMockGame('14', 'B', 'I', 17, 20, 'UA', 'TEX'),
        createMockGame('15', 'B', 'J', 28, 24, 'UA', 'OKLA'),
        createMockGame('16', 'B', 'L', 17, 20, 'UA', 'VAND'),
        // Team C games (6-2)
        createMockGame('17', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('18', 'C', 'E', 28, 24, 'LSU', 'TENN'),
        createMockGame('19', 'C', 'F', 28, 24, 'LSU', 'FLA'),
        createMockGame('20', 'C', 'G', 28, 24, 'LSU', 'AUB'),
        createMockGame('21', 'C', 'H', 17, 20, 'LSU', 'ARK'),
        createMockGame('22', 'C', 'I', 28, 24, 'LSU', 'TEX'),
        createMockGame('23', 'C', 'K', 28, 24, 'LSU', 'MISS'),
        createMockGame('24', 'C', 'L', 17, 20, 'LSU', 'VAND'),
        // Additional games to establish opponent records
        // Opponents D, E, F, G (played by all, need good records for Team A to have highest %)
        createMockGame('25', 'D', 'L', 28, 24, 'UGA', 'VAND'),
        createMockGame('26', 'D', 'M', 28, 24, 'UGA', 'SCAR'),
        createMockGame('27', 'E', 'L', 28, 24, 'TENN', 'VAND'),
        createMockGame('28', 'E', 'M', 28, 24, 'TENN', 'SCAR'),
        createMockGame('29', 'F', 'L', 28, 24, 'FLA', 'VAND'),
        createMockGame('30', 'F', 'M', 28, 24, 'FLA', 'SCAR'),
        createMockGame('31', 'G', 'L', 28, 24, 'AUB', 'VAND'),
        createMockGame('32', 'G', 'M', 28, 24, 'AUB', 'SCAR'),
        // Opponents H, I (mixed results to create different percentages)
        createMockGame('33', 'H', 'L', 28, 24, 'ARK', 'VAND'),
        createMockGame('34', 'H', 'M', 17, 20, 'ARK', 'SCAR'),
        createMockGame('35', 'I', 'L', 17, 20, 'TEX', 'VAND'),
        createMockGame('36', 'I', 'M', 17, 20, 'TEX', 'SCAR'),
        // Opponents J, K (weaker records to lower percentages)
        createMockGame('37', 'J', 'L', 17, 20, 'OKLA', 'VAND'),
        createMockGame('38', 'J', 'M', 17, 20, 'OKLA', 'SCAR'),
        createMockGame('39', 'K', 'L', 17, 20, 'MISS', 'VAND'),
        createMockGame('40', 'K', 'M', 17, 20, 'MISS', 'SCAR'),
        // Games between opponents to establish better records
        // J, K (beat A) need good records for Team A to have highest %
        // I, L (beat B) need medium records for Team B to have middle %
        // H (beat C) needs poor record for Team C to have lowest %
        createMockGame('41', 'J', 'D', 28, 24, 'OKLA', 'UGA'),
        createMockGame('42', 'J', 'E', 28, 24, 'OKLA', 'TENN'),
        createMockGame('43', 'J', 'F', 28, 24, 'OKLA', 'FLA'),
        createMockGame('44', 'J', 'G', 28, 24, 'OKLA', 'AUB'),
        createMockGame('45', 'J', 'H', 28, 24, 'OKLA', 'ARK'),
        createMockGame('46', 'J', 'I', 28, 24, 'OKLA', 'TEX'),
        createMockGame('47', 'J', 'K', 28, 24, 'OKLA', 'MISS'),
        createMockGame('48', 'J', 'L', 28, 24, 'OKLA', 'VAND'),
        createMockGame('49', 'K', 'D', 28, 24, 'MISS', 'UGA'),
        createMockGame('50', 'K', 'E', 28, 24, 'MISS', 'TENN'),
        createMockGame('51', 'K', 'F', 28, 24, 'MISS', 'FLA'),
        createMockGame('52', 'K', 'G', 28, 24, 'MISS', 'AUB'),
        createMockGame('53', 'K', 'H', 28, 24, 'MISS', 'ARK'),
        createMockGame('54', 'K', 'I', 28, 24, 'MISS', 'TEX'),
        createMockGame('55', 'K', 'L', 28, 24, 'MISS', 'VAND'),
        // I (beat B) - medium records
        createMockGame('56', 'I', 'D', 28, 24, 'TEX', 'UGA'),
        createMockGame('57', 'I', 'E', 17, 20, 'TEX', 'TENN'),
        createMockGame('58', 'I', 'F', 28, 24, 'TEX', 'FLA'),
        createMockGame('59', 'I', 'G', 17, 20, 'TEX', 'AUB'),
        createMockGame('60', 'I', 'H', 28, 24, 'TEX', 'ARK'),
        createMockGame('61', 'I', 'L', 28, 24, 'TEX', 'VAND'),
        // L (beat B and C) - medium records
        createMockGame('62', 'L', 'D', 28, 24, 'VAND', 'UGA'),
        createMockGame('63', 'L', 'E', 17, 20, 'VAND', 'TENN'),
        createMockGame('64', 'L', 'F', 28, 24, 'VAND', 'FLA'),
        createMockGame('65', 'L', 'G', 17, 20, 'VAND', 'AUB'),
        createMockGame('66', 'L', 'H', 28, 24, 'VAND', 'ARK'),
        // H (beat C) - poor record
        createMockGame('67', 'H', 'D', 17, 20, 'ARK', 'UGA'),
        createMockGame('68', 'H', 'E', 17, 20, 'ARK', 'TENN'),
        createMockGame('69', 'H', 'F', 17, 20, 'ARK', 'FLA'),
        createMockGame('70', 'H', 'G', 17, 20, 'ARK', 'AUB'),
        createMockGame('71', 'H', 'I', 17, 20, 'ARK', 'TEX'),
        createMockGame('72', 'H', 'L', 17, 20, 'ARK', 'VAND'),
      ];

      const result = applyRuleDOpponentWinPercentage(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });

  describe('Three-Team Tie (or More) for Second Place', () => {
    it('Example: Team A 52.5%, Team B 50.0%, Team C 47.5%; Team A advances', () => {
      // Team A: 6-2 (wins vs D,E,F,G,H,I; loses vs J,K) - opponents: D,E,F,G,H,I,J,K
      // Team B: 6-2 (wins vs D,E,F,G,H,J; loses vs I,L) - opponents: D,E,F,G,H,I,J,L (L instead of K)
      // Team C: 6-2 (wins vs D,E,F,G,I,K; loses vs H,L) - opponents: D,E,F,G,H,I,K,L (L instead of J)
      // Opponents structured so Team A's opponents (J,K with good records) > Team B's (I,L with medium) > Team C's (H,L with H poor)
      const games = [
        // Team A games (6-2)
        createMockGame('1', 'A', 'D', 28, 24, 'ALA', 'UGA'),
        createMockGame('2', 'A', 'E', 28, 24, 'ALA', 'TENN'),
        createMockGame('3', 'A', 'F', 28, 24, 'ALA', 'FLA'),
        createMockGame('4', 'A', 'G', 28, 24, 'ALA', 'AUB'),
        createMockGame('5', 'A', 'H', 28, 24, 'ALA', 'ARK'),
        createMockGame('6', 'A', 'I', 28, 24, 'ALA', 'TEX'),
        createMockGame('7', 'A', 'J', 17, 20, 'ALA', 'OKLA'),
        createMockGame('8', 'A', 'K', 17, 20, 'ALA', 'MISS'),
        // Team B games (6-2)
        createMockGame('9', 'B', 'D', 28, 24, 'UA', 'UGA'),
        createMockGame('10', 'B', 'E', 28, 24, 'UA', 'TENN'),
        createMockGame('11', 'B', 'F', 28, 24, 'UA', 'FLA'),
        createMockGame('12', 'B', 'G', 28, 24, 'UA', 'AUB'),
        createMockGame('13', 'B', 'H', 28, 24, 'UA', 'ARK'),
        createMockGame('14', 'B', 'I', 17, 20, 'UA', 'TEX'),
        createMockGame('15', 'B', 'J', 28, 24, 'UA', 'OKLA'),
        createMockGame('16', 'B', 'L', 17, 20, 'UA', 'VAND'),
        // Team C games (6-2)
        createMockGame('17', 'C', 'D', 28, 24, 'LSU', 'UGA'),
        createMockGame('18', 'C', 'E', 28, 24, 'LSU', 'TENN'),
        createMockGame('19', 'C', 'F', 28, 24, 'LSU', 'FLA'),
        createMockGame('20', 'C', 'G', 28, 24, 'LSU', 'AUB'),
        createMockGame('21', 'C', 'H', 17, 20, 'LSU', 'ARK'),
        createMockGame('22', 'C', 'I', 28, 24, 'LSU', 'TEX'),
        createMockGame('23', 'C', 'K', 28, 24, 'LSU', 'MISS'),
        createMockGame('24', 'C', 'L', 17, 20, 'LSU', 'VAND'),
        // Additional games to establish opponent records
        // Opponents D, E, F, G (played by all, need good records for Team A to have highest %)
        createMockGame('25', 'D', 'L', 28, 24, 'UGA', 'VAND'),
        createMockGame('26', 'D', 'M', 28, 24, 'UGA', 'SCAR'),
        createMockGame('27', 'E', 'L', 28, 24, 'TENN', 'VAND'),
        createMockGame('28', 'E', 'M', 28, 24, 'TENN', 'SCAR'),
        createMockGame('29', 'F', 'L', 28, 24, 'FLA', 'VAND'),
        createMockGame('30', 'F', 'M', 28, 24, 'FLA', 'SCAR'),
        createMockGame('31', 'G', 'L', 28, 24, 'AUB', 'VAND'),
        createMockGame('32', 'G', 'M', 28, 24, 'AUB', 'SCAR'),
        // Opponents H, I (mixed results to create different percentages)
        createMockGame('33', 'H', 'L', 28, 24, 'ARK', 'VAND'),
        createMockGame('34', 'H', 'M', 17, 20, 'ARK', 'SCAR'),
        createMockGame('35', 'I', 'L', 17, 20, 'TEX', 'VAND'),
        createMockGame('36', 'I', 'M', 17, 20, 'TEX', 'SCAR'),
        // Games between opponents to establish better records
        // J, K (beat A) need good records for Team A to have highest %
        // I, L (beat B) need medium records for Team B to have middle %
        // H (beat C) needs poor record for Team C to have lowest %
        createMockGame('37', 'J', 'D', 28, 24, 'OKLA', 'UGA'),
        createMockGame('38', 'J', 'E', 28, 24, 'OKLA', 'TENN'),
        createMockGame('39', 'J', 'F', 28, 24, 'OKLA', 'FLA'),
        createMockGame('40', 'J', 'G', 28, 24, 'OKLA', 'AUB'),
        createMockGame('41', 'J', 'H', 28, 24, 'OKLA', 'ARK'),
        createMockGame('42', 'J', 'I', 28, 24, 'OKLA', 'TEX'),
        createMockGame('43', 'J', 'K', 28, 24, 'OKLA', 'MISS'),
        createMockGame('44', 'J', 'L', 28, 24, 'OKLA', 'VAND'),
        createMockGame('45', 'J', 'M', 28, 24, 'OKLA', 'SCAR'),
        createMockGame('46', 'K', 'D', 28, 24, 'MISS', 'UGA'),
        createMockGame('47', 'K', 'E', 28, 24, 'MISS', 'TENN'),
        createMockGame('48', 'K', 'F', 28, 24, 'MISS', 'FLA'),
        createMockGame('49', 'K', 'G', 28, 24, 'MISS', 'AUB'),
        createMockGame('50', 'K', 'H', 28, 24, 'MISS', 'ARK'),
        createMockGame('51', 'K', 'I', 28, 24, 'MISS', 'TEX'),
        createMockGame('52', 'K', 'L', 28, 24, 'MISS', 'VAND'),
        createMockGame('53', 'K', 'M', 28, 24, 'MISS', 'SCAR'),
        // I (beat B) - medium records
        createMockGame('54', 'I', 'D', 28, 24, 'TEX', 'UGA'),
        createMockGame('55', 'I', 'E', 17, 20, 'TEX', 'TENN'),
        createMockGame('56', 'I', 'F', 28, 24, 'TEX', 'FLA'),
        createMockGame('57', 'I', 'G', 17, 20, 'TEX', 'AUB'),
        createMockGame('58', 'I', 'H', 28, 24, 'TEX', 'ARK'),
        createMockGame('59', 'I', 'L', 28, 24, 'TEX', 'VAND'),
        createMockGame('60', 'I', 'M', 17, 20, 'TEX', 'SCAR'),
        // L (beat B and C) - medium records
        createMockGame('61', 'L', 'D', 28, 24, 'VAND', 'UGA'),
        createMockGame('62', 'L', 'E', 17, 20, 'VAND', 'TENN'),
        createMockGame('63', 'L', 'F', 28, 24, 'VAND', 'FLA'),
        createMockGame('64', 'L', 'G', 17, 20, 'VAND', 'AUB'),
        createMockGame('65', 'L', 'H', 28, 24, 'VAND', 'ARK'),
        createMockGame('66', 'L', 'M', 17, 20, 'VAND', 'SCAR'),
        // H (beat C) - poor record
        createMockGame('67', 'H', 'D', 17, 20, 'ARK', 'UGA'),
        createMockGame('68', 'H', 'E', 17, 20, 'ARK', 'TENN'),
        createMockGame('69', 'H', 'F', 17, 20, 'ARK', 'FLA'),
        createMockGame('70', 'H', 'G', 17, 20, 'ARK', 'AUB'),
        createMockGame('71', 'H', 'I', 17, 20, 'ARK', 'TEX'),
        createMockGame('72', 'H', 'L', 17, 20, 'ARK', 'VAND'),
        createMockGame('73', 'H', 'M', 17, 20, 'ARK', 'SCAR'),
      ];

      const result = applyRuleDOpponentWinPercentage(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });
});
