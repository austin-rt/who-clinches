# CFBD API Monitoring

This application monitors CFBD API usage and sends alerts when remaining API calls are low.

## Monitoring Endpoint

**GET `/api/cfbd-monitor`**

Returns current API usage status:
```json
{
  "patronLevel": 1,
  "remainingCalls": 450,
  "threshold": 500,
  "isLow": true,
  "timestamp": "2025-12-06T03:30:00.000Z"
}
```

## Alert Configuration

Alerts are sent when remaining calls fall below tier-based thresholds:
- **Free tier (0)**: 100 calls (10% of 1,000 limit)
- **Tier 1 ($1/month)**: 500 calls (10% of 5,000 limit)
- **Tier 2 ($5/month)**: 1,500 calls (5% of 30,000 limit)
- **Tier 3 ($10/month)**: 1,875 calls (2.5% of 75,000 limit)

### Setting Up Alerts

**Environment Variables:**
- `CFBD_ALERT_WEBHOOK_URL` - Webhook URL (Zapier, Make.com, custom endpoint)
- `CFBD_ALERT_HANDLER_URL` - Alternative alert handler URL (auto-detected from VERCEL_URL if not set)
- `CFBD_ALERT_EMAIL` - Email address for alerts (required if using email alerts)
- `RESEND_API_KEY` - Resend API key (required if using email alerts)
- `RESEND_FROM_EMAIL` - From email address (optional)

**Webhook Payload:**
```json
{
  "patronLevel": 1,
  "remainingCalls": 450,
  "threshold": 500,
  "isLow": true,
  "timestamp": "2025-12-06T03:30:00.000Z",
  "environment": "production",
  "message": "CFBD API remaining calls are low: 450 (Patron Level: 1)"
}
```

## Alert Cooldown

Alerts are rate-limited to prevent spam:
- **Cooldown**: 1 hour between alerts
- Alerts only sent if remaining calls decrease or stay the same

## Automatic Monitoring

The monitoring system automatically checks remaining calls after every CFBD API call (games, teams, rankings, SP+, FPI).

In production, alerts are sent via webhook or email. In development, no alerts are sent.

