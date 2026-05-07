import { CFB_AAC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/aac/config';
import { createGameLean, createTeamLean, runTiebreaker } from '../common/test-helpers';

jest.mock('@/lib/errorLogger', () => ({ logError: jest.fn() }));

describe('AAC integration', () => {
  it('Team Rating Score fires at step 2 with useCfpRankingsFirst', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'MEM' },
        away: { teamId: 'C', score: 14, abbrev: 'TUL' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'B', score: 28, abbrev: 'USF' },
        away: { teamId: 'D', score: 14, abbrev: 'UAB' },
      }),
    ];

    const teams = [
      createTeamLean({ teamId: 'A', abbrev: 'MEM', nationalRank: 10, spPlusRating: 5, sor: 4 }),
      createTeamLean({ teamId: 'B', abbrev: 'USF', nationalRank: 20, spPlusRating: 20, sor: 19 }),
    ];

    const result = await runTiebreaker({
      tiedTeams: ['A', 'B'],
      games,
      allTeams: ['A', 'B'],
      config: CFB_AAC_TIEBREAKER_CONFIG,
      teams,
    });

    expect(result.ranked).toEqual(['A', 'B']);
    expect(result.steps[0].rule).toBe('Head-to-Head');
    expect(result.steps[0].tieBroken).toBe(false);
    expect(result.steps[1].rule).toBe('Team Rating Score');
    expect(result.steps[1].tieBroken).toBe(true);
  });
});
