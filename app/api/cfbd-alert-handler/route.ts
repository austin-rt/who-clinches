import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/errorLogger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    const data = await request.json();
    const { remainingCalls, patronLevel, threshold, message, timestamp } = data;

    const ALERT_EMAIL = process.env.CFBD_ALERT_EMAIL;

    if (!ALERT_EMAIL) {
      return NextResponse.json({ error: 'CFBD_ALERT_EMAIL not configured' }, { status: 500 });
    }

    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'alerts@yourdomain.com',
          to: ALERT_EMAIL,
          subject: `[CFBD API] Low Remaining Calls: ${remainingCalls}`,
          html: `
            <h2>CFBD API Alert</h2>
            <p><strong>Patron Level:</strong> ${patronLevel}</p>
            <p><strong>Remaining Calls:</strong> ${remainingCalls}</p>
            <p><strong>Threshold:</strong> ${threshold}</p>
            <p>${message}</p>
            <p><small>Timestamp: ${timestamp || new Date().toISOString()}</small></p>
          `,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        const errorObj = new Error(`Resend API error: ${response.status} - ${error}`);
        await logError(errorObj, {
          endpoint: '/api/cfbd-alert-handler',
          action: 'send-email',
          status: response.status,
          errorText: error,
        });
        throw errorObj;
      }

      const resendData = await response.json();

      return NextResponse.json({ success: true, method: 'resend', emailId: resendData.id });
    }

    return NextResponse.json(
      { error: 'No email service configured. Set RESEND_API_KEY or use a webhook.' },
      { status: 500 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logError(error, {
      endpoint: '/api/cfbd-alert-handler',
      action: 'request-handling',
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
