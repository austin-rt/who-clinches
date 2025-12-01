import { applyRuleEScoringMargin } from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
import { createGameLean } from './test-helpers';

describe('Who Clinches - SEC Tiebreaker Rules - Rule E: Capped Relative Total Scoring Margin', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A +45.0%, Team B +40.0%, Team A advances', () => {
      // Rules document (lines 77-89):
      // - Conference records: Team A 6-2, Team B 6-2
      // - Capped relative scoring margin calculated from all 8 Conference games
      // - Team A: +45.0%, Team B: +40.0%
      // - Team A advances to the championship game
      const games = [
        // Team A: 8 conference games (6-2 record)
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 38, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 21, abbrev: 'ALA' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        // Team B: 8 conference games (6-2 record)
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 31, abbrev: 'UA' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 35, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 31, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 35, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 31, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 35, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 31, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'B', score: 21, abbrev: 'UA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Additional games to establish opponent season averages (required for scoring margin calculation)
        createGameLean({
          gameEspnId: '17',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '18',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '19',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '20',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '21',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '37',
          home: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '38',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '39',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '40',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '41',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '42',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '43',
          home: { teamEspnId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '44',
          home: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '45',
          home: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '46',
          home: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '47',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '48',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '49',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '50',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '51',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '52',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
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
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 38, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 21, abbrev: 'ALA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Team B: 8 conference games (6-2 record)
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 35, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 31, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 35, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 31, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 35, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 31, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'J', score: 31, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'B', score: 21, abbrev: 'UA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Team C: 8 conference games (6-2 record)
        createGameLean({
          gameEspnId: '17',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '18',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '19',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '20',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '21',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'C', score: 21, abbrev: 'LSU' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Additional games to establish opponent season averages (required for scoring margin calculation)
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '37',
          home: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '38',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '39',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '40',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '41',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '42',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '43',
          home: { teamEspnId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '44',
          home: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '45',
          home: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '46',
          home: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '47',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '48',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '49',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '50',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '51',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '52',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
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
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 31, abbrev: 'ALA' },
          away: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
        }),
        // Team B's other 7 games to establish season averages
        // Need: 164 points scored, 137 points allowed
        // Solution: 1 game 22/19, 2 games 23/19, 4 games 24/20
        // Total scored: 28 + 22 + 46 + 96 = 192, avg = 24 ✓
        // Total allowed: 31 + 19 + 38 + 80 = 168, avg = 21 ✓
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'B', score: 22, abbrev: 'UA' },
          away: { teamEspnId: 'C', score: 19, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'B', score: 23, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 19, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'B', score: 23, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 19, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 20, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 20, abbrev: 'TEX' },
        }),
        // Additional games to complete the conference schedule
        // (needed so averages are calculated correctly)
        // Additional games to complete the conference schedule
        // (needed so averages are calculated correctly)
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'C', score: 19, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 22, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'C', score: 19, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 23, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'C', score: 20, abbrev: 'LSU' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'C', score: 20, abbrev: 'LSU' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'C', score: 20, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'C', score: 20, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'D', score: 19, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 23, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '17',
          home: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '18',
          home: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '19',
          home: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '20',
          home: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '21',
          home: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'I', score: 20, abbrev: 'TEX' },
        }),
        // Add Team Z with a lower margin to ensure Team A wins
        // Team Z plays one game: scores 20, allows 20 vs opponent that averages 20 scored/20 allowed
        // Margin: (20/20)*100 - (20/20)*100 = 100 - 100 = 0%
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'Z', score: 20, abbrev: 'VAND' },
          away: { teamEspnId: 'J', score: 20, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'J', score: 20, abbrev: 'OKLA' },
          away: { teamEspnId: 'K', score: 20, abbrev: 'MISS' },
        }),
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
        createGameLean({
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 38, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 21, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 21, abbrev: 'ALA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Team B: 8 conference games (6-2 record)
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 35, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 31, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 35, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 31, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 35, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 31, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'B', score: 24, abbrev: 'UA' },
          away: { teamEspnId: 'J', score: 31, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'B', score: 21, abbrev: 'UA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Team C: 8 conference games (6-2 record)
        createGameLean({
          gameEspnId: '17',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '18',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '19',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '20',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '21',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'C', score: 21, abbrev: 'LSU' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Additional games to establish opponent season averages (required for scoring margin calculation)
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '37',
          home: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '38',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '39',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '40',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '41',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '42',
          home: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '43',
          home: { teamEspnId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '44',
          home: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '45',
          home: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '46',
          home: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '47',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '48',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '49',
          home: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '50',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '51',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '52',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
      ];

      const result = applyRuleEScoringMargin(['A', 'B', 'C'], games);

      // Rules document line 124: Team A advances to the championship game
      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });
});
