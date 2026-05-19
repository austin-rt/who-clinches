import { NextRequest, NextResponse } from 'next/server';
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

export const POST = async (request: NextRequest) => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { action, identifier, amount } = body as {
    action: 'grant' | 'revoke' | 'lookup';
    identifier: string;
    amount?: number;
  };

  if (!identifier?.trim()) {
    return NextResponse.json({ error: 'Identifier required' }, { status: 400 });
  }

  const trimmed = identifier.trim().toLowerCase();
  const isEmail = trimmed.includes('@');

  if (action === 'lookup') {
    const user = isEmail
      ? await db.chatUser.findUnique({ where: { email: trimmed } })
      : await db.chatUser.findUnique({ where: { anonymousId: trimmed } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const donations = await db.donation.findMany({
      where: { chatUserId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      id: user.id,
      anonymousId: user.anonymousId,
      email: user.email,
      purchasedCredits: user.purchasedCredits,
      freeUsedInWindow: user.freeUsedInWindow,
      windowExpiresAt: user.windowExpiresAt,
      createdAt: user.createdAt,
      donations: donations.map((d) => ({
        bmcId: d.bmcId,
        amount: d.amount,
        credits: d.credits,
        createdAt: d.createdAt,
      })),
    });
  }

  if (action === 'grant' || action === 'revoke') {
    const credits = Math.abs(Math.floor(amount ?? 0));
    if (credits <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    const user = isEmail
      ? await db.chatUser.findUnique({ where: { email: trimmed } })
      : await db.chatUser.findUnique({ where: { anonymousId: trimmed } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await db.chatUser.update({
      where: { id: user.id },
      data: {
        purchasedCredits: action === 'grant' ? { increment: credits } : { decrement: credits },
      },
    });

    return NextResponse.json({
      ok: true,
      action,
      credits,
      newBalance: Math.max(0, updated.purchasedCredits),
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
};
