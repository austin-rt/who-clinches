import { CFB_SUNBELT_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/sunbelt/config';
import { createGameLean, runTiebreaker } from '../common/test-helpers';

jest.mock('@/lib/errorLogger', () => ({ logError: jest.fn() }));

describe('Sun Belt integration', () => {
  it('Divisional Win Percentage breaks tie at step 2', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'APP', division: 'East' },
        away: { teamId: 'C', score: 14, abbrev: 'GASO', division: 'East' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'A', score: 35, abbrev: 'APP', division: 'East' },
        away: { teamId: 'D', score: 21, abbrev: 'CCU', division: 'East' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'B', score: 24, abbrev: 'JMU', division: 'East' },
        away: { teamId: 'C', score: 17, abbrev: 'GASO', division: 'East' },
      }),
      createGameLean({
        gameId: '4',
        home: { teamId: 'D', score: 28, abbrev: 'CCU', division: 'East' },
        away: { teamId: 'B', score: 14, abbrev: 'JMU', division: 'East' },
      }),
    ];

    const result = await runTiebreaker({
      tiedTeams: ['A', 'B'],
      games,
      allTeams: ['A', 'B', 'C', 'D'],
      config: CFB_SUNBELT_TIEBREAKER_CONFIG,
    });

    expect(result.ranked).toEqual(['A', 'B']);
    expect(result.steps[0].rule).toBe('Head-to-Head');
    expect(result.steps[0].tieBroken).toBe(false);
    const divStep = result.steps.find((s) => s.tieBroken && s.rule === 'Divisional Win Percentage');
    expect(divStep).toBeDefined();
  });
});
