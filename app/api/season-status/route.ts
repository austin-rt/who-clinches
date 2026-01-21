import { NextResponse } from 'next/server';
import { isInSeasonFromCfbd } from '@/lib/cfb/helpers/season-check-cfbd';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    const inSeason = await isInSeasonFromCfbd();
    return NextResponse.json({ inSeason });
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/season-status',
      action: 'get-season-status',
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        inSeason: false,
      },
      { status: 500 }
    );
  }
};
