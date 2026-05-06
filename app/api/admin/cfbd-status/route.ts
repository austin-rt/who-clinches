import { NextResponse } from 'next/server';
import { isAdminAllowed } from '@/lib/admin/is-admin-allowed';
import { getCfbdApiStatus, getUserInfoFromCfbd } from '@/lib/cfb/cfbd-rest-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const TIER_LIMITS: Record<number, number> = {
    0: 1000,
    1: 5000,
    2: 30000,
    3: 75000,
  };

  const [userInfo, keyStatus] = await Promise.all([
    getUserInfoFromCfbd(),
    Promise.resolve(getCfbdApiStatus()),
  ]);

  const patronLevel = userInfo?.patronLevel ?? null;
  const tierLimit = patronLevel !== null ? (TIER_LIMITS[patronLevel] ?? null) : null;

  return NextResponse.json({
    remainingCalls: userInfo?.remainingCalls ?? null,
    tierLimit,
    patronLevel,
    activeKeyIndex: keyStatus.activeKeyIndex,
    poolSize: keyStatus.poolSize,
    usage: keyStatus.usage,
  });
};
