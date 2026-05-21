import { NextRequest, after } from 'next/server';
import { db } from '@/lib/db/client';
import { sendEmail } from '@/lib/email';
import { notificationHtml } from '@/lib/email-templates';

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

    const vercelEnv = process.env.VERCEL_ENV ?? null;
    const nodeEnv = process.env.NODE_ENV ?? null;

    const feedback = await db.feedback.create({
      data: {
        sessionId: sessionId || null,
        message: content,
        conf: conf || null,
        vercelEnv,
        nodeEnv,
      },
    });

    after(() =>
      sendEmail({
        subject: `[Feedback] ${conf ? conf.toUpperCase() + ' — ' : ''}${content.slice(0, 60)}`,
        html: notificationHtml(
          'New Feedback',
          [
            ...(conf ? [{ label: 'Conference', value: conf.toUpperCase() }] : []),
            { label: 'Session', value: sessionId || 'none' },
            { label: 'Env', value: `${vercelEnv ?? 'local'} / ${nodeEnv ?? '?'}` },
            { label: 'ID', value: feedback.id },
          ],
          content
        ),
      }).catch(() => {})
    );

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
};
