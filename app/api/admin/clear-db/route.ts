import { NextRequest, NextResponse } from 'next/server';
import { isAdminAllowed, getEnvironmentLabel } from '@/lib/admin/is-admin-allowed';
import { db } from '@/lib/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const environment = getEnvironmentLabel();
  const body = (await request.json().catch(() => ({}))) as { target?: string };
  const target = body.target ?? environment;

  if (target === 'production') {
    return NextResponse.json({ error: 'Cannot clear production database' }, { status: 403 });
  }

  if (environment === 'preview' && target !== 'preview') {
    return NextResponse.json({ error: 'Preview can only clear its own database' }, { status: 403 });
  }

  try {
    const result = await db.simulationSnapshot.deleteMany({});
    return NextResponse.json({
      success: true,
      environment,
      target,
      deletedCount: result.count,
      message: `Cleared ${result.count} snapshots from ${target} database`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to clear database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
};
