import { CFB_SEC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/sec/config';
import { createGameLean, runTiebreaker } from '../common/test-helpers';

jest.mock('@/lib/errorLogger', () => ({ logError: jest.fn() }));

describe('SEC integration', () => {
  it('Scoring Margin breaks tie when earlier rules all tie', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 42, abbrev: 'ALA' },
        away: { teamId: 'C', score: 10, abbrev: 'UGA' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'A', score: 35, abbrev: 'ALA' },
        away: { teamId: 'D', score: 7, abbrev: 'LSU' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'B', score: 21, abbrev: 'AUB' },
        away: { teamId: 'C', score: 20, abbrev: 'UGA' },
      }),
      createGameLean({
        gameId: '4',
        home: { teamId: 'B', score: 14, abbrev: 'AUB' },
        away: { teamId: 'D', score: 13, abbrev: 'LSU' },
      }),
    ];

    const result = await runTiebreaker({
      tiedTeams: ['A', 'B'],
      games,
      allTeams: ['A', 'B', 'C', 'D'],
      config: CFB_SEC_TIEBREAKER_CONFIG,
    });

    expect(result.ranked).toEqual(['A', 'B']);
    const breakStep = result.steps.find((s) => s.tieBroken && s.rule === 'Scoring Margin');
    expect(breakStep).toBeDefined();
  });
});
