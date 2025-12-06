# CFBD API Monitoring

This application monitors CFBD API usage and sends alerts when remaining API calls are low.

## Monitoring Endpoint

**GET `/api/cfbd-monitor`**

Returns current API usage status:
```json
{
  "patronLevel": 1,
  "remainingCalls": 450,
  "threshold": 1000,
  "isLow": true,
  "timestamp": "2025-12-06T03:30:00.000Z"
}
```

## Alert Configuration

Alerts are sent when remaining calls fall below the threshold:
- **Threshold**: 1,000 calls (applies to all patron levels)

### Setting Up Email Alerts

Configure a webhook URL that will receive alert notifications. The webhook can be:
- A Zapier/Make.com webhook that sends emails (easiest, free)
- A custom API endpoint that sends emails via SendGrid, Resend, etc.
- Any service that accepts POST requests with JSON payloads

**Environment Variable:**
```bash
CFBD_ALERT_WEBHOOK_URL=https://your-webhook-url.com/alerts
```

**For detailed setup instructions:** See the examples below for Zapier webhook setup.

**Webhook Payload:**
```json
{
  "patronLevel": 1,
  "remainingCalls": 450,
  "threshold": 1000,
  "isLow": true,
  "timestamp": "2025-12-06T03:30:00.000Z",
  "environment": "production",
  "message": "CFBD API remaining calls are low: 450 (Patron Level: 1)"
}
```

### Example: Zapier Webhook

1. Create a Zapier webhook trigger
2. Add an email action (Gmail, Outlook, etc.)
3. Use the webhook URL as `CFBD_ALERT_WEBHOOK_URL`
4. Map the `message` field to the email body

### Example: Vercel Cron Job

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cfbd-monitor",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This checks every 6 hours and sends alerts if calls are low.

## Alert Cooldown

Alerts are rate-limited to prevent spam:
- **Cooldown**: 1 hour between alerts
- Alerts only sent if remaining calls decrease or stay the same

## Automatic Monitoring

The monitoring system automatically checks remaining calls after each API request:
- `getGames()`
- `getTeams()`
- `getLines()`

In production, alerts are sent via webhook. In development, warnings are logged to console.

