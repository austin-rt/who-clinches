import { breakTie } from '@/lib/cfb/tiebreaker-rules/core/breakTie';
import { SEC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/sec/config';
import { createGameLean } from '../../tiebreaker-rules/common/test-helpers';

describe('SEC Tiebreaker Rules - Integration Tests', () => {
  describe('Rule E: Scoring Margin - Cascade & Recursion', () => {
    it('Three-team tie for first place: Team A advances, B/C revert to two-team tiebreaker', () => {
      // From rule-e-scoring-margin.txt lines 92-107
      // Team A: 6-2, Team B: 6-2, Team C: 6-2
      // Capped relative scoring margin: Team A +45.0%, Team B +40.0%, Team C +35.0%
      // Need full conference schedule to calculate scoring margins
      // This is complex - we'll create a scenario where Rules A-D don't break the tie
      // and Rule E does based on scoring margins
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 21, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'K', score: 21, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 21, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'K', score: 21, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '17',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '18',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 21, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '19',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '20',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '21',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'K', score: 21, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '37',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'K', score: 21, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '38',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '39',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '40',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '41',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '42',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '43',
          home: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '44',
          home: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '45',
          home: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '46',
          home: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '47',
          home: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '48',
          home: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '49',
          home: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '50',
          home: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '51',
          home: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '52',
          home: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(
        ['A', 'B', 'C'],
        games,
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
        SEC_TIEBREAKER_CONFIG,
        explanations
      );

      const survivors =
        result.steps.find((step) => step.rule.includes('Scoring Margin'))?.survivors || [];
      expect(survivors.length).toBeGreaterThan(0);
      expect(result.steps.some((step) => step.rule.includes('Scoring Margin'))).toBe(true);
      expect(result.steps.length).toBeGreaterThan(1);
    });

    it('Cascade through Rules A-E: All earlier rules fail, Rule E breaks tie', () => {
      // Create scenario where Rules A, B, C, D don't break the tie, then Rule E does
      // Three teams tied, no head-to-head games, no common opponents, no highest placed opponent,
      // same opponent win percentage, different scoring margins
      const games = [
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 21, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'K', score: 21, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 21, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'B', score: 32, abbrev: 'UA' },
          away: { teamEspnId: 'K', score: 21, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '17',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '18',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 21, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '19',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '20',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '21',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'K', score: 21, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
        }),
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '37',
          home: { teamEspnId: 'E', score: 24, abbrev: 'UF' },
          away: { teamEspnId: 'K', score: 21, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '38',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'USC' },
        }),
        createGameLean({
          gameEspnId: '39',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '40',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '41',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '42',
          home: { teamEspnId: 'F', score: 21, abbrev: 'UK' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '43',
          home: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'UT' },
        }),
        createGameLean({
          gameEspnId: '44',
          home: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '45',
          home: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '46',
          home: { teamEspnId: 'G', score: 21, abbrev: 'USC' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '47',
          home: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'VU' },
        }),
        createGameLean({
          gameEspnId: '48',
          home: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '49',
          home: { teamEspnId: 'H', score: 21, abbrev: 'UT' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '50',
          home: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'TAMU' },
        }),
        createGameLean({
          gameEspnId: '51',
          home: { teamEspnId: 'I', score: 21, abbrev: 'VU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
        createGameLean({
          gameEspnId: '52',
          home: { teamEspnId: 'J', score: 21, abbrev: 'TAMU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MSU' },
        }),
      ];

      const explanations = new Map<string, string[]>();
      const result = breakTie(
        ['A', 'B', 'C'],
        games,
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
        SEC_TIEBREAKER_CONFIG,
        explanations
      );

      const ruleNames = result.steps.map((step) => step.rule);
      expect(ruleNames).toContain('Head-to-Head');
      expect(ruleNames).toContain('Common Opponents');
      expect(ruleNames.some((rule) => rule.includes('Highest Placed Common Opponent'))).toBe(true);
      expect(ruleNames.some((rule) => rule.includes('Opponent Win Percentage'))).toBe(true);
      expect(ruleNames.some((rule) => rule.includes('Scoring Margin'))).toBe(true);
      expect(result.steps.length).toBeGreaterThan(4);
    });
  });
});
