import { Redis } from '@upstash/redis';

const useFixtures = process.env.USE_FIXTURES === 'true';

export const redis = useFixtures
  ? (null as unknown as Redis)
  : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

export const fetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number,
): Promise<T> => {
  if (useFixtures) return fetcher();

  const hit = await redis.get<T>(key);
  if (hit) return hit;
  const fresh = await fetcher();
  if (ttl) {
    await redis.set(key, fresh, { ex: ttl });
  } else {
    await redis.set(key, fresh);
  }
  return fresh;
};
