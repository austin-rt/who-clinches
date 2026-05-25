import { NextRequest, NextResponse } from 'next/server';
import { runNflSimulation } from '@/lib/nfl/runNflSimulation';
import type { Game } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { season, games, overrides = {} } = body;

    if (!season || !games || !Array.isArray(games)) {
      return NextResponse.json({ error: 'season and games array are required' }, { status: 400 });
    }

    const result = runNflSimulation(games as Game[], season, overrides);

    return NextResponse.json(result);
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, { endpoint: '/api/simulate/nfl', action: 'simulate' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
