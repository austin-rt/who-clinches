import { NextRequest } from 'next/server';
import { db } from '@/lib/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { sessionId, message, conf } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 2000) {
      return Response.json({ error: 'Message too long' }, { status: 400 });
    }

    await db.chatMessage.create({
      data: {
        sessionId: sessionId || 'anonymous',
        role: 'feedback',
        content: message.trim(),
        conf: conf || null,
      },
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
};
