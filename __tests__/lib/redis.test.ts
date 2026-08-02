const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: mockGet,
    set: mockSet,
    persist: jest.fn(),
  })),
}));

jest.mock('@/lib/admin/runtime-config', () => ({
  getRuntimeConfig: jest.fn().mockResolvedValue({ redisOn: true }),
}));

const CACHE_KEY = 'cfbd:cfb:test-key';

const loadRedisModule = () => {
  jest.resetModules();
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  delete process.env.FIXTURE_YEAR;
  return import('@/lib/redis');
};

describe('redis fetch ttl resolution', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
  });

  afterAll(() => {
    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  it('does not resolve the ttl thunk when the cache hits', async () => {
    const { fetch } = await loadRedisModule();
    mockGet.mockResolvedValue({ data: ['cached'], cachedAt: Date.now() });
    const ttlThunk = jest.fn().mockResolvedValue(3600);
    const fetcher = jest.fn().mockResolvedValue(['fresh']);

    const result = await fetch(CACHE_KEY, fetcher, ttlThunk);

    expect(result).toEqual(['cached']);
    expect(ttlThunk).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('resolves the ttl thunk on a miss and applies the resolved expiry', async () => {
    const { fetch } = await loadRedisModule();
    mockGet.mockResolvedValue(null);
    const ttlThunk = jest.fn().mockResolvedValue(3600);

    await fetch(CACHE_KEY, () => Promise.resolve(['fresh']), ttlThunk);

    expect(ttlThunk).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(CACHE_KEY, expect.objectContaining({ data: ['fresh'] }), {
      ex: 3600,
    });
  });

  it('still applies a plain numeric ttl', async () => {
    const { fetch } = await loadRedisModule();
    mockGet.mockResolvedValue(null);

    await fetch(CACHE_KEY, () => Promise.resolve(['fresh']), 120);

    expect(mockSet).toHaveBeenCalledWith(CACHE_KEY, expect.objectContaining({ data: ['fresh'] }), {
      ex: 120,
    });
  });

  it('sets no expiry when the ttl thunk resolves undefined', async () => {
    const { fetch } = await loadRedisModule();
    mockGet.mockResolvedValue(null);

    await fetch(
      CACHE_KEY,
      () => Promise.resolve(['fresh']),
      () => Promise.resolve(undefined)
    );

    expect(mockSet).toHaveBeenCalledWith(CACHE_KEY, expect.objectContaining({ data: ['fresh'] }));
  });
});
