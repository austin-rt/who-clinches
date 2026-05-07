import { CFB_CUSA_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/cusa/config';
import { createGameLean, createTeamLean, runTiebreaker } from '../common/test-helpers';

jest.mock('@/lib/errorLogger', () => ({ logError: jest.fn() }));

describe('C-USA integration', () => {
  it('Team Rating Score fires before Opponent Win Percentage', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'LT' },
        away: { teamId: 'C', score: 14, abbrev: 'WKU' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'B', score: 28, abbrev: 'JMU' },
        away: { teamId: 'D', score: 14, abbrev: 'MTSU' },
      }),
    ];

    const teams = [
      createTeamLean({ teamId: 'A', abbrev: 'LT', spPlusRating: 5, sor: 4 }),
      createTeamLean({ teamId: 'B', abbrev: 'JMU', spPlusRating: 20, sor: 19 }),
    ];

    const result = await runTiebreaker({
      tiedTeams: ['A', 'B'],
      games,
      allTeams: ['A', 'B', 'C', 'D'],
      config: CFB_CUSA_TIEBREAKER_CONFIG,
      teams,
    });

    expect(result.ranked).toEqual(['A', 'B']);
    const trsStep = result.steps.find((s) => s.tieBroken && s.rule === 'Team Rating Score');
    expect(trsStep).toBeDefined();
    expect(result.steps.find((s) => s.rule === 'Opponent Win Percentage')).toBeUndefined();
  });
});
