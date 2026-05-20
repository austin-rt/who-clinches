import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/errorLogger';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    const data = await request.json();
    const { remainingCalls, patronLevel, threshold, message, timestamp } = data;

    await sendEmail({
      subject: `[CFBD API] Low Remaining Calls: ${remainingCalls}`,
      html: `
        <h2>CFBD API Alert</h2>
        <p><strong>Patron Level:</strong> ${patronLevel}</p>
        <p><strong>Remaining Calls:</strong> ${remainingCalls}</p>
        <p><strong>Threshold:</strong> ${threshold}</p>
        <p>${message}</p>
        <p><small>Timestamp: ${timestamp || new Date().toISOString()}</small></p>
      `,
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
