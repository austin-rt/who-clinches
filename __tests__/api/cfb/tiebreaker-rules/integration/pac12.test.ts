import { CFB_PAC12_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/pac12/config';
import { createGameLean, createTeamLean, runTiebreaker } from '../common/test-helpers';

jest.mock('@/lib/errorLogger', () => ({ logError: jest.fn() }));

describe('Pac-12 integration', () => {
  it('HPCO fires before Common Opponents due to swapped rule order', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ORE' },
        away: { teamId: 'C', score: 14, abbrev: 'WSU' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'D', score: 28, abbrev: 'ORST' },
        away: { teamId: 'A', score: 14, abbrev: 'ORE' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'C', score: 28, abbrev: 'WSU' },
        away: { teamId: 'B', score: 14, abbrev: 'WASH' },
      }),
      createGameLean({
        gameId: '4',
        home: { teamId: 'B', score: 28, abbrev: 'WASH' },
        away: { teamId: 'D', score: 14, abbrev: 'ORST' },
      }),
      createGameLean({
        gameId: '5',
        home: { teamId: 'C', score: 28, abbrev: 'WSU' },
        away: { teamId: 'E', score: 14, abbrev: 'COLO' },
      }),
    ];

    const teams = ['A', 'B', 'C', 'D', 'E'].map((id) => createTeamLean({ teamId: id, abbrev: id }));

    const result = await runTiebreaker({
      tiedTeams: ['A', 'B'],
      games,
      allTeams: ['A', 'B', 'C', 'D', 'E'],
      config: CFB_PAC12_TIEBREAKER_CONFIG,
      teams,
    });

    expect(result.ranked).toEqual(['A', 'B']);
    const breakStep = result.steps.find(
      (s) => s.tieBroken && s.rule === 'Highest Placed Common Opponent'
    );
    expect(breakStep).toBeDefined();
    expect(result.steps.find((s) => s.rule === 'Record Against Common Opponents')).toBeUndefined();
  });
});
