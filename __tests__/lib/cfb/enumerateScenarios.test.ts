import { enumerateScenarios } from '@/lib/cfb/enumerateScenarios';
import type { GameLean, GameTeam, TeamLean } from '@/lib/types';

const CONF = 'cusa' as const;

const makeGameTeam = (id: string, abbrev: string, score: number | null): GameTeam => ({
  teamId: id,
  abbrev,
  displayName: `Team ${abbrev}`,
  shortDisplayName: abbrev,
  logo: `https://example.com/${id}.png`,
  color: '000000',
  score,
  rank: null,
  division: null,
});

const makeTeam = (id: string, abbrev: string): TeamLean => ({
  _id: id,
  name: `Team ${abbrev}`,
  displayName: `Team ${abbrev}`,
  shortDisplayName: abbrev,
  abbreviation: abbrev,
  logo: `https://example.com/${id}.png`,
  color: '000000',
  alternateColor: 'ffffff',
  conferenceId: 'CUSA',
  division: null,
  record: { overall: '0-0', conference: '0-0', home: '0-0', away: '0-0', stats: {} },
  conferenceStanding: '0th',
});

const makeGame = (
  id: string,
  home: { id: string; abbrev: string },
  homeScore: number | null,
  away: { id: string; abbrev: string },
  awayScore: number | null,
  completed: boolean
): GameLean => ({
  _id: id,
  id,
  displayName: `${home.abbrev} vs ${away.abbrev}`,
  date: '2025-11-01T00:00:00Z',
  week: 10,
  season: 2025,
  sport: 'football',
  league: 'college-football',
  state: completed ? 'post' : 'pre',
  completed,
  conferenceGame: true,
  neutralSite: false,
  venue: { fullName: 'Stadium', city: 'City', state: 'ST', timezone: 'America/Chicago' },
  home: makeGameTeam(home.id, home.abbrev, homeScore),
  away: makeGameTeam(away.id, away.abbrev, awayScore),
  odds: { favoriteTeamId: null, spread: null, overUnder: null },
  predictedScore: { home: 21, away: 14 },
  gameType: { name: 'Regular Season', abbreviation: 'reg' },
});

const alpha = { id: 'alpha', abbrev: 'ALP' };
const bravo = { id: 'bravo', abbrev: 'BRV' };
const charlie = { id: 'charlie', abbrev: 'CHL' };
const delta = { id: 'delta', abbrev: 'DLT' };

const teams = [
  makeTeam(alpha.id, alpha.abbrev),
  makeTeam(bravo.id, bravo.abbrev),
  makeTeam(charlie.id, charlie.abbrev),
  makeTeam(delta.id, delta.abbrev),
];

const allCompletedGames: GameLean[] = [
  makeGame('g1', alpha, 1, bravo, 0, true),
  makeGame('g2', alpha, 1, charlie, 0, true),
  makeGame('g3', alpha, 1, delta, 0, true),
  makeGame('g4', bravo, 1, charlie, 0, true),
  makeGame('g5', bravo, 1, delta, 0, true),
  makeGame('g6', charlie, 1, delta, 0, true),
];

const oneUndecidedGames: GameLean[] = [
  makeGame('g1', alpha, 1, bravo, 0, true),
  makeGame('g2', alpha, 1, charlie, 0, true),
  makeGame('g3', alpha, 1, delta, 0, true),
  makeGame('g4', bravo, 1, charlie, 0, true),
  makeGame('g5', bravo, 1, delta, 0, true),
  makeGame('g6', charlie, null, delta, null, false),
];

const twoUndecidedGames: GameLean[] = [
  makeGame('g1', alpha, 1, bravo, 0, true),
  makeGame('g2', alpha, 1, charlie, 0, true),
  makeGame('g3', alpha, 1, delta, 0, true),
  makeGame('g4', bravo, 1, charlie, 0, true),
  makeGame('g5', bravo, null, delta, null, false),
  makeGame('g6', charlie, null, delta, null, false),
];

describe('enumerateScenarios', () => {
  it('returns early when maxScenarios is 0', async () => {
    const result = await enumerateScenarios({
      conf: CONF,
      teamId: alpha.id,
      games: oneUndecidedGames,
      teams,
      overrides: {},
      maxScenarios: 0,
    });

    expect(result).toEqual({ paths: [], exhaustive: false, scenariosChecked: 0 });
  });

  it('returns early when maxMs is 0', async () => {
    const result = await enumerateScenarios({
      conf: CONF,
      teamId: alpha.id,
      games: oneUndecidedGames,
      teams,
      overrides: {},
      maxMs: 0,
    });

    expect(result).toEqual({ paths: [], exhaustive: false, scenariosChecked: 0 });
  });

  it('runs single simulation when all games are completed and team is in championship', async () => {
    const result = await enumerateScenarios({
      conf: CONF,
      teamId: alpha.id,
      games: allCompletedGames,
      teams,
      overrides: {},
    });

    expect(result).toEqual({ paths: [[]], exhaustive: true, scenariosChecked: 1 });
  });

  it('returns no paths when all games are completed and team is not in championship', async () => {
    const result = await enumerateScenarios({
      conf: CONF,
      teamId: delta.id,
      games: allCompletedGames,
      teams,
      overrides: {},
    });

    expect(result).toEqual({ paths: [], exhaustive: true, scenariosChecked: 1 });
  });

  it('enumerates 2^N scenarios and collects paths where team reaches championship', async () => {
    const result = await enumerateScenarios({
      conf: CONF,
      teamId: alpha.id,
      games: oneUndecidedGames,
      teams,
      overrides: {},
    });

    expect(result.exhaustive).toBe(true);
    expect(result.scenariosChecked).toBe(2);
    expect(result.paths).toHaveLength(2);
    for (const path of result.paths) {
      expect(path).toHaveLength(1);
      expect(path[0].gameId).toBe('g6');
      expect([charlie.id, delta.id]).toContain(path[0].winnerTeamId);
    }
  });

  it('returns no paths when target team never reaches championship across all scenarios', async () => {
    const result = await enumerateScenarios({
      conf: CONF,
      teamId: delta.id,
      games: oneUndecidedGames,
      teams,
      overrides: {},
    });

    expect(result.exhaustive).toBe(true);
    expect(result.scenariosChecked).toBe(2);
    expect(result.paths).toHaveLength(0);
  });

  it('does not enumerate games that already have overrides', async () => {
    const result = await enumerateScenarios({
      conf: CONF,
      teamId: alpha.id,
      games: twoUndecidedGames,
      teams,
      overrides: { g5: { homeScore: 1, awayScore: 0 } },
    });

    expect(result.scenariosChecked).toBe(2);
    expect(result.exhaustive).toBe(true);
  });

  it('does not enumerate games where one team is outside the conference roster', async () => {
    const outsider = { id: 'outsider', abbrev: 'OUT' };
    const gamesWithOutsider = [
      ...oneUndecidedGames,
      makeGame('g7', alpha, null, outsider, null, false),
    ];

    const result = await enumerateScenarios({
      conf: CONF,
      teamId: alpha.id,
      games: gamesWithOutsider,
      teams,
      overrides: {},
    });

    expect(result.scenariosChecked).toBe(2);
    expect(result.exhaustive).toBe(true);
  });

  it('stops at maxScenarios cap and marks result as non-exhaustive', async () => {
    const result = await enumerateScenarios({
      conf: CONF,
      teamId: alpha.id,
      games: twoUndecidedGames,
      teams,
      overrides: {},
      maxScenarios: 2,
    });

    expect(result.scenariosChecked).toBe(2);
    expect(result.exhaustive).toBe(false);
  });
});
