import { NextRequest } from 'next/server';
import { createMagicLink, sendMagicLinkEmail } from '@/lib/chat/magic-link';
import { redis } from '@/lib/redis';

const RATE_LIMIT_WINDOW_S = 120;

const checkEmailRateLimit = async (email: string): Promise<boolean> => {
  if (!redis) return true;
  const key = `magic-link:${email}`;
  const exists = await redis.get(key);
  if (exists) return false;
  await redis.set(key, '1', { ex: RATE_LIMIT_WINDOW_S });
  return true;
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const allowed = await checkEmailRateLimit(email);
    if (!allowed) {
      return Response.json(
        { error: 'Please wait before requesting another link' },
        { status: 429 }
      );
    }

    const token = await createMagicLink(email);

    const isDevOrPreview = process.env.VERCEL_ENV !== 'production' || !process.env.VERCEL_ENV;

    if (isDevOrPreview) {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
      const verifyUrl = `${baseUrl}/auth/verify?token=${token}`;

      try {
        await sendMagicLinkEmail(email, token);
      } catch {
        // Resend may not be configured in dev — that's fine
      }

      return Response.json({ sent: true, verifyUrl });
    }

    await sendMagicLinkEmail(email, token);
    return Response.json({ sent: true });
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, { endpoint: '/api/chat/auth', action: 'send-magic-link' });
    return Response.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
};
