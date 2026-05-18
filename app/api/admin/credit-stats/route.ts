import { NextResponse } from 'next/server';
import { isAdminAllowed } from '@/lib/admin/is-admin-allowed';
import { db } from '@/lib/db/client';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [totalUsers, creditsAgg, donationAgg] = await Promise.all([
    db.chatUser.count(),
    db.chatUser.aggregate({ _sum: { purchasedCredits: true } }),
    db.donation.aggregate({ _count: true, _sum: { amount: true } }),
  ]);

  let providerCooldownUntil: string | null = null;
  try {
    if (redis) {
      const cooldownTs = await redis.get<string>('anthropic:cooldown');
      if (cooldownTs && Number(cooldownTs) > Date.now()) {
        providerCooldownUntil = new Date(Number(cooldownTs)).toISOString();
      }
    }
  } catch {
    // Redis not available
  }

  return NextResponse.json({
    totalUsers,
    totalCreditsOutstanding: creditsAgg._sum.purchasedCredits ?? 0,
    totalDonations: donationAgg._count,
    totalDonationAmount: donationAgg._sum.amount ?? 0,
    providerCooldownUntil,
  });
};
