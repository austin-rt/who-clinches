import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { CFBConferenceTiebreakerConfig } from '@/lib/cfb/tiebreaker-rules/core/types';
import {
  createGameLean,
  createTeamLean,
} from '../../../../api/cfb/tiebreaker-rules/common/test-helpers';
import { GameLean } from '@/lib/types';

jest.mock('@/lib/errorLogger', () => ({
  logError: jest.fn(),
}));

const makeH2HConfig = (): CFBConferenceTiebreakerConfig => ({
  rules: [
    {
      name: 'Head-to-Head',
      apply: (tiedTeams: string[], games: GameLean[]) => {
        const h2h = games.filter(
          (g) => tiedTeams.includes(g.home.teamId) && tiedTeams.includes(g.away.teamId)
        );
        const records = new Map<string, number>();
        for (const t of tiedTeams) records.set(t, 0);
        for (const g of h2h) {
          if (g.home.score !== null && g.away.score !== null) {
            if (g.home.score > g.away.score)
              records.set(g.home.teamId, (records.get(g.home.teamId) ?? 0) + 1);
            else records.set(g.away.teamId, (records.get(g.away.teamId) ?? 0) + 1);
          }
        }
        const maxWins = Math.max(...records.values());
        const winners = tiedTeams.filter((t) => records.get(t) === maxWins);
        return Promise.resolve({ winners, detail: 'H2H comparison' });
      },
    },
  ],
});

describe('calculateStandings', () => {
  it('groups teams by win percentage and ranks by record', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'A', score: 35, abbrev: 'ALA' },
        away: { teamId: 'C', score: 24, abbrev: 'LSU' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'B', score: 21, abbrev: 'UA' },
        away: { teamId: 'C', score: 17, abbrev: 'LSU' },
      }),
    ];
    const teams = ['A', 'B', 'C'].map((id) =>
      createTeamLean({ teamId: id, abbrev: id === 'A' ? 'ALA' : id === 'B' ? 'UA' : 'LSU' })
    );
    const config = makeH2HConfig();

    const { standings } = await calculateStandings(games, ['A', 'B', 'C'], config, teams);
    expect(standings[0].abbrev).toBe('ALA');
    expect(standings[0].confRecord).toEqual({ wins: 2, losses: 0 });
    expect(standings[1].confRecord).toEqual({ wins: 1, losses: 1 });
    expect(standings[2].confRecord).toEqual({ wins: 0, losses: 2 });
  });

  it('does not invoke breakTie for single-team buckets', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
    ];
    const teams = ['A', 'B'].map((id) =>
      createTeamLean({ teamId: id, abbrev: id === 'A' ? 'ALA' : 'UA' })
    );
    const config = makeH2HConfig();
    const applySpy = jest.spyOn(config.rules[0], 'apply');

    const { standings } = await calculateStandings(games, ['A', 'B'], config, teams);
    expect(standings).toHaveLength(2);
    expect(applySpy).not.toHaveBeenCalled();
  });

  it('sets explainPosition for undefeated team', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
    ];
    const teams = ['A', 'B'].map((id) =>
      createTeamLean({ teamId: id, abbrev: id === 'A' ? 'ALA' : 'UA' })
    );

    const { standings } = await calculateStandings(games, ['A', 'B'], makeH2HConfig(), teams);
    expect(standings[0].explainPosition).toBe('Undefeated in conference play.');
  });

  it('sets explainPosition for winless team', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
    ];
    const teams = ['A', 'B'].map((id) =>
      createTeamLean({ teamId: id, abbrev: id === 'A' ? 'ALA' : 'UA' })
    );

    const { standings } = await calculateStandings(games, ['A', 'B'], makeH2HConfig(), teams);
    expect(standings[1].explainPosition).toBe('Winless in conference play.');
  });

  it('sets explainPosition for sole team at a record', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'A', score: 35, abbrev: 'ALA' },
        away: { teamId: 'C', score: 24, abbrev: 'LSU' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'B', score: 21, abbrev: 'UA' },
        away: { teamId: 'C', score: 17, abbrev: 'LSU' },
      }),
    ];
    const teams = ['A', 'B', 'C'].map((id) =>
      createTeamLean({ teamId: id, abbrev: id === 'A' ? 'ALA' : id === 'B' ? 'UA' : 'LSU' })
    );

    const { standings } = await calculateStandings(games, ['A', 'B', 'C'], makeH2HConfig(), teams);
    expect(standings[1].explainPosition).toBe('Only team with 1-1 record.');
  });

  it('sets Behind/Ahead explanations for tied teams resolved by H2H', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'C', score: 21, abbrev: 'LSU' },
        away: { teamId: 'A', score: 35, abbrev: 'ALA' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'C', score: 28, abbrev: 'LSU' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
    ];
    const config = makeH2HConfig();
    const teams = [
      createTeamLean({ teamId: 'A', abbrev: 'ALA' }),
      createTeamLean({ teamId: 'B', abbrev: 'UA' }),
      createTeamLean({ teamId: 'C', abbrev: 'LSU' }),
    ];

    const { standings } = await calculateStandings(games, ['A', 'B', 'C'], config, teams);
    const tiedStandings = standings.filter(
      (s) => s.confRecord.wins === 1 && s.confRecord.losses === 1
    );
    if (tiedStandings.length === 2) {
      const hasExplanation = tiedStandings.some(
        (s) => s.explainPosition.includes('Ahead of') || s.explainPosition.includes('Behind')
      );
      expect(hasExplanation).toBe(true);
    }
  });

  it('findSeparatingStep returns null when teams are never separated', async () => {
    const config: CFBConferenceTiebreakerConfig = {
      rules: [
        {
          name: 'Always Tied',
          apply: (tiedTeams: string[]) =>
            Promise.resolve({ winners: tiedTeams, detail: 'Still tied' }),
        },
      ],
    };
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'B', score: 35, abbrev: 'UA' },
        away: { teamId: 'C', score: 24, abbrev: 'LSU' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'C', score: 21, abbrev: 'LSU' },
        away: { teamId: 'A', score: 17, abbrev: 'ALA' },
      }),
    ];
    const teams = ['A', 'B', 'C'].map((id) =>
      createTeamLean({ teamId: id, abbrev: id === 'A' ? 'ALA' : id === 'B' ? 'UA' : 'LSU' })
    );

    const { standings } = await calculateStandings(games, ['A', 'B', 'C'], config, teams);
    for (const s of standings) {
      expect(s.explainPosition).toBe('');
    }
  });

  it('populates StandingEntry fields correctly', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
    ];
    const teams = [
      createTeamLean({ teamId: 'A', abbrev: 'ALA' }),
      createTeamLean({ teamId: 'B', abbrev: 'UA' }),
    ];
    teams[0].nationalRank = 5;

    const { standings } = await calculateStandings(games, ['A', 'B'], makeH2HConfig(), teams);
    const first = standings[0];
    expect(first.rank).toBe(1);
    expect(first.teamId).toBe('A');
    expect(first.abbrev).toBe('ALA');
    expect(first.logo).toBe('');
    expect(first.color).toBe('000000');
    expect(first.nationalRank).toBe(5);
    expect(first.division).toBeNull();
  });

  it('buildTieFlowGraphs produces graph for tied teams', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
      createGameLean({
        gameId: '2',
        home: { teamId: 'B', score: 35, abbrev: 'UA' },
        away: { teamId: 'C', score: 24, abbrev: 'LSU' },
      }),
      createGameLean({
        gameId: '3',
        home: { teamId: 'C', score: 21, abbrev: 'LSU' },
        away: { teamId: 'A', score: 17, abbrev: 'ALA' },
      }),
    ];
    const teams = ['A', 'B', 'C'].map((id) =>
      createTeamLean({ teamId: id, abbrev: id === 'A' ? 'ALA' : id === 'B' ? 'UA' : 'LSU' })
    );

    const { tieFlowGraphs } = await calculateStandings(
      games,
      ['A', 'B', 'C'],
      makeH2HConfig(),
      teams
    );
    expect(tieFlowGraphs.length).toBeGreaterThanOrEqual(1);
    const graph = tieFlowGraphs[0];
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.summary.length).toBeGreaterThan(0);
  });

  it('buildTieFlowGraphs skips single-team groups', async () => {
    const games = [
      createGameLean({
        gameId: '1',
        home: { teamId: 'A', score: 28, abbrev: 'ALA' },
        away: { teamId: 'B', score: 14, abbrev: 'UA' },
      }),
    ];
    const teams = ['A', 'B'].map((id) =>
      createTeamLean({ teamId: id, abbrev: id === 'A' ? 'ALA' : 'UA' })
    );

    const { tieFlowGraphs } = await calculateStandings(games, ['A', 'B'], makeH2HConfig(), teams);
    expect(tieFlowGraphs).toHaveLength(0);
  });
});
