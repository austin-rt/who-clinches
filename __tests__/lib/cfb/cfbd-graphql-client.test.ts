import { CFBDGraphQLClient, GRAPHQL_ENDPOINT, MAX_GAMES } from '@/lib/cfb/cfbd-graphql-client';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

jest.mock('@/lib/fetch-with-timeout', () => ({
  fetchWithTimeout: jest.fn(),
}));

jest.mock('@/lib/cfb/cfbd-rest-client', () => ({
  getActiveApiKey: jest.fn(() => 'test-key'),
}));

jest.mock('@/lib/errorLogger', () => ({
  logError: jest.fn(),
}));

jest.mock('graphql-ws', () => ({
  createClient: jest.fn(),
}));

const mockFetch = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>;

const jsonResponse = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, statusText: 'Error', json: () => Promise.resolve(body) }) as unknown as Response;

describe('CFBDGraphQLClient', () => {
  const client = new CFBDGraphQLClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts to the api endpoint rather than the docs host', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: { game: [] } }));

    await client.getConferenceGames({ season: 2025, conference: 'SEC' });

    expect(mockFetch.mock.calls[0][0]).toBe(GRAPHQL_ENDPOINT);
    expect(GRAPHQL_ENDPOINT).not.toContain('graphqldocs');
  });

  it('sends the filter as variables instead of interpolating it into the query', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: { game: [] } }));

    await client.getConferenceGames({ season: 2025, conference: 'SEC' });

    const body = JSON.parse(String(mockFetch.mock.calls[0][1]?.body));
    expect(body.variables.where.season).toEqual({ _eq: 2025 });
    expect(body.variables.limit).toBe(MAX_GAMES);
    expect(body.query).not.toContain('2025');
  });

  it('throws when the transport reports a non-ok response', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, false, 404));

    await expect(client.getConferenceGames({ season: 2025 })).rejects.toThrow('404');
  });

  it('throws with the graphql error messages when the schema rejects the query', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ errors: [{ message: "field 'year' not found in type: 'gameBoolExp'" }] })
    );

    await expect(client.getConferenceGames({ season: 2025 })).rejects.toThrow(
      "field 'year' not found"
    );
  });

  it('throws when a 200 response carries no data', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));

    await expect(client.getConferenceGames({ season: 2025 })).rejects.toThrow('missing data');
  });

  it('unwraps the game collection from the response', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: { game: [{ id: 1 }] } }));

    await expect(client.getConferenceGames({ season: 2025 })).resolves.toEqual([{ id: 1 }]);
  });

  it('refuses to call out without an api key', async () => {
    const { getActiveApiKey } = jest.requireMock('@/lib/cfb/cfbd-rest-client');
    (getActiveApiKey as jest.Mock).mockReturnValueOnce('');

    await expect(client.getConferenceGames({ season: 2025 })).rejects.toThrow('No CFBD API key');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('unwraps the historicalTeam collection for teams', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: { historicalTeam: [{ id: 333 }] } }));

    await expect(client.getConferenceTeams(2025, { conference: 'SEC' })).resolves.toEqual([
      { id: 333 },
    ]);
  });
});
