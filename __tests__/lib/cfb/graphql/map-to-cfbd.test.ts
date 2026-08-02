import {
  isCompletedStatus,
  pickLine,
  deriveFavoriteId,
  buildAlternateNames,
  mapGqlGameToCfbdGame,
  mapGqlTeamToCfbdTeam,
  type GqlGameNode,
  type GqlTeamNode,
  type GqlLine,
} from '@/lib/cfb/graphql/map-to-cfbd';
import { buildGameWhere, buildTeamWhere } from '@/lib/cfb/graphql/where';

const line = (providerName: string, providerId: number, spread: number | null): GqlLine => ({
  linesProviderId: providerId,
  provider: { name: providerName },
  spread,
  overUnder: 50,
});

const gameNode = (overrides: Partial<GqlGameNode> = {}): GqlGameNode =>
  ({
    id: 1,
    season: 2025,
    week: 3,
    seasonType: 'regular',
    startDate: '2025-09-13T19:00:00',
    startTimeTbd: null,
    status: 'scheduled',
    neutralSite: null,
    conferenceGame: null,
    notes: null,
    venueId: 100,
    attendance: null,
    excitement: null,
    homeTeamId: 61,
    homeTeam: 'Georgia',
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
    lines: null,
    ...overrides,
  }) as GqlGameNode;

const teamNode = (overrides: Partial<GqlTeamNode> = {}): GqlTeamNode =>
  ({
    id: 333,
    school: 'Alabama',
    mascot: 'Crimson Tide',
    abbreviation: 'ALA',
    conference: 'SEC',
    division: null,
    classification: 'fbs',
    color: '9e1b32',
    altColor: 'ffffff',
    images: ['https://cdn.collegefootballdata.com/logos/500/333.png'],
    altName: null,
    nickname: null,
    shortDisplayName: 'Alabama',
    ...overrides,
  }) as GqlTeamNode;

describe('isCompletedStatus', () => {
  it('treats completed and final as finished', () => {
    expect(isCompletedStatus('completed')).toBe(true);
    expect(isCompletedStatus('Final')).toBe(true);
  });

  it('does not treat a scheduled or in-progress game as finished', () => {
    expect(isCompletedStatus('scheduled')).toBe(false);
    expect(isCompletedStatus('in_progress')).toBe(false);
  });

  it('treats a missing status as not finished', () => {
    expect(isCompletedStatus(null)).toBe(false);
  });
});

describe('pickLine', () => {
  it('prefers the highest priority provider over array order', () => {
    const picked = pickLine([line('ESPN Bet', 3, -1.5), line('DraftKings', 1, 1.5)]);

    expect(picked?.provider?.name).toBe('DraftKings');
  });

  it('prefers a provider carrying a spread over one without', () => {
    const picked = pickLine([line('DraftKings', 1, null), line('Bovada', 2, -7)]);

    expect(picked?.provider?.name).toBe('Bovada');
  });

  it('breaks ties by provider id when no provider is recognized', () => {
    const picked = pickLine([line('Mystery Book', 9, -3), line('Other Book', 4, -3)]);

    expect(picked?.linesProviderId).toBe(4);
  });

  it('returns null when there are no lines', () => {
    expect(pickLine(null)).toBeNull();
    expect(pickLine([])).toBeNull();
  });
});

describe('deriveFavoriteId', () => {
  it('treats a negative spread as the home team favored', () => {
    expect(deriveFavoriteId(-6.5, 61, 333)).toBe(61);
  });

  it('treats a positive spread as the away team favored', () => {
    expect(deriveFavoriteId(6.5, 61, 333)).toBe(333);
  });

  it('returns undefined for a pick em and for a missing spread', () => {
    expect(deriveFavoriteId(0, 61, 333)).toBeUndefined();
    expect(deriveFavoriteId(null, 61, 333)).toBeUndefined();
  });
});

describe('mapGqlGameToCfbdGame', () => {
  it('renames the graphql team ids onto the cfbd shape', () => {
    const game = mapGqlGameToCfbdGame(gameNode());

    expect(game.homeId).toBe(61);
    expect(game.awayId).toBe(333);
  });

  it('derives completed from status rather than a boolean field', () => {
    expect(mapGqlGameToCfbdGame(gameNode({ status: 'completed' })).completed).toBe(true);
    expect(mapGqlGameToCfbdGame(gameNode({ status: 'scheduled' })).completed).toBe(false);
  });

  it('defaults a null startTimeTbd to false', () => {
    expect(mapGqlGameToCfbdGame(gameNode()).startTimeTBD).toBe(false);
  });

  it('carries the chosen line onto spread, overUnder and favoriteId', () => {
    const game = mapGqlGameToCfbdGame(gameNode({ lines: [line('DraftKings', 1, -6.5)] }));

    expect(game.spread).toBe(-6.5);
    expect(game.overUnder).toBe(50);
    expect(game.favoriteId).toBe(61);
  });

  it('leaves odds undefined when the game has no lines', () => {
    const game = mapGqlGameToCfbdGame(gameNode());

    expect(game.spread).toBeUndefined();
    expect(game.favoriteId).toBeUndefined();
  });
});

describe('mapGqlTeamToCfbdTeam', () => {
  it('restores the hash prefix that rest returns on colors', () => {
    const team = mapGqlTeamToCfbdTeam(teamNode());

    expect(team.color).toBe('#9e1b32');
    expect(team.alternateColor).toBe('#ffffff');
  });

  it('does not double prefix a color that already has a hash', () => {
    expect(mapGqlTeamToCfbdTeam(teamNode({ color: '#9e1b32' })).color).toBe('#9e1b32');
  });

  it('keeps conference division distinct from classification', () => {
    const team = mapGqlTeamToCfbdTeam(teamNode({ division: null, classification: 'fbs' }));

    expect(team.division).toBeNull();
    expect(team.classification).toBe('fbs');
  });
});

describe('buildAlternateNames', () => {
  it('deduplicates the name variants graphql exposes', () => {
    expect(buildAlternateNames(teamNode())).toEqual(['ALA', 'Alabama']);
  });

  it('drops empty variants', () => {
    expect(buildAlternateNames(teamNode({ abbreviation: null, shortDisplayName: null }))).toEqual([
      'Alabama',
    ]);
  });
});

describe('buildGameWhere', () => {
  it('matches a conference on either side so road games are not dropped', () => {
    expect(buildGameWhere({ season: 2025, conference: 'SEC' })._or).toEqual([
      { homeConference: { _eq: 'SEC' } },
      { awayConference: { _eq: 'SEC' } },
    ]);
  });

  it('omits the conference clause when no conference is given', () => {
    expect(buildGameWhere({ season: 2025 })._or).toBeUndefined();
  });

  it('omits week when it is not supplied', () => {
    expect(buildGameWhere({ season: 2025 }).week).toBeUndefined();
    expect(buildGameWhere({ season: 2025, week: 0 }).week).toEqual({ _eq: 0 });
  });
});

describe('buildTeamWhere', () => {
  it('bounds a conference stint to the requested season', () => {
    const where = buildTeamWhere(2025, { conference: 'SEC' });

    expect(where.startYear).toEqual({ _lte: 2025 });
    expect(where._or).toEqual([{ endYear: { _isNull: true } }, { endYear: { _gte: 2025 } }]);
  });
});
