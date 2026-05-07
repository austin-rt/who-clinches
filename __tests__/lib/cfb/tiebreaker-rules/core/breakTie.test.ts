import { breakTie } from '@/lib/cfb/tiebreaker-rules/core/breakTie';
import { CFBConferenceTiebreakerConfig } from '@/lib/cfb/tiebreaker-rules/core/types';
import { createGameLean } from '../../../../api/cfb/tiebreaker-rules/common/test-helpers';
import { TeamLean } from '@/lib/types';

jest.mock('@/lib/errorLogger', () => ({
  logError: jest.fn(),
}));

const makeConfig = (
  ...rules: Array<{
    name: string;
    winners: string[];
  }>
): CFBConferenceTiebreakerConfig => ({
  rules: rules.map((r) => ({
    name: r.name,
    apply: jest.fn().mockResolvedValue({
      winners: r.winners,
      detail: `${r.name} detail`,
    }),
  })),
});

const games = [
  createGameLean({
    gameId: '1',
    home: { teamId: 'A', score: 28, abbrev: 'ALA' },
    away: { teamId: 'B', score: 14, abbrev: 'UA' },
  }),
  createGameLean({
    gameId: '2',
    home: { teamId: 'B', score: 21, abbrev: 'UA' },
    away: { teamId: 'C', score: 17, abbrev: 'LSU' },
  }),
  createGameLean({
    gameId: '3',
    home: { teamId: 'A', score: 35, abbrev: 'ALA' },
    away: { teamId: 'C', score: 24, abbrev: 'LSU' },
  }),
];

const emptyTeams: TeamLean[] = [];

describe('breakTie', () => {
  it('returns immediately for single-team input', async () => {
    const config = makeConfig({ name: 'Rule A', winners: [] });
    const result = await breakTie(
      ['A'],
      games,
      ['A', 'B', 'C'],
      config,
      new Map(),
      false,
      emptyTeams
    );
    expect(result.ranked).toEqual(['A']);
    expect(result.steps).toHaveLength(0);
    expect(config.rules[0].apply).not.toHaveBeenCalled();
  });

  it('produces Unresolved step when all rules are exhausted', async () => {
    const config = makeConfig(
      { name: 'Rule A', winners: ['A', 'B'] },
      { name: 'Rule B', winners: ['A', 'B'] }
    );
    const result = await breakTie(
      ['A', 'B'],
      games,
      ['A', 'B'],
      config,
      new Map(),
      false,
      emptyTeams
    );
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.rule).toBe('Unresolved');
    expect(lastStep.detail).toBe('All tiebreaker rules exhausted');
    expect(lastStep.tieBroken).toBe(false);
  });

  it('sets elimination explanations only for non-recursive calls', async () => {
    const config = makeConfig({ name: 'Head-to-Head', winners: ['A'] });
    const explanations = new Map<string, string[]>();

    await breakTie(['A', 'B'], games, ['A', 'B', 'C'], config, explanations, false, emptyTeams);
    expect(explanations.has('B')).toBe(true);

    const explanationsRecursive = new Map<string, string[]>();
    await breakTie(
      ['A', 'B'],
      games,
      ['A', 'B', 'C'],
      config,
      explanationsRecursive,
      true,
      emptyTeams
    );
    expect(explanationsRecursive.has('B')).toBe(false);
  });

  it('buildEliminationReason for Head-to-Head includes opponent and record', async () => {
    const config = makeConfig({ name: 'Head-to-Head', winners: ['A'] });
    const explanations = new Map<string, string[]>();
    await breakTie(['A', 'B'], games, ['A', 'B', 'C'], config, explanations, false, emptyTeams);
    const reason = explanations.get('B')![0];
    expect(reason).toContain('head-to-head');
    expect(reason).toMatch(/\d+-\d+/);
  });

  it('buildEliminationReason for Common Opponents shows record', async () => {
    const config = makeConfig({ name: 'Common Opponents', winners: ['A'] });
    const explanations = new Map<string, string[]>();
    await breakTie(['A', 'B'], games, ['A', 'B', 'C'], config, explanations, false, emptyTeams);
    const reason = explanations.get('B')![0];
    expect(reason).toContain('common opponents');
    expect(reason).toMatch(/\d+-\d+/);
  });

  it('buildEliminationReason for Scoring Margin includes margin value', async () => {
    const config = makeConfig({ name: 'Scoring Margin', winners: ['A'] });
    const explanations = new Map<string, string[]>();
    await breakTie(['A', 'B'], games, ['A', 'B', 'C'], config, explanations, false, emptyTeams);
    const reason = explanations.get('B')![0];
    expect(reason).toContain('scoring margin');
  });

  it('buildEliminationReason for Win Percentage shows percentage', async () => {
    const config = makeConfig({ name: 'Opponent Win Percentage', winners: ['A'] });
    const explanations = new Map<string, string[]>();
    await breakTie(['A', 'B'], games, ['A', 'B', 'C'], config, explanations, false, emptyTeams);
    const reason = explanations.get('B')![0];
    expect(reason).toContain('Win Percentage');
    expect(reason).toMatch(/\d+\.\d+%/);
  });
});
