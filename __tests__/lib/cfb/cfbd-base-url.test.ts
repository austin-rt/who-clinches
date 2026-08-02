import { JSON_SERVER_URL } from '@/lib/constants';

const mockSetConfig = jest.fn();

jest.mock('cfbd', () => ({
  client: { setConfig: mockSetConfig },
  getGames: jest.fn(),
  getTeams: jest.fn(),
  getLines: jest.fn(),
  getCalendar: jest.fn(),
  getUserInfo: jest.fn(),
  getRankings: jest.fn(),
  getSp: jest.fn(),
  getFpi: jest.fn(),
}));

const loadRestClient = async () => {
  jest.resetModules();
  mockSetConfig.mockClear();
  await import('@/lib/cfb/cfbd-rest-client');
  return mockSetConfig.mock.calls[0][0];
};

describe('cfbd client base url', () => {
  const originalVercel = process.env.VERCEL;
  const originalFixtureYear = process.env.FIXTURE_YEAR;

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
    if (originalFixtureYear === undefined) delete process.env.FIXTURE_YEAR;
    else process.env.FIXTURE_YEAR = originalFixtureYear;
  });

  it('never points at the local json server when deployed on vercel', async () => {
    process.env.VERCEL = '1';
    process.env.FIXTURE_YEAR = '2025';

    const config = await loadRestClient();

    expect(config.baseUrl).toBeUndefined();
  });

  it('points at the local json server when running outside vercel with fixtures', async () => {
    delete process.env.VERCEL;
    process.env.FIXTURE_YEAR = '2025';

    const config = await loadRestClient();

    expect(config.baseUrl).toBe(JSON_SERVER_URL);
  });
});
