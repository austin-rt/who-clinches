import { db } from '@/lib/db/client';

export interface RuntimeConfigData {
  fixtureYearOn: boolean;
  fixtureYear: number | null;
  graphqlOn: boolean;
  redisOn: boolean;
  rateLimitOn: boolean;
  inSeasonOverride: boolean;
  aiChatOn: boolean;
  ragOn: boolean;
}

const DEFAULTS: RuntimeConfigData = {
  fixtureYearOn: true,
  fixtureYear: new Date().getFullYear(),
  graphqlOn: true,
  redisOn: false,
  rateLimitOn: true,
  inSeasonOverride: false,
  aiChatOn: false,
  ragOn: false,
};

const PRODUCTION_CONFIG: RuntimeConfigData = {
  ...DEFAULTS,
  redisOn: true,
  rateLimitOn: true,
  aiChatOn: true,
  ragOn: true,
};

let cached: { data: RuntimeConfigData; timestamp: number } | null = null;
const CACHE_TTL_MS = 5000;

export const getRuntimeConfig = async (): Promise<RuntimeConfigData> => {
  if (process.env.VERCEL_ENV === 'production') return PRODUCTION_CONFIG;
  if (process.env.FIXTURE_YEAR) {
    const year = Number(process.env.FIXTURE_YEAR);
    return { ...DEFAULTS, fixtureYear: Number.isNaN(year) ? null : year };
  }

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
          aiChatOn: row.aiChatOn,
          ragOn: row.ragOn,
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
    aiChatOn: row.aiChatOn,
    ragOn: row.ragOn,
  };

  cached = { data, timestamp: Date.now() };
  return data;
};
