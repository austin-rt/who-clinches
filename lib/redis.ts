import { Redis } from '@upstash/redis';
import { getRuntimeConfig } from '@/lib/admin/runtime-config';
import { logError } from '@/lib/errorLogger';

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
  if (!redisConfigured || process.env.FIXTURE_YEAR) return false;
  if (process.env.VERCEL_ENV === 'production') return true;
  const config = await getRuntimeConfig();
  return config.redisOn;
};

export const persistRedisKey = async (key: string): Promise<void> => {
  if (!(await isRedisEnabled())) return;
  try {
    await redis.persist(key);
  } catch (error) {
    await logError(error, { action: 'redis-persist', key });
  }
};

interface CacheEnvelope<T> {
  data: T;
  cachedAt: number;
}

export type TtlResolver = number | undefined | (() => Promise<number | undefined>);

const resolveTtl = (ttl: TtlResolver): Promise<number | undefined> =>
  typeof ttl === 'function' ? ttl() : Promise.resolve(ttl);

export const fetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: TtlResolver
): Promise<T> => {
  if (!(await isRedisEnabled())) return fetcher();

  let hit: CacheEnvelope<T> | null = null;
  try {
    hit = await redis.get<CacheEnvelope<T>>(key);
  } catch (error) {
    await logError(error, { action: 'redis-get', key });
    return fetcher();
  }

  if (hit?.data !== undefined && hit?.cachedAt) return hit.data;
  if (hit !== null && (hit as unknown as CacheEnvelope<T>)?.cachedAt === undefined) {
    return hit as unknown as T;
  }

  const fresh = await fetcher();
  const envelope: CacheEnvelope<T> = { data: fresh, cachedAt: Date.now() };
  const resolved = await resolveTtl(ttl);
  try {
    if (resolved) {
      await redis.set(key, envelope, { ex: resolved });
    } else {
      await redis.set(key, envelope);
    }
  } catch (error) {
    await logError(error, { action: 'redis-set', key });
  }
  return fresh;
};
