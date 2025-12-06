import { applyRuleDOpponentWinPercentage } from '@/lib/cfb/tiebreaker-rules/common/rule-d-opponent-win-percentage';
import { createGameLean } from './test-helpers';

describe('Common Tiebreaker Rules - Rule D: Opponent Win Percentage', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A 52.5%, Team B 50.0%, Team A advances', () => {
      // Team A: 6-2 (wins vs C,D,E,F,G,H; loses vs I,J)
      // Team B: 6-2 (wins vs C,D,E,F,G,I; loses vs H,K)
      // Team A and B play different opponents: A plays J, B plays K
      // Opponents structured so Team A's opponents have better records than Team B's opponents
      const games = [
        // Team A games (6-2)
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'J', score: 20, abbrev: 'OKLA' },
        }),
        // Team B games (6-2)
        createGameLean({
          gameId: '9',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '12',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'K', score: 20, abbrev: 'MISS' },
        }),
        // Additional games to establish opponent records
        // Opponents C, D, E, F, G (common to both, need consistent records)
        createGameLean({
          gameId: '17',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '18',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '19',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '20',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '21',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '23',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '25',
          home: { teamId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        // Opponent I (beat A, lost to B) - needs good record for Team A to have higher %
        createGameLean({
          gameId: '27',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        // Opponent H (lost to A, beat B) - needs weaker record
        createGameLean({
          gameId: '29',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'K', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '30',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'L', score: 20, abbrev: 'SCAR' },
        }),
        // Opponent J (beat A) - needs good record for Team A to have higher %
        createGameLean({
          gameId: '31',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '32',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '33',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'M', score: 24, abbrev: 'VAND' },
        }),
        // Opponent K (beat B) - needs weaker record
        createGameLean({
          gameId: '34',
          home: { teamId: 'K', score: 17, abbrev: 'MISS' },
          away: { teamId: 'L', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '35',
          home: { teamId: 'K', score: 17, abbrev: 'MISS' },
          away: { teamId: 'M', score: 20, abbrev: 'VAND' },
        }),
        // Games between opponents to establish better records for I vs H
        // I (beat A) needs better record than H (beat B) for Team A to have higher opponent win%
        createGameLean({
          gameId: '36',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '37',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '38',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '39',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '40',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '41',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '42',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '43',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '44',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'M', score: 24, abbrev: 'VAND' },
        }),
        // H (beat B) needs weaker record
        createGameLean({
          gameId: '45',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'C', score: 20, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '46',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '47',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '48',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'F', score: 20, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '49',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '50',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '51',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'K', score: 20, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '52',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'L', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '53',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'M', score: 20, abbrev: 'VAND' },
        }),
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
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'J', score: 20, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'K', score: 20, abbrev: 'MISS' },
        }),
        // Team B games (6-2)
        createGameLean({
          gameId: '9',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '12',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        // Team C games (6-2)
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
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '23',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        // Additional games to establish opponent records
        // Opponents D, E, F, G (played by all, need good records for Team A to have highest %)
        createGameLean({
          gameId: '25',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '27',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '29',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '30',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '31',
          home: { teamId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '32',
          home: { teamId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        // Opponents H, I (mixed results to create different percentages)
        createGameLean({
          gameId: '33',
          home: { teamId: 'H', score: 28, abbrev: 'ARK' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '34',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '35',
          home: { teamId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '36',
          home: { teamId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // Opponents J, K (weaker records to lower percentages)
        createGameLean({
          gameId: '37',
          home: { teamId: 'J', score: 17, abbrev: 'OKLA' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '38',
          home: { teamId: 'J', score: 17, abbrev: 'OKLA' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '39',
          home: { teamId: 'K', score: 17, abbrev: 'MISS' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '40',
          home: { teamId: 'K', score: 17, abbrev: 'MISS' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // Games between opponents to establish better records
        // J, K (beat A) need good records for Team A to have highest %
        // I, L (beat B) need medium records for Team B to have middle %
        // H (beat C) needs poor record for Team C to have lowest %
        createGameLean({
          gameId: '41',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '42',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '43',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '44',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '45',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '46',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '47',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '48',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '49',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '50',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '51',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '52',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '53',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '54',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '55',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        // I (beat B) - medium records
        createGameLean({
          gameId: '56',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '57',
          home: { teamId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '58',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '59',
          home: { teamId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '60',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '61',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        // L (beat B and C) - medium records
        createGameLean({
          gameId: '62',
          home: { teamId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '63',
          home: { teamId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '64',
          home: { teamId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '65',
          home: { teamId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '66',
          home: { teamId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        // H (beat C) - poor record
        createGameLean({
          gameId: '67',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '68',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '69',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'F', score: 20, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '70',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '71',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '72',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
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
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '5',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '6',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '7',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'J', score: 20, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'K', score: 20, abbrev: 'MISS' },
        }),
        // Team B games (6-2)
        createGameLean({
          gameId: '9',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '12',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        // Team C games (6-2)
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
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '23',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        // Additional games to establish opponent records
        // Opponents D, E, F, G (played by all, need good records for Team A to have highest %)
        createGameLean({
          gameId: '25',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '27',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '29',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '30',
          home: { teamId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '31',
          home: { teamId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '32',
          home: { teamId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        // Opponents H, I (mixed results to create different percentages)
        createGameLean({
          gameId: '33',
          home: { teamId: 'H', score: 28, abbrev: 'ARK' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '34',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '35',
          home: { teamId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '36',
          home: { teamId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // Games between opponents to establish better records
        // J, K (beat A) need good records for Team A to have highest %
        // I, L (beat B) need medium records for Team B to have middle %
        // H (beat C) needs poor record for Team C to have lowest %
        createGameLean({
          gameId: '37',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '38',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '39',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '40',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '41',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '42',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '43',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '44',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '45',
          home: { teamId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '46',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '47',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '48',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '49',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '50',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '51',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '52',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '53',
          home: { teamId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        // I (beat B) - medium records
        createGameLean({
          gameId: '54',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '55',
          home: { teamId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '56',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '57',
          home: { teamId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '58',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '59',
          home: { teamId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '60',
          home: { teamId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // L (beat B and C) - medium records
        createGameLean({
          gameId: '61',
          home: { teamId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '62',
          home: { teamId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '63',
          home: { teamId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '64',
          home: { teamId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '65',
          home: { teamId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '66',
          home: { teamId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // H (beat C) - poor record
        createGameLean({
          gameId: '67',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '68',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '69',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'F', score: 20, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '70',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '71',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '72',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '73',
          home: { teamId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
      ];

      const result = applyRuleDOpponentWinPercentage(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });
});
