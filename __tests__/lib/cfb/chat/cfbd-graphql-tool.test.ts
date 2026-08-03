import {
  executeCfbdGraphqlQuery,
  graphqlAiEnabled,
  clearGraphqlAiKillMemo,
} from '@/lib/cfb/chat/cfbd-graphql-tool';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { redis } from '@/lib/redis';

jest.mock('@/lib/fetch-with-timeout', () => ({
  fetchWithTimeout: jest.fn(),
}));

jest.mock('@/lib/cfb/cfbd-rest-client', () => ({
  getActiveApiKey: jest.fn(() => 'test-key'),
}));

jest.mock('@/lib/errorLogger', () => ({
  logError: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  redis: { get: jest.fn(), zincrby: jest.fn(() => ({ catch: jest.fn() })) },
}));

const mockFetch = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>;
const mockRedisGet = (redis as unknown as { get: jest.Mock }).get;

const okResponse = (body: unknown) =>
  ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as Response;

const VALID = '{ game(where: {season: {_eq: 2025}}, limit: 5) { id homeTeam } }';

describe('cfbd graphql ai tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearGraphqlAiKillMemo();
    process.env.CFBD_GRAPHQL_AI = 'true';
    mockRedisGet.mockResolvedValue(null);
  });

  afterEach(() => {
    delete process.env.CFBD_GRAPHQL_AI;
  });

  describe('access control', () => {
    it('is disabled unless the env flag is exactly true', async () => {
      process.env.CFBD_GRAPHQL_AI = 'yes';
      clearGraphqlAiKillMemo();

      await expect(graphqlAiEnabled()).resolves.toBe(false);
    });

    it('is disabled when the redis kill switch is set', async () => {
      mockRedisGet.mockResolvedValue('1');

      await expect(graphqlAiEnabled()).resolves.toBe(false);
    });

    it('stays enabled when the kill switch lookup fails', async () => {
      mockRedisGet.mockRejectedValue(new Error('redis down'));

      await expect(graphqlAiEnabled()).resolves.toBe(true);
    });

    it('makes no network call when disabled', async () => {
      process.env.CFBD_GRAPHQL_AI = 'false';
      clearGraphqlAiKillMemo();

      const result = await executeCfbdGraphqlQuery(VALID);

      expect(result).toContain('unavailable');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('query handling', () => {
    it('returns the rejection reason without calling out for an invalid query', async () => {
      const result = await executeCfbdGraphqlQuery('mutation { game(limit: 1) { id } }');

      expect(result).toContain('Query rejected');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns the data payload for a valid query', async () => {
      mockFetch.mockResolvedValue(okResponse({ data: { game: [{ id: 1 }] } }));

      const result = await executeCfbdGraphqlQuery(VALID);

      expect(JSON.parse(result)).toEqual({ game: [{ id: 1 }] });
    });

    it('surfaces schema errors so the model can self-correct', async () => {
      mockFetch.mockResolvedValue(
        okResponse({ errors: [{ message: "field 'year' not found in type: 'gameBoolExp'" }] })
      );

      const result = await executeCfbdGraphqlQuery(VALID);

      expect(result).toContain("field 'year' not found");
    });

    it('points the model at the rest tool when the transport fails', async () => {
      mockFetch.mockRejectedValue(new Error('socket hang up'));

      const result = await executeCfbdGraphqlQuery(VALID);

      expect(result).toContain('cfbd_lookup');
    });

    it('truncates an oversized payload rather than flooding the context', async () => {
      const big = Array.from({ length: 5000 }, (_, i) => ({ id: i, name: 'padding-value' }));
      mockFetch.mockResolvedValue(okResponse({ data: { game: big } }));

      const result = await executeCfbdGraphqlQuery(VALID);

      expect(result).toContain('truncated');
    });
  });
});
