import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const fetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number,
): Promise<T> => {
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
