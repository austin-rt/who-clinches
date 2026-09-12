import {
  mergeScoreboardIntoGameNodes,
  overlayScoreboardOntoGames,
} from '@/lib/cfb/helpers/merge-scoreboard';
import type { GqlGameNode, GqlScoreboardNode } from '@/lib/cfb/graphql/map-to-cfbd';
import type { Game, ScoreboardGame } from 'cfbd';

const gameNode = (overrides: Partial<GqlGameNode> = {}): GqlGameNode =>
  ({
    id: 401856674,
    season: 2026,
    week: 2,
    seasonType: 'regular',
    startDate: '2026-09-12T19:30:00',
    startTimeTbd: false,
    status: 'in_progress',
    neutralSite: false,
    conferenceGame: true,
    notes: null,
    venueId: null,
    attendance: null,
    excitement: null,
    homeTeamId: 96,
    homeTeam: 'Kentucky',
    homeConference: 'SEC',
    homeClassification: 'fbs',
    homePoints: null,
    homeLineScores: null,
    homeStartElo: null,
    homeEndElo: null,
    homePostgameWinProb: null,
    awayTeamId: 333,
    awayTeam: 'Alabama',
    awayConference: 'SEC',
    awayClassification: 'fbs',
    awayPoints: null,
    awayLineScores: null,
    awayStartElo: null,
    awayEndElo: null,
    awayPostgameWinProb: null,
    lines: [],
    ...overrides,
  }) as GqlGameNode;

const scoreboardNode = (overrides: Partial<GqlScoreboardNode> = {}): GqlScoreboardNode => ({
  id: 401856674,
  status: 'in_progress',
  currentPeriod: 2,
  currentClock: '09:27',
  homePoints: 14,
  awayPoints: 10,
  ...overrides,
});

describe('mergeScoreboardIntoGameNodes', () => {
  it('overlays live points and status onto the matching game node', () => {
    const merged = mergeScoreboardIntoGameNodes(
      [gameNode()],
      new Map([[401856674, scoreboardNode()]])
    );

    expect(merged[0].homePoints).toBe(14);
    expect(merged[0].awayPoints).toBe(10);
    expect(merged[0].status).toBe('in_progress');
  });

  it('leaves games without a scoreboard entry untouched', () => {
    const merged = mergeScoreboardIntoGameNodes([gameNode({ id: 999 })], new Map());

    expect(merged[0].homePoints).toBeNull();
    expect(merged[0].awayPoints).toBeNull();
  });

  it('keeps existing points when the scoreboard entry has null points', () => {
    const merged = mergeScoreboardIntoGameNodes(
      [gameNode({ homePoints: 7, awayPoints: 3 })],
      new Map([[401856674, scoreboardNode({ homePoints: null, awayPoints: null })]])
    );

    expect(merged[0].homePoints).toBe(7);
    expect(merged[0].awayPoints).toBe(3);
  });
});

describe('overlayScoreboardOntoGames', () => {
  const restGame = (overrides: Partial<Game> = {}): Game =>
    ({
      id: 401856674,
      season: 2026,
      week: 2,
      seasonType: 'regular',
      startDate: '2026-09-12T19:30:00.000Z',
      completed: false,
      homeId: 96,
      homeTeam: 'Kentucky',
      homePoints: null,
      awayId: 333,
      awayTeam: 'Alabama',
      awayPoints: null,
      conferenceGame: true,
      ...overrides,
    }) as Game;

  const restScoreboard = (overrides: Record<string, unknown> = {}): ScoreboardGame =>
    ({
      id: 401856674,
      status: 'in_progress',
      homeTeam: { id: 96, name: 'Kentucky', points: 14 },
      awayTeam: { id: 333, name: 'Alabama', points: 10 },
      ...overrides,
    }) as unknown as ScoreboardGame;

  it('overlays live points from the REST scoreboard', () => {
    const merged = overlayScoreboardOntoGames([restGame()], [restScoreboard()]);

    expect(merged[0].homePoints).toBe(14);
    expect(merged[0].awayPoints).toBe(10);
    expect(merged[0].completed).toBe(false);
  });

  it('marks a game completed when the scoreboard says so', () => {
    const merged = overlayScoreboardOntoGames(
      [restGame()],
      [restScoreboard({ status: 'completed' })]
    );

    expect(merged[0].completed).toBe(true);
  });

  it('ignores scoreboard entries for other games', () => {
    const merged = overlayScoreboardOntoGames([restGame({ id: 111 })], [restScoreboard()]);

    expect(merged[0].homePoints).toBeNull();
  });
});
