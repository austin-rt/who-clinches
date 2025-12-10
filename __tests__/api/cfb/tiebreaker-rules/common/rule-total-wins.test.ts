import { applyRuleTotalWins } from '@/lib/cfb/tiebreaker-rules/common/rule-total-wins';
import { createGameLean } from './test-helpers';

describe('Common Tiebreaker Rules - Total Wins', () => {
  describe('Two-Team Tie for Second Place', () => {
    it('Example: Team A 9 wins, Team B 8 wins, Team A advances', () => {
      const games = [
        // Team A: 9 wins, 2 losses (11 games total)
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
        // Team B: 8 wins, 3 losses (11 games total)
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

      const result = applyRuleTotalWins(['A', 'B'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.detail).toContain('9 wins');
    });
  });

  describe('Three-Team Tie (or More) for First Place', () => {
    it('Example: Team A 10 wins, Team B 9 wins, Team C 8 wins; Team A advances', () => {
      const games = [
        // Team A: 10 wins, 2 losses
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
        // Team B: 9 wins, 3 losses
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
        // Team C: 8 wins, 4 losses
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

      const result = applyRuleTotalWins(['A', 'B', 'C'], games);

      expect(result.winners).toEqual(['A']);
      expect(result.winners).not.toContain('B');
      expect(result.winners).not.toContain('C');
      expect(result.detail).toContain('10 wins');
    });

    it('Example: Team A 9 wins, Team B 9 wins, Team C 8 wins; Teams A and B remain tied', () => {
      const games = [
        // Team A: 9 wins, 2 losses
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
        // Team B: 9 wins, 2 losses
        createGameLean({
          gameId: '12',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '13',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '14',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '15',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '16',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '17',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '18',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '19',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '20',
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'L', score: 24, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '21',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '22',
          home: { teamId: 'B', score: 17, abbrev: 'UA' },
          away: { teamId: 'N', score: 20, abbrev: 'MISST' },
        }),
        // Team C: 8 wins, 3 losses
        createGameLean({
          gameId: '23',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
        createGameLean({
          gameId: '24',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'E', score: 24, abbrev: 'TENN' },
        }),
        createGameLean({
          gameId: '25',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'F', score: 24, abbrev: 'FLA' },
        }),
        createGameLean({
          gameId: '26',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'G', score: 24, abbrev: 'AUB' },
        }),
        createGameLean({
          gameId: '27',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'H', score: 24, abbrev: 'ARK' },
        }),
        createGameLean({
          gameId: '28',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'I', score: 24, abbrev: 'TEX' },
        }),
        createGameLean({
          gameId: '29',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'J', score: 24, abbrev: 'OKLA' },
        }),
        createGameLean({
          gameId: '30',
          home: { teamId: 'C', score: 28, abbrev: 'LSU' },
          away: { teamId: 'K', score: 24, abbrev: 'MISS' },
        }),
        createGameLean({
          gameId: '31',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'L', score: 20, abbrev: 'VAND' },
        }),
        createGameLean({
          gameId: '32',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'M', score: 20, abbrev: 'SCAR' },
        }),
        createGameLean({
          gameId: '33',
          home: { teamId: 'C', score: 17, abbrev: 'LSU' },
          away: { teamId: 'N', score: 20, abbrev: 'MISST' },
        }),
      ];

      const result = applyRuleTotalWins(['A', 'B', 'C'], games);

      expect(result.winners).toContain('A');
      expect(result.winners).toContain('B');
      expect(result.winners).not.toContain('C');
      expect(result.detail).toContain('9 wins');
    });
  });

  describe('Edge Cases', () => {
    it('Ignores incomplete games when counting wins', () => {
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
          home: { teamId: 'B', score: 28, abbrev: 'UA' },
          away: { teamId: 'D', score: 24, abbrev: 'UGA' },
        }),
      ];

      const result = applyRuleTotalWins(['A', 'B'], games);

      expect(result.winners).toEqual(['B']);
      expect(result.winners).not.toContain('A');
    });
  });
});

