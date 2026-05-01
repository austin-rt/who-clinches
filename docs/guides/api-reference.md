# API Reference

Complete reference for all Conference Tiebreaker API endpoints.

---

## Endpoint Documentation

- **[Data Endpoints](./api-reference-data.md)** - GET /api/games/[sport]/[conf], POST /api/simulate/[sport]/[conf]
- **[Stats Endpoints](./api-reference-stats.md)** - GET /api/stats/rankings

**Note**: CFBD data is cached server-side via `unstable_cache` with a weekly TTL (expires Saturday 11 AM ET). Rating fetches (SP+, FPI, CFP rankings) are conditional based on conference tiebreaker config. No database persistence or scheduled jobs are used.

---

## Common Response Codes

| Code | Meaning      | Common Causes                          |
| ---- | ------------ | -------------------------------------- |
| 200  | Success      | Request completed successfully         |
| 400  | Bad Request  | Missing required fields, invalid input |
| 500  | Server Error | CFBD API error, server error            |

---

## Rate Limiting

**CFBD API:**
- Free tier: 1,000 calls/month
- Tier 2: $1/month (recommended for normal use)
- Tier 3+: Higher limits for in-season usage

**Our APIs:**
- Data endpoints: No rate limit
- Live updates: GraphQL subscriptions (Server-Sent Events) when in season

---

## Environment Variables

| Variable              | Required | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `CFBD_API_KEY`        | Yes (prod) | CFBD API key for production (get from https://collegefootballdata.com/) |
| `DEV_CFBD_API_KEY`    | Yes (dev/preview) | Primary dev CFBD API key; rotation pool scanned by prefix |
| `DEV_CFBD_API_KEY_2`  | No       | Additional dev CFBD API key for rotation (add more with `_3`, `_4`, etc.) |
| `CFBD_ALERT_WEBHOOK_URL` | No    | Webhook URL for low API call alerts  |
| `CFBD_ALERT_HANDLER_URL` | No    | Alternative alert handler URL (auto-detected from VERCEL_URL if not set) |
| `CFBD_ALERT_EMAIL`    | No       | Email address for low API call alerts (required if using email alerts) |
| `RESEND_API_KEY`      | No       | Resend API key for email alerts (required if using email alerts) |
| `RESEND_FROM_EMAIL`   | No       | From email address for alerts (optional, defaults to 'alerts@yourdomain.com') |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | No | Bypass token for protected Vercel deployments |
| `USE_FIXTURES` | No | Set to 'true' to use local fixture data instead of CFBD API (development/testing) |

---

## Notes

- CFBD data is cached server-side (`unstable_cache`, weekly TTL anchored to Saturday 11 AM ET)
- Conference identifiers use CFBD format (e.g., "SEC" for SEC)
- Frontend uses RTK Query with GraphQL subscriptions for live updates (when in season)
- REST API used when out of season or GraphQL disabled
- Tiebreaker rules are async and may fetch external data on demand (e.g., SP+ and FPI ratings for MWC team rating score rule)

**API Route Pattern**: `export const GET = async (request: NextRequest) => { ... }`

**Type Safety**: Uses CFBD TypeScript types directly

---

**See also:** [Data Endpoints](./api-reference-data.md)
