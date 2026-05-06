import { Redis } from '@upstash/redis';
import { config } from 'dotenv';

const env = process.argv[2];

if (!env || !['dev', 'prod', 'all'].includes(env)) {
  console.error('Usage: flush-redis <dev|prod|all>');
  process.exit(1);
}

const loadRedis = (envFile: string, label: string): { redis: Redis; label: string } | null => {
  const parsed = config({ path: envFile, override: true });
  const url = parsed.parsed?.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = parsed.parsed?.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn(`⚠ No Redis credentials in ${envFile}, skipping ${label}`);
    return null;
  }
  return { redis: new Redis({ url, token }), label };
};

const main = async () => {
  const targets: { redis: Redis; label: string }[] = [];

  if (env === 'dev' || env === 'all') {
    const t = loadRedis('.env.local', 'dev/preview');
    if (t) targets.push(t);
  }
  if (env === 'prod' || env === 'all') {
    const t = loadRedis('.env.production', 'production');
    if (t) targets.push(t);
  }

  if (targets.length === 0) {
    console.error('No Redis instances to flush');
    process.exit(1);
  }

  for (const { redis, label } of targets) {
    await redis.flushdb();
    console.log(`✓ Flushed ${label} Redis`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
