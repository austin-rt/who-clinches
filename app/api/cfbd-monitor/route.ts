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
    const threshold = 1000;

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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
};
