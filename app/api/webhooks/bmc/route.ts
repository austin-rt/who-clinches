import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/lib/db/client';
import { logError } from '@/lib/errorLogger';

const CREDITS_PER_DOLLAR = 100;

const MONEY_IN_EVENTS = new Set([
  'donation.created',
  'membership.started',
  'membership.updated',
  'one_time_support',
  'coffee_purchase',
  'support',
]);

const REFUND_EVENTS = new Set(['donation.refunded', 'refund', 'payment.refunded']);

const verifySignature = (body: string, signature: string | null): boolean => {
  const secret = process.env.BMC_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
};

const extractField = (payload: Record<string, unknown>, ...keys: string[]): unknown => {
  const response = payload.response as Record<string, unknown> | undefined;
  for (const key of keys) {
    if (response && response[key] !== undefined && response[key] !== null) return response[key];
    if (payload[key] !== undefined && payload[key] !== null) return payload[key];
  }
  return undefined;
};

const handleMoneyIn = async (payload: Record<string, unknown>): Promise<Response> => {
  const bmcId = String(extractField(payload, 'payment_id', 'transaction_id', 'id') ?? '');
  const email = String(extractField(payload, 'supporter_email', 'payer_email', 'email') ?? '')
    .toLowerCase()
    .trim();
  const amount = Number(extractField(payload, 'total_amount', 'amount') ?? 0);

  if (!bmcId || !email || amount <= 0) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const credits = Math.floor(amount * CREDITS_PER_DOLLAR);

  const existing = await db.donation.findUnique({ where: { bmcId } });
  if (existing) {
    return Response.json({ ok: true, duplicate: true });
  }

  const chatUser = await db.chatUser.findUnique({ where: { email } });

  await db.donation.create({
    data: {
      bmcId,
      email,
      amount,
      credits,
      chatUserId: chatUser?.id ?? null,
    },
  });

  if (chatUser) {
    await db.chatUser.update({
      where: { id: chatUser.id },
      data: { purchasedCredits: { increment: credits } },
    });
  }

  return Response.json({ ok: true, credits, matched: !!chatUser });
};

const handleRefund = async (payload: Record<string, unknown>): Promise<Response> => {
  const bmcId = String(extractField(payload, 'payment_id', 'transaction_id', 'id') ?? '');

  if (!bmcId) {
    return Response.json({ error: 'Missing payment identifier for refund' }, { status: 400 });
  }

  const donation = await db.donation.findUnique({ where: { bmcId } });
  if (!donation) {
    return Response.json({ ok: true, message: 'No matching donation found' });
  }

  if (donation.chatUserId) {
    await db.chatUser.update({
      where: { id: donation.chatUserId },
      data: { purchasedCredits: { decrement: donation.credits } },
    });
  }

  await db.donation.delete({ where: { bmcId } });

  return Response.json({ ok: true, refunded: true, credits: donation.credits });
};

export const POST = async (request: NextRequest) => {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-bmc-signature');

    if (!verifySignature(rawBody, signature)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = request.headers.get('x-bmc-event') ?? payload.type ?? 'unknown';

    await logError(`BMC webhook received: ${eventType}`, {
      endpoint: '/api/webhooks/bmc',
      action: 'bmc-webhook-received',
      eventType,
      payload,
    });

    if (MONEY_IN_EVENTS.has(eventType)) {
      return handleMoneyIn(payload);
    }

    if (REFUND_EVENTS.has(eventType)) {
      return handleRefund(payload);
    }

    await logError(`Unhandled BMC event type: ${eventType}`, {
      endpoint: '/api/webhooks/bmc',
      action: 'bmc-webhook-unhandled',
      eventType,
    });

    return Response.json({ ok: true, unhandled: true, eventType });
  } catch (error) {
    await logError(error, { endpoint: '/api/webhooks/bmc', action: 'bmc-webhook' });
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
};
