import { NextRequest } from 'next/server';

const mockApplyOverrides = jest.fn();
const mockFilterRegularSeasonGames = jest.fn((games: unknown[]) => games);
const mockCalculateStandings = jest.fn();
const mockCalculateDivisionalStandings = jest.fn();

jest.mock('@/lib/cfb/tiebreaker-rules/common/core-helpers', () => ({
  applyOverrides: (...args: unknown[]) => mockApplyOverrides(...args),
  filterRegularSeasonGames: (games: unknown[]) => mockFilterRegularSeasonGames(games),
}));

jest.mock('@/lib/cfb/tiebreaker-rules/core/calculateStandings', () => ({
  calculateStandings: (...args: unknown[]) => mockCalculateStandings(...args),
}));

jest.mock('@/lib/cfb/tiebreaker-rules/core/calculateDivisionalStandings', () => ({
  calculateDivisionalStandings: (...args: unknown[]) => mockCalculateDivisionalStandings(...args),
}));

jest.mock('@/lib/api/same-origin-gate', () => ({
  checkSameOrigin: () => null,
}));

jest.mock('@/lib/errorLogger', () => ({
  logError: jest.fn(),
}));

const mockStandingsResult = {
  standings: [
    { teamId: 't1', rank: 1, abbrev: 'T1' },
    { teamId: 't2', rank: 2, abbrev: 'T2' },
  ],
  tieLogs: [],
  tieFlowGraphs: [],
};

const baseBody = {
  season: 2025,
  games: [
    {
      id: 'g1',
      home: { teamId: 't1', score: null },
      away: { teamId: 't2', score: null },
      conferenceGame: true,
      completed: false,
      state: 'pre',
      gameType: 'reg',
    },
  ],
  teams: [
    {
      id: 't1',
      name: 'Team 1',
      displayName: 'Team 1',
      shortDisplayName: 'T1',
      abbrev: 'T1',
      logo: '',
      color: '#000',
      alternateColor: '#fff',
      conferenceId: '1',
      division: null,
      record: null,
      conferenceStanding: null,
    },
    {
      id: 't2',
      name: 'Team 2',
      displayName: 'Team 2',
      shortDisplayName: 'T2',
      abbrev: 'T2',
      logo: '',
      color: '#000',
      alternateColor: '#fff',
      conferenceId: '1',
      division: null,
      record: null,
      conferenceStanding: null,
    },
  ],
};

const makeRequest = (conf: string, overrides: Record<string, unknown>) => {
  const url = `http://localhost:3000/api/simulate/cfb/${conf}`;
  return new NextRequest(
    new Request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ ...baseBody, overrides }),
    })
  );
};

describe('simulate override normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyOverrides.mockImplementation((games: unknown[]) => games);
    mockCalculateStandings.mockResolvedValue(mockStandingsResult);
    mockCalculateDivisionalStandings.mockResolvedValue(mockStandingsResult);
  });

  it('SEC preserves exact scores', async () => {
    const { POST } = await import('@/app/api/simulate/[sport]/[conf]/route');
    const overrides = { g1: { homeScore: 35, awayScore: 21 } };
    const req = makeRequest('sec', overrides);

    await POST(req, { params: Promise.resolve({ sport: 'cfb', conf: 'sec' }) });

    const normalizedOverrides = mockApplyOverrides.mock.calls[0][1];
    expect(normalizedOverrides).toEqual({ g1: { homeScore: 35, awayScore: 21 } });
  });

  it('non-SEC normalizes home win to 1-0', async () => {
    const { POST } = await import('@/app/api/simulate/[sport]/[conf]/route');
    const overrides = { g1: { homeScore: 35, awayScore: 21 } };
    const req = makeRequest('big12', overrides);

    await POST(req, { params: Promise.resolve({ sport: 'cfb', conf: 'big12' }) });

    const normalizedOverrides = mockApplyOverrides.mock.calls[0][1];
    expect(normalizedOverrides).toEqual({ g1: { homeScore: 1, awayScore: 0 } });
  });

  it('non-SEC normalizes away win to 0-1', async () => {
    const { POST } = await import('@/app/api/simulate/[sport]/[conf]/route');
    const overrides = { g1: { homeScore: 14, awayScore: 28 } };
    const req = makeRequest('aac', overrides);

    await POST(req, { params: Promise.resolve({ sport: 'cfb', conf: 'aac' }) });

    const normalizedOverrides = mockApplyOverrides.mock.calls[0][1];
    expect(normalizedOverrides).toEqual({ g1: { homeScore: 0, awayScore: 1 } });
  });

  it('empty overrides pass through unchanged', async () => {
    const { POST } = await import('@/app/api/simulate/[sport]/[conf]/route');
    const req = makeRequest('sec', {});

    await POST(req, { params: Promise.resolve({ sport: 'cfb', conf: 'sec' }) });

    const normalizedOverrides = mockApplyOverrides.mock.calls[0][1];
    expect(normalizedOverrides).toEqual({});
  });
});
