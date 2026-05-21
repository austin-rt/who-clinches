import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/errorLogger';
import { sendEmail } from '@/lib/email';
import { notificationHtml } from '@/lib/email-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    const data = await request.json();
    const { remainingCalls, patronLevel, threshold, message, timestamp } = data;

    await sendEmail({
      subject: `[CFBD API] Low Remaining Calls: ${remainingCalls}`,
      html: notificationHtml('CFBD API Alert', [
        { label: 'Remaining Calls', value: String(remainingCalls) },
        { label: 'Patron Level', value: String(patronLevel) },
        { label: 'Threshold', value: String(threshold) },
        { label: 'Message', value: String(message) },
        { label: 'Timestamp', value: String(timestamp || new Date().toISOString()) },
      ]),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logError(error, {
      endpoint: '/api/cfbd-alert-handler',
      action: 'request-handling',
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
