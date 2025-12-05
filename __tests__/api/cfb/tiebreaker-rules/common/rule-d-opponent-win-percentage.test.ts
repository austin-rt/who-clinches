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
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamEspnId: 'J', score: 20, abbrev: 'OKLA' },
        }),
        // Team B games (6-2)
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 17, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'B', score: 17, abbrev: 'UA' },
          away: { teamEspnId: 'K', score: 20, abbrev: 'MISS' },
        }),
        // Additional games to establish opponent records
        // Opponents C, D, E, F, G (common to both, need consistent records)
        createGameLean({
          gameEspnId: '17',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '18',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '19',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '20',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '21',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        // Opponent I (beat A, lost to B) - needs good record for Team A to have higher %
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        // Opponent H (lost to A, beat B) - needs weaker record
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'K', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'SCAR' },
        }),
        // Opponent J (beat A) - needs good record for Team A to have higher %
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'VAND' },
        }),
        // Opponent K (beat B) - needs weaker record
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'K', score: 17, abbrev: 'MISS' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'K', score: 17, abbrev: 'MISS' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'VAND' },
        }),
        // Games between opponents to establish better records for I vs H
        // I (beat A) needs better record than H (beat B) for Team A to have higher opponent win%
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '37',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '38',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '39',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '40',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '41',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '42',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '43',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '44',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'VAND' },
        }),
        // H (beat B) needs weaker record
        createGameLean({
          gameEspnId: '45',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'C', score: 20, abbrev: 'LSU' },
        }),
        createGameLean({
          gameEspnId: '46',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '47',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '48',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'F', score: 20, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '49',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '50',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '51',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'K', score: 20, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '52',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '53',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'VAND' },
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
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamEspnId: 'J', score: 20, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamEspnId: 'K', score: 20, abbrev: 'MISS' },
        }),
        // Team B games (6-2)
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 17, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'B', score: 17, abbrev: 'UA' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
        }),
        // Team C games (6-2)
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
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
        }),
        // Additional games to establish opponent records
        // Opponents D, E, F, G (played by all, need good records for Team A to have highest %)
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        // Opponents H, I (mixed results to create different percentages)
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'H', score: 28, abbrev: 'ARK' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // Opponents J, K (weaker records to lower percentages)
        createGameLean({
          gameEspnId: '37',
          home: { teamEspnId: 'J', score: 17, abbrev: 'OKLA' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '38',
          home: { teamEspnId: 'J', score: 17, abbrev: 'OKLA' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '39',
          home: { teamEspnId: 'K', score: 17, abbrev: 'MISS' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '40',
          home: { teamEspnId: 'K', score: 17, abbrev: 'MISS' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // Games between opponents to establish better records
        // J, K (beat A) need good records for Team A to have highest %
        // I, L (beat B) need medium records for Team B to have middle %
        // H (beat C) needs poor record for Team C to have lowest %
        createGameLean({
          gameEspnId: '41',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '42',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '43',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '44',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '45',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '46',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '47',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '48',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '49',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '50',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '51',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '52',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '53',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '54',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '55',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        // I (beat B) - medium records
        createGameLean({
          gameEspnId: '56',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '57',
          home: { teamEspnId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '58',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '59',
          home: { teamEspnId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '60',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '61',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        // L (beat B and C) - medium records
        createGameLean({
          gameEspnId: '62',
          home: { teamEspnId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '63',
          home: { teamEspnId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '64',
          home: { teamEspnId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '65',
          home: { teamEspnId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '66',
          home: { teamEspnId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        // H (beat C) - poor record
        createGameLean({
          gameEspnId: '67',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '68',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '69',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'F', score: 20, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '70',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '71',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '72',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
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
          gameEspnId: '1',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '2',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '3',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '4',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '5',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '6',
          home: { teamEspnId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '7',
          home: { teamEspnId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamEspnId: 'J', score: 20, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '8',
          home: { teamEspnId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamEspnId: 'K', score: 20, abbrev: 'MISS' },
        }),
        // Team B games (6-2)
        createGameLean({
          gameEspnId: '9',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '10',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '11',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '12',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '13',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '14',
          home: { teamEspnId: 'B', score: 17, abbrev: 'UA' },
          away: { teamEspnId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '15',
          home: { teamEspnId: 'B', score: 28, abbrev: 'UA' },
          away: { teamEspnId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameEspnId: '16',
          home: { teamEspnId: 'B', score: 17, abbrev: 'UA' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
        }),
        // Team C games (6-2)
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
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'H', score: 20, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '22',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '23',
          home: { teamEspnId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '24',
          home: { teamEspnId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
        }),
        // Additional games to establish opponent records
        // Opponents D, E, F, G (played by all, need good records for Team A to have highest %)
        createGameLean({
          gameEspnId: '25',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '26',
          home: { teamEspnId: 'D', score: 28, abbrev: 'UGA' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '27',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '28',
          home: { teamEspnId: 'E', score: 28, abbrev: 'TENN' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '29',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '30',
          home: { teamEspnId: 'F', score: 28, abbrev: 'FLA' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '31',
          home: { teamEspnId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '32',
          home: { teamEspnId: 'G', score: 28, abbrev: 'AUB' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        // Opponents H, I (mixed results to create different percentages)
        createGameLean({
          gameEspnId: '33',
          home: { teamEspnId: 'H', score: 28, abbrev: 'ARK' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '34',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '35',
          home: { teamEspnId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '36',
          home: { teamEspnId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // Games between opponents to establish better records
        // J, K (beat A) need good records for Team A to have highest %
        // I, L (beat B) need medium records for Team B to have middle %
        // H (beat C) needs poor record for Team C to have lowest %
        createGameLean({
          gameEspnId: '37',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '38',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '39',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '40',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '41',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '42',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '43',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameEspnId: '44',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '45',
          home: { teamEspnId: 'J', score: 28, abbrev: 'OKLA' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameEspnId: '46',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '47',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '48',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '49',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '50',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '51',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '52',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '53',
          home: { teamEspnId: 'K', score: 28, abbrev: 'MISS' },
          away: { teamEspnId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        // I (beat B) - medium records
        createGameLean({
          gameEspnId: '54',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '55',
          home: { teamEspnId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '56',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '57',
          home: { teamEspnId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '58',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '59',
          home: { teamEspnId: 'I', score: 28, abbrev: 'TEX' },
          away: { teamEspnId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '60',
          home: { teamEspnId: 'I', score: 17, abbrev: 'TEX' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // L (beat B and C) - medium records
        createGameLean({
          gameEspnId: '61',
          home: { teamEspnId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamEspnId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '62',
          home: { teamEspnId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '63',
          home: { teamEspnId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamEspnId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '64',
          home: { teamEspnId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '65',
          home: { teamEspnId: 'L', score: 28, abbrev: 'VAND' },
          away: { teamEspnId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameEspnId: '66',
          home: { teamEspnId: 'L', score: 17, abbrev: 'VAND' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // H (beat C) - poor record
        createGameLean({
          gameEspnId: '67',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'D', score: 20, abbrev: 'UGA' },
        }),
        createGameLean({
          gameEspnId: '68',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'E', score: 20, abbrev: 'TENN' },
        }),
        createGameLean({
          gameEspnId: '69',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'F', score: 20, abbrev: 'FLA' },
        }),
        createGameLean({
          gameEspnId: '70',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'G', score: 20, abbrev: 'AUB' },
        }),
        createGameLean({
          gameEspnId: '71',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'I', score: 20, abbrev: 'TEX' },
        }),
        createGameLean({
          gameEspnId: '72',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameEspnId: '73',
          home: { teamEspnId: 'H', score: 17, abbrev: 'ARK' },
          away: { teamEspnId: 'M', score: 20, abbrev: 'SCAR' },
        }),
      ];

      const result = applyRuleDOpponentWinPercentage(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
    });
  });
});
