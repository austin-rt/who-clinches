import { NextResponse } from 'next/server';
import { getUserInfoFromCfbd } from '@/lib/cfb/cfbd-rest-client';
import { sendLowCallsAlert } from '@/lib/cfb/helpers/email-alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    const userInfo = await getUserInfoFromCfbd(true);

    if (!userInfo) {
      return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 500 });
    }

    const { patronLevel, remainingCalls } = userInfo;

    const TIER_LIMITS: Record<number, number> = {
      0: 1000, // Free tier
      1: 5000, // Patreon Tier 1 ($1/month)
      2: 30000, // Patreon Tier 2 ($5/month)
      3: 75000, // Patreon Tier 3 ($10/month)
    };
    const TIER_THRESHOLD_PERCENTAGES: Record<number, number> = {
      0: 0.1, // 10% for Free tier
      1: 0.1, // 10% for Tier 1
      2: 0.05, // 5% for Tier 2
      3: 0.025, // 2.5% for Tier 3
    };
    const tierLimit = TIER_LIMITS[patronLevel] ?? TIER_LIMITS[0];
    const percentage = TIER_THRESHOLD_PERCENTAGES[patronLevel] ?? TIER_THRESHOLD_PERCENTAGES[0];
    const threshold = Math.floor(tierLimit * percentage);

    const isLow = remainingCalls < threshold;

    if (isLow) {
      await sendLowCallsAlert(userInfo);
    }

    return NextResponse.json({
      patronLevel,
      remainingCalls,
      threshold,
      isLow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/cfbd-monitor',
      action: 'get-monitor-status',
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
};
