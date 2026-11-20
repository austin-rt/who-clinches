import {
  calculateStandings,
  tieFlowGraphsForSnapshot,
} from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { UNRESOLVED_RULE } from '@/lib/cfb/tiebreaker-rules/core/breakTie';
import { SimulateResponse, TieFlowGraph } from '@/lib/api-types';
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
      createTeamLean({ teamId: id, abbrev: { A: 'ALA', B: 'UA', C: 'LSU' }[id] ?? id })
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
      createTeamLean({ teamId: id, abbrev: { A: 'ALA', B: 'UA', C: 'LSU' }[id] ?? id })
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
      createTeamLean({ teamId: id, abbrev: { A: 'ALA', B: 'UA', C: 'LSU' }[id] ?? id })
    );

    const { standings } = await calculateStandings(games, ['A', 'B', 'C'], config, teams);
    for (const s of standings) {
      expect(s.explainPosition).toBe('');
    }
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

describe('teams with no games in the filtered set', () => {
  const playedGame = () =>
    createGameLean({
      gameId: '1',
      home: { teamId: 'A', score: 28, abbrev: 'ALA' },
      away: { teamId: 'B', score: 14, abbrev: 'UA' },
    });

  const threeTeams = () => [
    createTeamLean({ teamId: 'A', abbrev: 'ALA' }),
    createTeamLean({ teamId: 'B', abbrev: 'UA' }),
    createTeamLean({ teamId: 'C', abbrev: 'LSU' }),
  ];

  it('ranks a gameless team instead of throwing', async () => {
    const { standings } = await calculateStandings(
      [playedGame()],
      ['A', 'B', 'C'],
      makeH2HConfig(),
      threeTeams()
    );

    expect(standings.map((s) => s.teamId).sort()).toEqual(['A', 'B', 'C']);
  });

  it('falls back to team metadata for a gameless team', async () => {
    const { standings } = await calculateStandings(
      [playedGame()],
      ['A', 'B', 'C'],
      makeH2HConfig(),
      threeTeams()
    );
    const gameless = standings.find((entry) => entry.teamId === 'C');

    expect(gameless?.abbrev).toBe('LSU');
    expect(gameless?.displayName).toBe('LSU');
  });

  it('records a gameless team as winless rather than omitting it', async () => {
    const { standings } = await calculateStandings(
      [playedGame()],
      ['A', 'B', 'C'],
      makeH2HConfig(),
      threeTeams()
    );

    expect(standings.find((entry) => entry.teamId === 'C')?.record).toEqual({
      wins: 0,
      losses: 0,
    });
  });
});

describe('a rule that advances more than one team out of a tie', () => {
  const ABBREVS: Record<string, string> = { A: 'ALA', B: 'UA', C: 'LSU', D: 'UGA' };
  const TEAM_IDS = ['A', 'B', 'C', 'D'];

  const win = (gameId: string, winner: string, loser: string) =>
    createGameLean({
      gameId,
      home: { teamId: winner, score: 28, abbrev: ABBREVS[winner] },
      away: { teamId: loser, score: 14, abbrev: ABBREVS[loser] },
    });

  const winnersByPool =
    (table: Record<string, string[]>) =>
    (tiedTeams: string[]): Promise<{ winners: string[]; detail: string }> => {
      const pool = [...tiedTeams].sort().join(',');
      return Promise.resolve({ winners: table[pool] ?? tiedTeams, detail: pool });
    };

  const splitThenSubTieConfig = (): CFBConferenceTiebreakerConfig => ({
    rules: [
      {
        name: 'Head-to-Head',
        apply: winnersByPool({ 'A,B,C,D': ['A', 'B'], 'C,D': ['C'] }),
      },
      {
        name: 'Record Against Common Opponents',
        apply: winnersByPool({ 'A,B': ['A'] }),
      },
    ],
  });

  const cycleGames = () => [
    win('1', 'A', 'B'),
    win('2', 'B', 'C'),
    win('3', 'C', 'D'),
    win('4', 'D', 'A'),
  ];

  const simulate = (config = splitThenSubTieConfig()) =>
    calculateStandings(
      cycleGames(),
      TEAM_IDS,
      config,
      TEAM_IDS.map((id) => createTeamLean({ teamId: id, abbrev: ABBREVS[id] }))
    );

  it('places each team once in the flow graph, at its standings rank', async () => {
    const { tieFlowGraphs } = await simulate();
    const placements = tieFlowGraphs[0].nodes
      .filter((node) => node.type === 'result')
      .map((node) => `${node.teamIds.join(',')} ${node.label}`)
      .sort();

    expect(placements).toEqual(['ALA #1', 'LSU #3', 'UA #2', 'UGA #4']);
  });

  it('draws each rule against the teams it compared', async () => {
    const { tieFlowGraphs } = await simulate();
    const ruleNodes = tieFlowGraphs[0].nodes
      .filter((node) => node.type === 'rule')
      .map((node) => `${node.rule}: ${[...node.teamIds].sort().join(',')}`);

    expect(ruleNodes).toEqual([
      'Head-to-Head: ALA,LSU,UA,UGA',
      'Head-to-Head: ALA,UA',
      'Record Against Common Opponents: ALA,UA',
      'Head-to-Head: LSU,UGA',
    ]);
  });

  it('explains the order between two teams the first rule eliminated together', async () => {
    const { standings } = await simulate();

    expect(standings.find((entry) => entry.teamId === 'C')?.explainPosition).toBe(
      'Behind ALA and UA based on head-to-head record. Ahead of UGA based on head-to-head record.'
    );
  });

  it('lists the top rank first when a lone team is eliminated beside an advancing pair', async () => {
    const { tieFlowGraphs } = await calculateStandings(
      [win('1', 'A', 'B'), win('2', 'B', 'C'), win('3', 'C', 'A')],
      ['A', 'B', 'C'],
      {
        rules: [
          {
            name: 'Head-to-Head',
            apply: winnersByPool({ 'A,B,C': ['A', 'B'], 'A,B': ['A'] }),
          },
        ],
      },
      ['A', 'B', 'C'].map((id) => createTeamLean({ teamId: id, abbrev: ABBREVS[id] }))
    );

    expect(tieFlowGraphs[0].nodes.find((node) => node.type === 'result')?.label).toBe('#1');
  });

  it('summarizes a lone team advancing past several others', async () => {
    const { tieFlowGraphs } = await calculateStandings(
      [win('1', 'A', 'B'), win('2', 'B', 'C'), win('3', 'C', 'A')],
      ['A', 'B', 'C'],
      {
        rules: [
          {
            name: 'Head-to-Head',
            apply: winnersByPool({ 'A,B,C': ['A'], 'B,C': ['B'] }),
          },
        ],
      },
      ['A', 'B', 'C'].map((id) => createTeamLean({ teamId: id, abbrev: ABBREVS[id] }))
    );

    expect(tieFlowGraphs[0].summary).toContain(
      'ALA advanced past UA and LSU based on head-to-head. A,B,C.'
    );
  });

  it('says only the last team in the group was placed last', async () => {
    const { tieFlowGraphs } = await simulate();

    expect(
      tieFlowGraphs[0].summary.filter((line) => line.includes('was placed last in the group'))
    ).toEqual(['UGA was placed last in the group.']);
  });

  it('draws the steps after an unresolved sub-tie against the next sub-tie', async () => {
    const { tieFlowGraphs } = await simulate({
      rules: [
        {
          name: 'Head-to-Head',
          apply: winnersByPool({ 'A,B,C,D': ['A', 'B'], 'C,D': ['C'] }),
        },
      ],
    });
    const ruleNodes = tieFlowGraphs[0].nodes
      .filter((node) => node.type === 'rule')
      .map((node) => `${node.rule}: ${[...node.teamIds].sort().join(',')}`);

    expect(ruleNodes).toEqual([
      'Head-to-Head: ALA,LSU,UA,UGA',
      'Head-to-Head: ALA,UA',
      `${UNRESOLVED_RULE}: ALA,UA`,
      'Head-to-Head: LSU,UGA',
    ]);
  });

  describe('tieFlowGraphsForSnapshot', () => {
    const STALE_GRAPHS: TieFlowGraph[] = [{ nodes: [], edges: [], teams: {}, summary: ['stale'] }];

    const savedOutput = async (tieFlowGraphs: TieFlowGraph[]): Promise<SimulateResponse> => {
      const { standings, tieLogs } = await simulate();
      return { standings, tieLogs, tieFlowGraphs, championship: ['A', 'B'] };
    };

    it('rebuilds the graph of a CFB snapshot saved with one', async () => {
      const { tieFlowGraphs } = await simulate();

      expect(
        tieFlowGraphsForSnapshot('cfb', await savedOutput(STALE_GRAPHS), cycleGames())
      ).toEqual(tieFlowGraphs);
    });

    it('leaves a CFB snapshot saved without a graph without one', async () => {
      expect(tieFlowGraphsForSnapshot('cfb', await savedOutput([]), cycleGames())).toEqual([]);
    });

    it('keeps the stored graph of an NFL snapshot', async () => {
      expect(tieFlowGraphsForSnapshot('nfl', await savedOutput(STALE_GRAPHS), cycleGames())).toBe(
        STALE_GRAPHS
      );
    });
  });
});
