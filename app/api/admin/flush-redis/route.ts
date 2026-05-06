import { NextResponse } from 'next/server';
import { isAdminAllowed, getEnvironmentLabel } from '@/lib/admin/is-admin-allowed';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async () => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!redis) {
    return NextResponse.json(
      { error: 'Redis not configured in this environment' },
      { status: 400 }
    );
  }

  try {
    await redis.flushdb();
    return NextResponse.json({
      success: true,
      environment: getEnvironmentLabel(),
      message: `Flushed Redis cache (${getEnvironmentLabel()})`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to flush Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
};
