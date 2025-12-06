import { applyRuleESecScoringMargin } from '@/lib/cfb/tiebreaker-rules/sec/rule-e-sec-scoring-margin';
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
          gameId: '1',
          home: { teamId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamId: 'C', score: 28, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamId: 'E', score: 28, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'A', score: 38, abbrev: 'ALA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamId: 'G', score: 21, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'A', score: 21, abbrev: 'ALA' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        // Team B: 8 conference games (6-2 record)
        createGameLean({
          gameId: '9',
          home: { teamId: 'B', score: 31, abbrev: 'UA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'B', score: 35, abbrev: 'UA' },
          away: { teamId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'B', score: 31, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '12',
          home: { teamId: 'B', score: 35, abbrev: 'UA' },
          away: { teamId: 'F', score: 28, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 31, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 35, abbrev: 'UA' },
          away: { teamId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 24, abbrev: 'UA' },
          away: { teamId: 'I', score: 31, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 21, abbrev: 'UA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Additional games to establish opponent season averages (required for scoring margin calculation)
        createGameLean({
          gameId: '17',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '18',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '19',
          home: { teamId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamId: 'F', score: 28, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '20',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '21',
          home: { teamId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '23',
          home: { teamId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '25',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '27',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '29',
          home: { teamId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '30',
          home: { teamId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '31',
          home: { teamId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '32',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '33',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '34',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '35',
          home: { teamId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '36',
          home: { teamId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '37',
          home: { teamId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '38',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '39',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '40',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '41',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '42',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '43',
          home: { teamId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '44',
          home: { teamId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '45',
          home: { teamId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '46',
          home: { teamId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '47',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '48',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '49',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '50',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '51',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '52',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
      ];

      const result = applyRuleESecScoringMargin(['A', 'B'], games);

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
          gameId: '1',
          home: { teamId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamId: 'E', score: 28, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: 38, abbrev: 'ALA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamId: 'G', score: 21, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'A', score: 21, abbrev: 'ALA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Team B: 8 conference games (6-2 record)
        createGameLean({
          gameId: '9',
          home: { teamId: 'B', score: 35, abbrev: 'UA' },
          away: { teamId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'B', score: 31, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'B', score: 35, abbrev: 'UA' },
          away: { teamId: 'F', score: 28, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '12',
          home: { teamId: 'B', score: 31, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 35, abbrev: 'UA' },
          away: { teamId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 31, abbrev: 'UA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 24, abbrev: 'UA' },
          away: { teamId: 'J', score: 31, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 21, abbrev: 'UA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Team C: 8 conference games (6-2 record)
        createGameLean({
          gameId: '17',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '18',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '19',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '20',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '21',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '23',
          home: { teamId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'C', score: 21, abbrev: 'LSU' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Additional games to establish opponent season averages (required for scoring margin calculation)
        createGameLean({
          gameId: '25',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '27',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '29',
          home: { teamId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '30',
          home: { teamId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '31',
          home: { teamId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '32',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '33',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '34',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '35',
          home: { teamId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '36',
          home: { teamId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '37',
          home: { teamId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '38',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '39',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '40',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '41',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '42',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '43',
          home: { teamId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '44',
          home: { teamId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '45',
          home: { teamId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '46',
          home: { teamId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '47',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '48',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '49',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '50',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '51',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '52',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
      ];

      const result = applyRuleESecScoringMargin(['A', 'B', 'C'], games);

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
          gameId: '1',
          home: { teamId: 'A', score: 31, abbrev: 'ALA' },
          away: { teamId: 'B', score: 28, abbrev: 'UA' },
        }),
        // Team B's other 7 games to establish season averages
        // Need: 164 points scored, 137 points allowed
        // Solution: 1 game 22/19, 2 games 23/19, 4 games 24/20
        // Total scored: 28 + 22 + 46 + 96 = 192, avg = 24 ✓
        // Total allowed: 31 + 19 + 38 + 80 = 168, avg = 21 ✓
        createGameLean({
          gameId: '2',
          home: { teamId: 'B', score: 22, abbrev: 'UA' },
          away: { teamId: 'C', score: 19, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'B', score: 23, abbrev: 'UA' },
          away: { teamId: 'D', score: 19, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 23, abbrev: 'UA' },
          away: { teamId: 'E', score: 19, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'B', score: 24, abbrev: 'UA' },
          away: { teamId: 'F', score: 20, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'B', score: 24, abbrev: 'UA' },
          away: { teamId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'B', score: 24, abbrev: 'UA' },
          away: { teamId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'B', score: 24, abbrev: 'UA' },
          away: { teamId: 'I', score: 20, abbrev: 'TEX' },
        }),
        // Additional games to complete the conference schedule
        // (needed so averages are calculated correctly)
        // Additional games to complete the conference schedule
        // (needed so averages are calculated correctly)
        createGameLean({
          gameId: '9',
          home: { teamId: 'C', score: 19, abbrev: 'LSU' },
          away: { teamId: 'D', score: 22, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'C', score: 19, abbrev: 'LSU' },
          away: { teamId: 'E', score: 23, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'C', score: 20, abbrev: 'LSU' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '12',
          home: { teamId: 'C', score: 20, abbrev: 'LSU' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '13',
          home: { teamId: 'C', score: 20, abbrev: 'LSU' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'C', score: 20, abbrev: 'LSU' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'D', score: 19, abbrev: 'UGA' },
          away: { teamId: 'E', score: 23, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'D', score: 20, abbrev: 'UGA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '17',
          home: { teamId: 'D', score: 20, abbrev: 'UGA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '18',
          home: { teamId: 'D', score: 20, abbrev: 'UGA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '19',
          home: { teamId: 'D', score: 20, abbrev: 'UGA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '20',
          home: { teamId: 'E', score: 20, abbrev: 'TENN' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '21',
          home: { teamId: 'E', score: 20, abbrev: 'TENN' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'E', score: 20, abbrev: 'TENN' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '23',
          home: { teamId: 'E', score: 20, abbrev: 'TENN' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '25',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '27',
          home: { teamId: 'G', score: 20, abbrev: 'AUB' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'G', score: 20, abbrev: 'AUB' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '29',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'I', score: 20, abbrev: 'TEX' },
        }),
        // Add Team Z with a lower margin to ensure Team A wins
        // Team Z plays one game: scores 20, allows 20 vs opponent that averages 20 scored/20 allowed
        // Margin: (20/20)*100 - (20/20)*100 = 100 - 100 = 0%
        createGameLean({
          gameId: '30',
          home: { teamId: 'Z', score: 20, abbrev: 'VAND' },
          away: { teamId: 'J', score: 20, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '31',
          home: { teamId: 'J', score: 20, abbrev: 'OKLA' },
          away: { teamId: 'K', score: 20, abbrev: 'MISS' },
        }),
      ];

      // Need at least 2 teams for the function to work (it returns early if < 2)
      // Team Z has 0% margin, Team A should have ~30.9% margin, so Team A wins
      const result = applyRuleESecScoringMargin(['A', 'Z'], games);

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
          gameId: '1',
          home: { teamId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamId: 'D', score: 21, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamId: 'E', score: 28, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: 38, abbrev: 'ALA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamId: 'G', score: 21, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'A', score: 42, abbrev: 'ALA' },
          away: { teamId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'A', score: 35, abbrev: 'ALA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'A', score: 24, abbrev: 'ALA' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'A', score: 21, abbrev: 'ALA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Team B: 8 conference games (6-2 record)
        createGameLean({
          gameId: '9',
          home: { teamId: 'B', score: 35, abbrev: 'UA' },
          away: { teamId: 'D', score: 28, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'B', score: 31, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'B', score: 35, abbrev: 'UA' },
          away: { teamId: 'F', score: 28, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '12',
          home: { teamId: 'B', score: 31, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 35, abbrev: 'UA' },
          away: { teamId: 'H', score: 28, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 31, abbrev: 'UA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 24, abbrev: 'UA' },
          away: { teamId: 'J', score: 31, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 21, abbrev: 'UA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Team C: 8 conference games (6-2 record)
        createGameLean({
          gameId: '17',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '18',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '19',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '20',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '21',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '23',
          home: { teamId: 'C', score: 24, abbrev: 'LSU' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'C', score: 21, abbrev: 'LSU' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        // Additional games to establish opponent season averages (required for scoring margin calculation)
        createGameLean({
          gameId: '25',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '27',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '29',
          home: { teamId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '30',
          home: { teamId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '31',
          home: { teamId: 'D', score: 24, abbrev: 'UGA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '32',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '33',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '34',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '35',
          home: { teamId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '36',
          home: { teamId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '37',
          home: { teamId: 'E', score: 24, abbrev: 'TENN' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '38',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '39',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '40',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '41',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '42',
          home: { teamId: 'F', score: 24, abbrev: 'FLA' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '43',
          home: { teamId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '44',
          home: { teamId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '45',
          home: { teamId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '46',
          home: { teamId: 'G', score: 24, abbrev: 'AUB' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '47',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'I', score: 28, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '48',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'J', score: 28, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '49',
          home: { teamId: 'H', score: 24, abbrev: 'ARK' },
          away: { teamId: 'K', score: 28, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '50',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '51',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '52',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
      ];

      const result = applyRuleESecScoringMargin(['A', 'B', 'C'], games);

      // Rules document line 124: Team A advances to the championship game
      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });
});
