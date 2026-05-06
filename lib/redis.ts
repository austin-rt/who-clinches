import { Redis } from '@upstash/redis';
import { getRuntimeConfig } from '@/lib/admin/runtime-config';

const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const redis = redisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : (null as unknown as Redis);

const isRedisEnabled = async (): Promise<boolean> => {
  if (!redisConfigured) return false;
  if (process.env.VERCEL_ENV === 'production') return true;
  const config = await getRuntimeConfig();
  return config.redisOn;
};

export const persistRedisKey = async (key: string): Promise<void> => {
  if (!(await isRedisEnabled())) return;
  await redis.persist(key);
};

interface CacheEnvelope<T> {
  data: T;
  cachedAt: number;
}

export const fetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  if (!(await isRedisEnabled())) return fetcher();

  const hit = await redis.get<CacheEnvelope<T>>(key);
  if (hit?.data !== undefined && hit?.cachedAt) return hit.data;
  if (hit !== null && (hit as unknown as CacheEnvelope<T>)?.cachedAt === undefined) {
    return hit as unknown as T;
  }
  const fresh = await fetcher();
  const envelope: CacheEnvelope<T> = { data: fresh, cachedAt: Date.now() };
  if (ttl) {
    await redis.set(key, envelope, { ex: ttl });
  } else {
    await redis.set(key, envelope);
  }
  return fresh;
};
