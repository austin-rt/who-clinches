import { CFB_BIG12_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/big12/config';
import { createGameLean, runTiebreaker } from '../common/test-helpers';

jest.mock('@/lib/errorLogger', () => ({ logError: jest.fn() }));

describe('Big 12 integration', () => {
  it('Total Wins breaks tie when earlier rules pass through', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'TEX' },
        away: { teamId: 'C', score: 14, abbrev: 'BYU' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'A', score: 35, abbrev: 'TEX' },
        away: { teamId: 'D', score: 21, abbrev: 'UCF' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'A', score: 42, abbrev: 'TEX' },
        away: { teamId: 'E', score: 7, abbrev: 'HOU' },
      }),
      createGameLean({
        gameId: '4',
        home: { teamId: 'B', score: 21, abbrev: 'OSU' },
        away: { teamId: 'F', score: 14, abbrev: 'CIN' },
      }),
    ];

    const result = await runTiebreaker({
      tiedTeams: ['A', 'B'],
      games,
      allTeams: ['A', 'B', 'C', 'D', 'E', 'F'],
      config: CFB_BIG12_TIEBREAKER_CONFIG,
    });

    expect(result.ranked).toEqual(['A', 'B']);
    const breakStep = result.steps.find((s) => s.tieBroken && s.rule === 'Total Wins');
    expect(breakStep).toBeDefined();
  });
});
