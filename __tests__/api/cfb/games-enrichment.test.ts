import { NextRequest } from 'next/server';

const mockGetGames = jest.fn();
const mockGetTeams = jest.fn();
const mockGetRankings = jest.fn();
const mockGetSp = jest.fn();
const mockGetFpi = jest.fn();
const mockAttachSpPlusToTeams = jest.fn((teams: unknown[]) => teams);
const mockAttachSorToTeams = jest.fn((teams: unknown[]) => teams);

jest.mock('@/lib/cfb/cfbd-cached', () => ({
  getGames: (...args: unknown[]) => mockGetGames(...args),
  getTeams: (...args: unknown[]) => mockGetTeams(...args),
  getRankings: (...args: unknown[]) => mockGetRankings(...args),
  getSp: (...args: unknown[]) => mockGetSp(...args),
  getFpi: (...args: unknown[]) => mockGetFpi(...args),
}));

jest.mock('@/lib/cfb/helpers/attach-sp-plus', () => ({
  attachSpPlusToTeams: (teams: unknown[]) => mockAttachSpPlusToTeams(teams),
}));

jest.mock('@/lib/cfb/helpers/attach-sor', () => ({
  attachSorToTeams: (teams: unknown[]) => mockAttachSorToTeams(teams),
}));

jest.mock('@/lib/cfb/tiebreaker-rules/core/calculateStandings', () => ({
  calculateStandings: jest
    .fn()
    .mockResolvedValue({ standings: [], tieLogs: [], tieFlowGraphs: [] }),
}));

jest.mock('@/lib/cfb/tiebreaker-rules/core/calculateDivisionalStandings', () => ({
  calculateDivisionalStandings: jest
    .fn()
    .mockResolvedValue({ standings: [], tieLogs: [], tieFlowGraphs: [] }),
}));

jest.mock('@/lib/cfb/helpers/get-default-season-cfbd', () => ({
  getDefaultSeasonFromCfbd: jest.fn().mockResolvedValue(2025),
}));

jest.mock('@/lib/errorLogger', () => ({
  logError: jest.fn(),
}));

const baseCfbdGame = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  conferenceGame: true,
  notes: null,
  homeId: 1,
  homeTeam: 'Home Team',
  homeConference: 'SEC',
  homePoints: 28,
  awayId: 2,
  awayTeam: 'Away Team',
  awayConference: 'SEC',
  awayPoints: 21,
  season: 2025,
  week: 1,
  seasonType: 'regular',
  startDate: '2025-09-06T12:00:00.000Z',
  completed: true,
  venue: 'Stadium',
  city: 'City',
  state: 'ST',
  neutralSite: false,
  ...overrides,
});

const baseCfbdTeam = (id: number, name: string) => ({
  id,
  school: name,
  mascot: 'Mascot',
  abbreviation: name.substring(0, 3).toUpperCase(),
  conference: 'SEC',
  division: null,
  color: '000000',
  altColor: 'ffffff',
  logos: ['logo.png'],
});

const makeRequest = (conf: string, query = '') => {
  const url = `http://localhost:3000/api/games/cfb/${conf}?season=2025${query}`;
  return new NextRequest(
    new Request(url, {
      headers: { host: 'localhost:3000' },
    })
  );
};

const setupBaseMocks = () => {
  mockGetGames.mockResolvedValue([baseCfbdGame()]);
  mockGetTeams.mockResolvedValue({
    SEC: [baseCfbdTeam(1, 'Home Team'), baseCfbdTeam(2, 'Away Team')],
  });
  mockGetRankings.mockResolvedValue([]);
  mockGetSp.mockResolvedValue([]);
  mockGetFpi.mockResolvedValue([]);
};

describe('games API enrichment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupBaseMocks();
  });

  it('filters out championship games', async () => {
    mockGetGames.mockResolvedValue([
      baseCfbdGame(),
      baseCfbdGame({ id: 2, notes: 'SEC Championship' }),
    ]);

    const { GET } = await import('@/app/api/games/[sport]/[conf]/route');
    const res = await GET(makeRequest('sec'), {
      params: Promise.resolve({ sport: 'cfb', conf: 'sec' }),
    });
    const data = await res.json();

    const gameIds = data.events.map((e: { id: string }) => e.id);
    expect(gameIds).not.toContain('2');
  });

  it('fetches SP+ and FPI for conferences that need ratings', async () => {
    const { GET } = await import('@/app/api/games/[sport]/[conf]/route');

    mockGetTeams.mockResolvedValue({
      'American Athletic Conference': [baseCfbdTeam(1, 'Home Team'), baseCfbdTeam(2, 'Away Team')],
    });

    await GET(makeRequest('aac'), {
      params: Promise.resolve({ sport: 'cfb', conf: 'aac' }),
    });

    expect(mockGetSp).toHaveBeenCalled();
    expect(mockGetFpi).toHaveBeenCalled();
  });

  it('skips SP+ and FPI for conferences without ratings', async () => {
    const { GET } = await import('@/app/api/games/[sport]/[conf]/route');
    await GET(makeRequest('sec'), {
      params: Promise.resolve({ sport: 'cfb', conf: 'sec' }),
    });

    expect(mockGetSp).not.toHaveBeenCalled();
    expect(mockGetFpi).not.toHaveBeenCalled();
  });

  it('sets short cache duration for live games', async () => {
    mockGetGames.mockResolvedValue([
      baseCfbdGame({
        completed: false,
        startDate: new Date(Date.now() - 60_000).toISOString(),
        homePoints: null,
        awayPoints: null,
      }),
    ]);

    const { GET } = await import('@/app/api/games/[sport]/[conf]/route');
    const res = await GET(makeRequest('sec'), {
      params: Promise.resolve({ sport: 'cfb', conf: 'sec' }),
    });

    expect(res.headers.get('Cache-Control')).toContain('s-maxage=10');
  });

  it('sets standard cache duration when no live games', async () => {
    const { GET } = await import('@/app/api/games/[sport]/[conf]/route');
    const res = await GET(makeRequest('sec'), {
      params: Promise.resolve({ sport: 'cfb', conf: 'sec' }),
    });

    expect(res.headers.get('Cache-Control')).toContain('s-maxage=60');
  });

  it('returns 400 when week provided without season', async () => {
    const url = 'http://localhost:3000/api/games/cfb/sec?week=3';
    const req = new NextRequest(
      new Request(url, {
        headers: { host: 'localhost:3000' },
      })
    );

    const { GET } = await import('@/app/api/games/[sport]/[conf]/route');
    const res = await GET(req, {
      params: Promise.resolve({ sport: 'cfb', conf: 'sec' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('MISSING_SEASON');
  });
});
