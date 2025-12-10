import { applyRuleOverallWinPercentage } from '@/lib/cfb/tiebreaker-rules/common/rule-overall-win-percentage';
import { createGameLean } from './test-helpers';

describe('Common Tiebreaker Rules - Overall Win Percentage', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A 81.8% (9-2), Team B 72.7% (8-3), Team A advances', () => {
      const games = [
        // Team A: 9 wins, 2 losses (11 games total = 81.8%)
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
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '9',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        // Team B: 8 wins, 3 losses (11 games total = 72.7%)
        createGameLean({
          gameId: '12',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '17',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '18',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '19',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '20',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'K', score: 20, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '21',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
      ];

      const result = applyRuleOverallWinPercentage(['A', 'B'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.detail).toContain('81.8%');
    });
  });

  describe('Three-Team Tie (or More) for First Place', () => {
    it('Example: Team A 83.3% (10-2), Team B 75.0% (9-3), Team C 66.7% (8-4); Team A advances', () => {
      const games = [
        // Team A: 10 wins, 2 losses (12 games total = 83.3%)
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
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '9',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'M', score: 24, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'N', score: 20, abbrev: 'MISST' },
        }),
        createGameLean({
          gameId: '12',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'O', score: 20, abbrev: 'KY' },
        }),
        // Team B: 9 wins, 3 losses (12 games total = 75.0%)
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '17',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '18',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '19',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '20',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '21',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '23',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'N', score: 20, abbrev: 'MISST' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'O', score: 20, abbrev: 'KY' },
        }),
        // Team C: 8 wins, 4 losses (12 games total = 66.7%)
        createGameLean({
          gameId: '25',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '27',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '29',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '30',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '31',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '32',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '33',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '34',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '35',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'N', score: 20, abbrev: 'MISST' },
        }),
        createGameLean({
          gameId: '36',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'O', score: 20, abbrev: 'KY' },
        }),
      ];

      const result = applyRuleOverallWinPercentage(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
      expect(result.detail).toContain('83.3%');
    });

    it('Example: Team A 75.0% (9-3), Team B 75.0% (9-3), Team C 66.7% (8-4); Teams A and B remain tied', () => {
      const games = [
        // Team A: 9 wins, 3 losses (12 games total = 75.0%)
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
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '8',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '9',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '10',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '11',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'N', score: 20, abbrev: 'MISST' },
        }),
        createGameLean({
          gameId: '12',
          home: { teamId: 'A', score: 17, abbrev: 'ALA' },
          away: { teamId: 'O', score: 20, abbrev: 'KY' },
        }),
        // Team B: 9 wins, 3 losses (12 games total = 75.0%)
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '17',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '18',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '19',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '20',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '21',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '23',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'N', score: 20, abbrev: 'MISST' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'O', score: 20, abbrev: 'KY' },
        }),
        // Team C: 8 wins, 4 losses (12 games total = 66.7%)
        createGameLean({
          gameId: '25',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '27',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '29',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '30',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '31',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '32',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '33',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '34',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '35',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'N', score: 20, abbrev: 'MISST' },
        }),
        createGameLean({
          gameId: '36',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'O', score: 20, abbrev: 'KY' },
        }),
      ];

      const result = applyRuleOverallWinPercentage(['A', 'B', 'C'], games);

      expect(result.winners).toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).not.toContain('C');
      expect(result.detail).toContain('75.0%');
    });
  });

  describe('Edge Cases', () => {
    it('Handles teams with no games (0% win percentage)', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
      ];

      const result = applyRuleOverallWinPercentage(['A', 'B'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
    });

    it('Ignores incomplete games when calculating win percentage', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'D', score: null, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'C', score: 24, abbrev: 'LSU' },
        }),
        createGameLean({
          gameId: '4',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'D', score: 20, abbrev: 'UGA' },
        }),
      ];

      const result = applyRuleOverallWinPercentage(['A', 'B'], games);

      // Team A: 1-0 (100%), Team B: 1-1 (50%)
      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
    });
  });
});

