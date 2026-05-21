import { NextRequest, after } from 'next/server';
import { db } from '@/lib/db/client';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { sessionId, message, conf } = body;

    const content = typeof message === 'string' ? message.trim() : '';

    if (content.length > 2000) {
      return Response.json({ error: 'Message too long' }, { status: 400 });
    }

    const feedback = await db.feedback.create({
      data: {
        sessionId: sessionId || null,
        message: content,
        conf: conf || null,
      },
    });

    after(() =>
      sendEmail({
        subject: `[Feedback] ${conf ? conf.toUpperCase() + ' — ' : ''}${content.slice(0, 60)}`,
        text: `${content}\n\nConference: ${conf || 'none'}\nSession: ${sessionId || 'none'}\nID: ${feedback.id}`,
      }).catch(() => {})
    );

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
};
