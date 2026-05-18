import { redis } from '@/lib/redis';

const REDIS_KEY = 'anthropic:cooldown';

export const isProviderAvailable = async (): Promise<{
  available: boolean;
  retryAfter?: number;
}> => {
  try {
    if (!redis) return { available: true };
    const expiresAt = await redis.get<number>(REDIS_KEY);
    if (!expiresAt) return { available: true };
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return { available: true };
    return { available: false, retryAfter: Math.ceil(remaining / 1000) };
  } catch {
    return { available: true };
  }
};

export const markProviderCooldown = async (retryAfterSeconds: number): Promise<void> => {
  try {
    if (!redis) return;
    const expiresAt = Date.now() + retryAfterSeconds * 1000;
    await redis.set(REDIS_KEY, expiresAt, { ex: retryAfterSeconds });
  } catch {
    // noop
  }
};
