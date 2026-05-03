# API Reference

Complete reference for all Conference Tiebreaker API endpoints.

---

## Endpoint Documentation

- **[Data Endpoints](./api-reference-data.md)** - GET /api/games/[sport]/[conf], POST /api/simulate/[sport]/[conf]
- **[Stats Endpoints](./api-reference-stats.md)** - GET /api/stats/rankings

**Note**: CFBD data is cached in Upstash Redis (production only) with TTLs per data type: teams (30 days), completed games (permanent), in-progress games/rankings/SP+/FPI (weekly, Saturday 11 AM ET). Rating fetches are conditional based on conference tiebreaker config. Non-production environments bypass Redis and fetch directly from CFBD API.

---

## Common Response Codes

| Code | Meaning      | Common Causes                          |
| ---- | ------------ | -------------------------------------- |
| 200  | Success      | Request completed successfully         |
| 400  | Bad Request  | Missing required fields, invalid input |
| 429  | Rate Limited | Per-IP limit exceeded (1 req/15s in production) |
| 500  | Server Error | CFBD API error, server error            |

---

## Rate Limiting

**CFBD API:**
- Free tier: 1,000 calls/month
- Tier 2: $1/month (recommended for normal use)
- Tier 3+: Higher limits for in-season usage

**Our APIs (production only):**
- All `/api/*` endpoints: 1 request per 15 seconds per IP via `@upstash/ratelimit` (sliding window)
- Requests with valid `VERCEL_AUTOMATION_BYPASS_SECRET` bypass rate limiting
- Non-production environments have no rate limiting

---

## Environment Variables

| Variable              | Required | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `CFBD_API_KEY`        | Yes | Comma-separated keys in one value for preprod rotation (e.g. `k1,k2`). Production: one segment only |
| `UPSTASH_REDIS_REST_URL` | Yes (prod) | Upstash Redis REST URL (production only) |
| `UPSTASH_REDIS_REST_TOKEN` | Yes (prod) | Upstash Redis REST token (production only) |
| `CFBD_ALERT_WEBHOOK_URL` | No    | Webhook URL for low API call alerts  |
| `CFBD_ALERT_HANDLER_URL` | No    | Alternative alert handler URL (auto-detected from VERCEL_URL if not set) |
| `CFBD_ALERT_EMAIL`    | No       | Email address for low API call alerts (required if using email alerts) |
| `RESEND_API_KEY`      | No       | Resend API key for email alerts (required if using email alerts) |
| `RESEND_FROM_EMAIL`   | No       | From email address for alerts (optional, defaults to 'alerts@yourdomain.com') |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | No | Bypass token for protected Vercel deployments and rate limit bypass |
| `FIXTURE_YEAR` | No | Set to a year (e.g. '2025') to use local fixture data instead of CFBD API (development/testing) |

---

## Notes

- CFBD data is cached in Upstash Redis (production only) with TTLs per data type
- Conference identifiers use CFBD format (e.g., "SEC" for SEC)
- Per-IP rate limiting (1 req/15s) enforced in production via `proxy.ts`
- Tiebreaker rules are async and may fetch external data on demand (e.g., SP+ and FPI ratings for MWC team rating score rule)

**API Route Pattern**: `export const GET = async (request: NextRequest) => { ... }`

**Type Safety**: Uses CFBD TypeScript types directly

---

**See also:** [Data Endpoints](./api-reference-data.md)
