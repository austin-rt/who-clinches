import { NextResponse } from 'next/server';
import { isInSeasonFromCfbd } from '@/lib/cfb/helpers/season-check-cfbd';
import { getDefaultSeasonFromCfbd } from '@/lib/cfb/helpers/get-default-season-cfbd';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    const [inSeason, season] = await Promise.all([
      isInSeasonFromCfbd(),
      getDefaultSeasonFromCfbd(),
    ]);
    return NextResponse.json({ inSeason, season });
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
        season: new Date().getFullYear(),
      },
      { status: 500 }
    );
  }
};
