import { CFB_B1G_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/b1g/config';
import { createGameLean, runTiebreaker } from '../common/test-helpers';

jest.mock('@/lib/errorLogger', () => ({ logError: jest.fn() }));

describe('B1G integration', () => {
  it('Opponent Win Percentage breaks tie when earlier rules pass through', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'OSU' },
        away: { teamId: 'C', score: 14, abbrev: 'MICH' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'B', score: 28, abbrev: 'PSU' },
        away: { teamId: 'D', score: 14, abbrev: 'IND' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'C', score: 28, abbrev: 'MICH' },
        away: { teamId: 'E', score: 14, abbrev: 'WISC' },
      }),
      createGameLean({
        gameId: '4',
        home: { teamId: 'F', score: 28, abbrev: 'IOWA' },
        away: { teamId: 'D', score: 14, abbrev: 'IND' },
      }),
    ];

    const result = await runTiebreaker({
      tiedTeams: ['A', 'B'],
      games,
      allTeams: ['A', 'B', 'C', 'D', 'E', 'F'],
      config: CFB_B1G_TIEBREAKER_CONFIG,
    });

    expect(result.ranked).toEqual(['A', 'B']);
    const breakStep = result.steps.find((s) => s.tieBroken && s.rule === 'Opponent Win Percentage');
    expect(breakStep).toBeDefined();
  });
});
