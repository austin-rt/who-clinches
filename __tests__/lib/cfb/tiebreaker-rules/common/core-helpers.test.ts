import {
  filterRegularSeasonGames,
  applyOverrides,
  getTeamRecord,
  formatList,
} from '@/lib/cfb/tiebreaker-rules/common/core-helpers';
import { createGameLean } from '../../../../api/cfb/tiebreaker-rules/common/test-helpers';
import { GameLean } from '@/lib/types';

jest.mock('@/lib/errorLogger', () => ({
  logError: jest.fn(),
}));

describe('core-helpers', () => {
  describe('filterRegularSeasonGames', () => {
    const makeGame = (): GameLean =>
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 24, abbrev: 'UA' },
      });

    const makeGameWithType = (abbreviation: string, notes?: string): GameLean => ({
      ...makeGame(),
      gameType: { name: abbreviation, abbreviation },
      ...(notes !== undefined ? { notes } : {}),
    });

    it('keeps regular season games', () => {
      const games = [makeGameWithType('reg')];
      expect(filterRegularSeasonGames(games)).toHaveLength(1);
    });

    it('keeps spring regular season games', () => {
      const games = [makeGameWithType('spring_reg')];
      expect(filterRegularSeasonGames(games)).toHaveLength(1);
    });

    it('rejects postseason games', () => {
      const games = [makeGameWithType('post')];
      expect(filterRegularSeasonGames(games)).toHaveLength(0);
    });

    it('rejects spring postseason games', () => {
      const games = [makeGameWithType('spring_post')];
      expect(filterRegularSeasonGames(games)).toHaveLength(0);
    });

    it('rejects games with championship in notes (case-insensitive)', () => {
      const games = [makeGameWithType('reg', 'SEC Championship Game')];
      expect(filterRegularSeasonGames(games)).toHaveLength(0);
    });

    it('rejects games with no gameType', () => {
      const game = makeGame();
      delete (game as Partial<Pick<GameLean, 'gameType'>>).gameType;
      expect(filterRegularSeasonGames([game])).toHaveLength(0);
    });

    it('rejects unknown abbreviations', () => {
      const games = [makeGameWithType('allstar')];
      expect(filterRegularSeasonGames(games)).toHaveLength(0);
    });
  });

  describe('applyOverrides', () => {
    const baseGame = () =>
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: null, abbrev: 'ALA' },
        away: { teamId: 'B', score: null, abbrev: 'UA' },
      });

    it('applies override scores to the game', () => {
      const game = baseGame();
      const result = applyOverrides([game], { '1': { homeScore: 35, awayScore: 21 } });
      expect(result[0].home.score).toBe(35);
      expect(result[0].away.score).toBe(21);
    });

    it('throws on tie scores', () => {
      const game = baseGame();
      expect(() => applyOverrides([game], { '1': { homeScore: 21, awayScore: 21 } })).toThrow(
        'Tie scores not allowed'
      );
    });

    it('throws on negative scores', () => {
      const game = baseGame();
      expect(() => applyOverrides([game], { '1': { homeScore: -1, awayScore: 21 } })).toThrow(
        'Scores cannot be negative'
      );
    });

    it('throws on non-integer scores', () => {
      const game = baseGame();
      expect(() => applyOverrides([game], { '1': { homeScore: 3.5, awayScore: 21 } })).toThrow(
        'Scores must be whole numbers'
      );
    });

    it('falls back to predictedScore when no scores and no override', () => {
      const game = baseGame();
      const result = applyOverrides([game], {});
      expect(result[0].home.score).toBe(game.predictedScore.home);
      expect(result[0].away.score).toBe(game.predictedScore.away);
    });

    it('throws when no scores, no override, and no predictedScore', () => {
      const game = { ...baseGame(), predictedScore: undefined } as unknown as GameLean;
      expect(() => applyOverrides([game], {})).toThrow('has no scores and no predictedScore');
    });

    it('passes through games with actual scores when no override', () => {
      const game = createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 42, abbrev: 'ALA' },
        away: { teamId: 'B', score: 17, abbrev: 'UA' },
      });
      const result = applyOverrides([game], {});
      expect(result[0].home.score).toBe(42);
      expect(result[0].away.score).toBe(17);
    });
  });

  describe('getTeamRecord', () => {
    it('counts wins and losses for team as both home and away with correct winPct', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 14, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'C', score: 21, abbrev: 'LSU' },
          away: { teamId: 'A', score: 35, abbrev: 'ALA' },
        }),
        createGameLean({
          gameId: '3',
          home: { teamId: 'A', score: 10, abbrev: 'ALA' },
          away: { teamId: 'D', score: 17, abbrev: 'AUB' },
        }),
      ];
      const record = getTeamRecord('A', games);
      expect(record.wins).toBe(2);
      expect(record.losses).toBe(1);
      expect(record.winPct).toBeCloseTo(2 / 3);
    });

    it('skips games with null scores', () => {
      const games = [
        createGameLean({
          gameId: '1',
          home: { teamId: 'A', score: 28, abbrev: 'ALA' },
          away: { teamId: 'B', score: 14, abbrev: 'UA' },
        }),
        createGameLean({
          gameId: '2',
          home: { teamId: 'A', score: null, abbrev: 'ALA' },
          away: { teamId: 'C', score: null, abbrev: 'LSU' },
        }),
      ];
      const record = getTeamRecord('A', games);
      expect(record.wins).toBe(1);
      expect(record.losses).toBe(0);
    });

    it('returns winPct 0 when team has no games', () => {
      const record = getTeamRecord('A', []);
      expect(record.wins).toBe(0);
      expect(record.losses).toBe(0);
      expect(record.winPct).toBe(0);
    });
  });

  describe('formatList', () => {
    it('returns empty string for empty array', () => {
      expect(formatList([])).toBe('');
    });

    it('returns the item for single-element array', () => {
      expect(formatList(['Alabama'])).toBe('Alabama');
    });

    it('joins two items with "and"', () => {
      expect(formatList(['Alabama', 'Auburn'])).toBe('Alabama and Auburn');
    });

    it('joins three+ items with Oxford comma', () => {
      expect(formatList(['Alabama', 'Auburn', 'LSU'])).toBe('Alabama, Auburn, and LSU');
    });
  });
});
