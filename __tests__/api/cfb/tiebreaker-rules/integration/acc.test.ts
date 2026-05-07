import { CFB_ACC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/acc/config';
import { createGameLean, runTiebreaker } from '../common/test-helpers';

jest.mock('@/lib/errorLogger', () => ({ logError: jest.fn() }));

describe('ACC integration', () => {
  it('ACC H2H eliminates team that lost to all others', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'CLE' },
        away: { teamId: 'B', score: 14, abbrev: 'FSU' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'A', score: 35, abbrev: 'CLE' },
        away: { teamId: 'C', score: 21, abbrev: 'MIA' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'B', score: 24, abbrev: 'FSU' },
        away: { teamId: 'C', score: 17, abbrev: 'MIA' },
      }),
    ];

    const result = await runTiebreaker({
      tiedTeams: ['A', 'B', 'C'],
      games,
      allTeams: ['A', 'B', 'C'],
      config: CFB_ACC_TIEBREAKER_CONFIG,
    });

    expect(result.ranked).toEqual(['A', 'B', 'C']);
    const breakStep = result.steps.find((s) => s.tieBroken && s.rule === 'Head-to-Head');
    expect(breakStep).toBeDefined();
  });
});
