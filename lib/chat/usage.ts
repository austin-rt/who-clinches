import { db } from '@/lib/db/client';

const FREE_WINDOW_LIMIT = 8;
const FREE_WINDOW_MS = 4 * 60 * 60 * 1000;

export interface UsageResult {
  allowed: boolean;
  source: 'free' | 'credits' | null;
  freeRemaining: number;
  creditsRemaining: number;
  windowResetsIn?: number;
}

export const checkAndDeductUsage = async (anonymousId: string): Promise<UsageResult> => {
  const now = new Date();

  const user = await db.chatUser.upsert({
    where: { anonymousId },
    create: { anonymousId, freeUsedInWindow: 0 },
    update: {},
  });

  const windowExpired = !user.windowExpiresAt || user.windowExpiresAt <= now;

  if (windowExpired) {
    const windowExpiresAt = new Date(now.getTime() + FREE_WINDOW_MS);
    const updated = await db.chatUser.update({
      where: { id: user.id },
      data: { freeUsedInWindow: 1, windowExpiresAt },
    });
    return {
      allowed: true,
      source: 'free',
      freeRemaining: FREE_WINDOW_LIMIT - 1,
      creditsRemaining: updated.purchasedCredits,
      windowResetsIn: FREE_WINDOW_MS,
    };
  }

  const windowResetsIn = user.windowExpiresAt!.getTime() - now.getTime();

  if (user.freeUsedInWindow < FREE_WINDOW_LIMIT) {
    const updated = await db.chatUser.update({
      where: { id: user.id },
      data: { freeUsedInWindow: { increment: 1 } },
    });
    return {
      allowed: true,
      source: 'free',
      freeRemaining: FREE_WINDOW_LIMIT - updated.freeUsedInWindow,
      creditsRemaining: updated.purchasedCredits,
      windowResetsIn,
    };
  }

  if (user.purchasedCredits > 0) {
    const updated = await db.chatUser.update({
      where: { id: user.id },
      data: { purchasedCredits: { decrement: 1 } },
    });
    return {
      allowed: true,
      source: 'credits',
      freeRemaining: 0,
      creditsRemaining: updated.purchasedCredits,
      windowResetsIn,
    };
  }

  return {
    allowed: false,
    source: null,
    freeRemaining: 0,
    creditsRemaining: 0,
    windowResetsIn: user.windowExpiresAt!.getTime() - now.getTime(),
  };
};

export const refundUsage = async (
  anonymousId: string,
  source: 'free' | 'credits'
): Promise<void> => {
  if (source === 'free') {
    await db.chatUser.update({
      where: { anonymousId },
      data: { freeUsedInWindow: { decrement: 1 } },
    });
  } else {
    await db.chatUser.update({
      where: { anonymousId },
      data: { purchasedCredits: { increment: 1 } },
    });
  }
};
