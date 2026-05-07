import { CFB_MWC_TIEBREAKER_CONFIG } from '@/lib/cfb/tiebreaker-rules/mwc/config';
import { createGameLean, createTeamLean, runTiebreaker } from '../common/test-helpers';

jest.mock('@/lib/errorLogger', () => ({ logError: jest.fn() }));

describe('MWC integration', () => {
  it('conservative H2H does NOT break with incomplete round-robin, falls through to TRS', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'BSU' },
        away: { teamId: 'B', score: 14, abbrev: 'SDSU' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'B', score: 28, abbrev: 'SDSU' },
        away: { teamId: 'C', score: 14, abbrev: 'FRES' },
      }),
    ];

    const teams = [
      createTeamLean({ teamId: 'A', abbrev: 'BSU', nationalRank: 5, spPlusRating: 3, sor: 2 }),
      createTeamLean({ teamId: 'B', abbrev: 'SDSU', nationalRank: 15, spPlusRating: 12, sor: 11 }),
      createTeamLean({ teamId: 'C', abbrev: 'FRES', nationalRank: 25, spPlusRating: 22, sor: 21 }),
    ];

    const result = await runTiebreaker({
      tiedTeams: ['A', 'B', 'C'],
      games,
      allTeams: ['A', 'B', 'C'],
      config: CFB_MWC_TIEBREAKER_CONFIG,
      teams,
    });

    expect(result.ranked).toEqual(['A', 'B', 'C']);
    expect(result.steps[0].rule).toBe('Head-to-Head');
    expect(result.steps[0].tieBroken).toBe(false);
    const trsStep = result.steps.find((s) => s.tieBroken && s.rule === 'Team Rating Score');
    expect(trsStep).toBeDefined();
  });
});
