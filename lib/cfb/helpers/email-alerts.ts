import type { UserInfo } from 'cfbd';

const getAlertThreshold = (): number => {
  return 1000;
};

const sendAlertViaWebhook = async (userInfo: UserInfo): Promise<void> => {
  const webhookUrl = process.env.CFBD_ALERT_WEBHOOK_URL;
  const alertHandlerUrl =
    process.env.CFBD_ALERT_HANDLER_URL ||
    (typeof window === 'undefined' && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/cfbd-alert-handler`
      : null);

  const targetUrl = webhookUrl || alertHandlerUrl;

  if (!targetUrl) {
    const errorMsg =
      '[CFBD Alert] No alert URL configured. Set CFBD_ALERT_WEBHOOK_URL, CFBD_ALERT_HANDLER_URL, or ensure VERCEL_URL is set.';
    // eslint-disable-next-line no-console
    console.error(errorMsg, {
      hasWebhookUrl: !!webhookUrl,
      hasAlertHandlerUrl: !!process.env.CFBD_ALERT_HANDLER_URL,
      vercelUrl: process.env.VERCEL_URL,
      nodeEnv: process.env.NODE_ENV,
    });
    throw new Error(errorMsg);
  }

  const { patronLevel, remainingCalls } = userInfo;
  const threshold = getAlertThreshold();

  const payload = {
    patronLevel,
    remainingCalls,
    threshold,
    isLow: remainingCalls < threshold,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    message: `CFBD API remaining calls are low: ${remainingCalls} (Patron Level: ${patronLevel})`,
  };

  try {
    // Add Vercel protection bypass if calling a Vercel URL and secret is available
    let finalUrl = targetUrl;
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypassSecret && (targetUrl.includes('vercel.app') || targetUrl.includes('vercel.com'))) {
      const urlObj = new URL(targetUrl);
      urlObj.searchParams.set('x-vercel-protection-bypass', bypassSecret);
      finalUrl = urlObj.toString();
    }

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Alert handler error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error('[CFBD Alert] Failed to send alert:', errorMessage, {
      targetUrl,
      hasWebhookUrl: !!webhookUrl,
      hasAlertHandlerUrl: !!alertHandlerUrl,
      vercelUrl: process.env.VERCEL_URL,
    });
    throw error;
  }
};

export const sendLowCallsAlert = async (userInfo: UserInfo): Promise<void> => {
  const { remainingCalls } = userInfo;
  const threshold = getAlertThreshold();

  if (remainingCalls >= threshold) {
    return;
  }

  try {
    await sendAlertViaWebhook(userInfo);
    // eslint-disable-next-line no-console
    console.log('[CFBD Alert] Alert sent successfully', { remainingCalls, threshold });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error('[CFBD Alert] Failed to send alert:', errorMessage, {
      remainingCalls,
      threshold,
      patronLevel: userInfo.patronLevel,
    });
  }
};
