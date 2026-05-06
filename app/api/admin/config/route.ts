import { NextRequest, NextResponse } from 'next/server';
import { isAdminAllowed, getEnvironmentLabel } from '@/lib/admin/is-admin-allowed';
import {
  getRuntimeConfig,
  updateRuntimeConfig,
  type RuntimeConfigData,
} from '@/lib/admin/runtime-config';
import { AVAILABLE_FIXTURE_YEARS } from '@/lib/admin/fixture-years';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const config = await getRuntimeConfig();
  return NextResponse.json({
    ...config,
    environment: getEnvironmentLabel(),
    availableFixtureYears: AVAILABLE_FIXTURE_YEARS,
  });
};

const flushRedisIfAvailable = async (): Promise<boolean> => {
  try {
    if (redis) {
      await redis.flushdb();
      return true;
    }
  } catch {
    // Redis not available
  }
  return false;
};

export const PATCH = async (request: NextRequest) => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = (await request.json()) as Partial<RuntimeConfigData>;
  const current = await getRuntimeConfig();
  const patch: Partial<RuntimeConfigData> = { ...body };
  const cascadeEffects: string[] = [];

  if (patch.fixtureYearOn && !current.fixtureYearOn) {
    if (!patch.fixtureYear && !current.fixtureYear && AVAILABLE_FIXTURE_YEARS.length > 0) {
      patch.fixtureYear = AVAILABLE_FIXTURE_YEARS[0];
    }
    patch.redisOn = false;
    patch.rateLimitOn = false;
    cascadeEffects.push('Redis disabled (fixtures use local data)');
    cascadeEffects.push('Rate limiting disabled (depends on Redis)');
    await flushRedisIfAvailable();
    cascadeEffects.push('Redis flushed');
  }

  const fixturesActive = patch.fixtureYearOn ?? current.fixtureYearOn;
  if (fixturesActive && patch.redisOn === true) {
    delete patch.redisOn;
  }

  if (patch.redisOn === false && current.redisOn) {
    await flushRedisIfAvailable();
    cascadeEffects.push('Redis flushed (preventing stale data on re-enable)');
  }

  const inSeasonToggled =
    patch.inSeasonOverride !== undefined && patch.inSeasonOverride !== current.inSeasonOverride;
  if (inSeasonToggled) {
    await flushRedisIfAvailable();
    cascadeEffects.push('Redis flushed (cache TTL regime changed)');
  }

  if (patch.graphqlOn && !current.graphqlOn && !current.inSeasonOverride) {
    patch.inSeasonOverride = true;
    cascadeEffects.push('In-season override enabled (GraphQL requires in-season)');
  }

  const config = await updateRuntimeConfig(patch);

  return NextResponse.json({
    ...config,
    environment: getEnvironmentLabel(),
    availableFixtureYears: AVAILABLE_FIXTURE_YEARS,
    cascadeEffects,
  });
};
