import { db } from '@/lib/db/client';

export interface RuntimeConfigData {
  fixtureYearOn: boolean;
  fixtureYear: number | null;
  graphqlOn: boolean;
  redisOn: boolean;
  rateLimitOn: boolean;
  inSeasonOverride: boolean;
}

const DEFAULTS: RuntimeConfigData = {
  fixtureYearOn: false,
  fixtureYear: null,
  graphqlOn: true,
  redisOn: true,
  rateLimitOn: true,
  inSeasonOverride: false,
};

let cached: { data: RuntimeConfigData; timestamp: number } | null = null;
const CACHE_TTL_MS = 5000;

export const getRuntimeConfig = async (): Promise<RuntimeConfigData> => {
  if (process.env.VERCEL_ENV === 'production') return DEFAULTS;

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const row = await db.runtimeConfig.findUnique({
      where: { id: 'singleton' },
    });

    const data: RuntimeConfigData = row
      ? {
          fixtureYearOn: row.fixtureYearOn,
          fixtureYear: row.fixtureYear,
          graphqlOn: row.graphqlOn,
          redisOn: row.redisOn,
          rateLimitOn: row.rateLimitOn,
          inSeasonOverride: row.inSeasonOverride,
        }
      : DEFAULTS;

    cached = { data, timestamp: Date.now() };
    return data;
  } catch {
    return DEFAULTS;
  }
};

export const updateRuntimeConfig = async (
  patch: Partial<RuntimeConfigData>
): Promise<RuntimeConfigData> => {
  const row = await db.runtimeConfig.upsert({
    where: { id: 'singleton' },
    create: { ...patch },
    update: { ...patch },
  });

  const data: RuntimeConfigData = {
    fixtureYearOn: row.fixtureYearOn,
    fixtureYear: row.fixtureYear,
    graphqlOn: row.graphqlOn,
    redisOn: row.redisOn,
    rateLimitOn: row.rateLimitOn,
    inSeasonOverride: row.inSeasonOverride,
  };

  cached = { data, timestamp: Date.now() };
  return data;
};
