import type { UserInfo } from 'cfbd';
import { logError } from '@/lib/errorLogger';

const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

let lastAlertTimestamp: number | null = null;

const TIER_LIMITS: Record<number, number> = {
  0: 1000, // Free tier
  1: 5000, // Patreon Tier 1 ($1/month)
  2: 30000, // Patreon Tier 2 ($5/month)
  3: 75000, // Patreon Tier 3 ($10/month)
};

const TIER_THRESHOLD_PERCENTAGES: Record<number, number> = {
  0: 0.1, // 10% for Free tier
  1: 0.1, // 10% for Tier 1
  2: 0.05, // 5% for Tier 2
  3: 0.025, // 2.5% for Tier 3
};

const getAlertThreshold = (patronLevel: number): number => {
  const tierLimit = TIER_LIMITS[patronLevel] ?? TIER_LIMITS[0];
  const percentage = TIER_THRESHOLD_PERCENTAGES[patronLevel] ?? TIER_THRESHOLD_PERCENTAGES[0];
  return Math.floor(tierLimit * percentage);
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
    const error = new Error(errorMsg);
    await logError(error, {
      action: 'send-alert-via-webhook',
      hasWebhookUrl: !!webhookUrl,
      hasAlertHandlerUrl: !!process.env.CFBD_ALERT_HANDLER_URL,
      vercelUrl: process.env.VERCEL_URL,
    });
    throw error;
  }

  const { patronLevel, remainingCalls } = userInfo;
  const threshold = getAlertThreshold(patronLevel);

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
      const error = new Error(`Alert handler error: ${response.status} ${response.statusText}`);
      await logError(error, {
        action: 'send-alert-via-webhook',
        targetUrl,
        status: response.status,
        statusText: response.statusText,
      });
      throw error;
    }
  } catch (error) {
    await logError(error, {
      action: 'send-alert-via-webhook',
      targetUrl,
    });
    throw error;
  }
};

export const sendLowCallsAlert = async (userInfo: UserInfo): Promise<void> => {
  const { remainingCalls, patronLevel } = userInfo;
  const threshold = getAlertThreshold(patronLevel);

  if (remainingCalls >= threshold) {
    return;
  }

  const now = Date.now();
  if (lastAlertTimestamp !== null && now - lastAlertTimestamp < ALERT_COOLDOWN_MS) {
    return;
  }

  try {
    await sendAlertViaWebhook(userInfo);
    lastAlertTimestamp = now;
  } catch (error) {
    await logError(error, {
      action: 'send-low-calls-alert',
      remainingCalls,
      threshold,
      patronLevel,
    });
  }
};
