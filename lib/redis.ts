import { Redis } from '@upstash/redis';

const vercelEnv = process.env.VERCEL_ENV;
const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
const useRedis = (vercelEnv === 'production' || vercelEnv === 'preview') && redisConfigured;

export const redis = useRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : (null as unknown as Redis);

export const persistRedisKey = async (key: string): Promise<void> => {
  if (!useRedis) return;
  await redis.persist(key);
};

export const fetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  if (!useRedis) return fetcher();

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
