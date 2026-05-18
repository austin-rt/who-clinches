import { NextRequest } from 'next/server';
import { createMagicLink, sendMagicLinkEmail } from '@/lib/chat/magic-link';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const token = await createMagicLink(email);
    await sendMagicLinkEmail(email, token);

    return Response.json({ sent: true });
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, { endpoint: '/api/chat/auth', action: 'send-magic-link' });
    return Response.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
};
