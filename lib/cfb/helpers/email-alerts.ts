import type { UserInfo } from 'cfbd';

let lastAlertSent: { remainingCalls: number; timestamp: number } | null = null;
const ALERT_COOLDOWN_MS = 3600000;

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
    return;
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
    const response = await fetch(targetUrl, {
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
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[CFBD Alert] Failed to send alert:', errorMessage);
    }
    throw error;
  }
};

export const sendLowCallsAlert = async (userInfo: UserInfo): Promise<void> => {
  const { remainingCalls } = userInfo;
  const threshold = getAlertThreshold();

  if (remainingCalls >= threshold) {
    return;
  }

  const now = Date.now();

  if (
    lastAlertSent &&
    now - lastAlertSent.timestamp < ALERT_COOLDOWN_MS &&
    remainingCalls >= lastAlertSent.remainingCalls
  ) {
    return;
  }

  try {
    await sendAlertViaWebhook(userInfo);
    lastAlertSent = { remainingCalls, timestamp: now };
  } catch {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[CFBD Alert] Webhook not configured or failed');
    }
  }
};
