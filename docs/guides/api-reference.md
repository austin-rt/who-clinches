# API Reference

Complete reference for all Conference Tiebreaker API endpoints.

---

## Endpoint Documentation

- **[Data Endpoints](./api-reference-data.md)** - GET /api/games/[sport]/[conf], POST /api/simulate/[sport]/[conf], POST /api/share/[sport]/[conf]
- **[Stats Endpoints](./api-reference-stats.md)** - GET /api/stats/rankings
- **Admin Endpoints** (dev/preview only, 404 in production):
  - `GET /api/admin/config` — Read runtime config (toggles + environment label)
  - `PATCH /api/admin/config` — Update toggles (with server-side cascade rules)
  - `POST /api/admin/flush-redis` — Flush Redis cache
  - `POST /api/admin/clear-db` — Clear SimulationSnapshot rows
  - `GET /api/admin/cfbd-status` — CFBD API remaining calls, patron level, key pool status
  - `GET /api/admin/redis-keys` — List cached keys with TTLs
  - `DELETE /api/admin/redis-keys` — Selective key deletion

**Note**: CFBD data is cached in Upstash Redis with TTLs per data type: teams (30 days), completed games (permanent), in-progress games/rankings/SP+/FPI (weekly, Saturday 11 AM ET). Rating fetches are conditional based on conference tiebreaker config. Redis is always-on in production; in dev/preview, caching is toggleable via the admin dashboard (`/admin`). Share endpoint stores snapshots in PostgreSQL (Prisma/Neon).

---

## Common Response Codes

| Code | Meaning      | Common Causes                                                |
| ---- | ------------ | ------------------------------------------------------------ |
| 200  | Success      | Request completed successfully                               |
| 400  | Bad Request  | Missing required fields, invalid input                       |
| 429  | Rate Limited | Per-IP limit exceeded (60 req/min in production and preview) |
| 500  | Server Error | CFBD API error, server error                                 |

---

## Rate Limiting

**CFBD API:**

- Free tier: 1,000 calls/month
- Tier 2: $1/month (recommended for normal use)
- Tier 3+: Higher limits for in-season usage

**Our APIs (production and preview):**

- All `/api/*` endpoints: 60 requests per minute per IP via `@upstash/ratelimit` (sliding window)
- Requests with valid `VERCEL_AUTOMATION_BYPASS_SECRET` bypass rate limiting
- Local development has no rate limiting

---

## Environment Variables

| Variable                          | Required           | Description                                                                                         |
| --------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| `CFBD_API_KEY`                    | Yes                | Comma-separated keys in one value for preprod rotation (e.g. `k1,k2`). Production: one segment only |
| `UPSTASH_REDIS_REST_URL`          | No                 | Upstash Redis REST URL (all envs when configured; always-on in production)                          |
| `UPSTASH_REDIS_REST_TOKEN`        | No                 | Upstash Redis REST token (all envs when configured; always-on in production)                        |
| `CFBD_ALERT_WEBHOOK_URL`          | No                 | Webhook URL for low API call alerts                                                                 |
| `CFBD_ALERT_HANDLER_URL`          | No                 | Alternative alert handler URL (auto-detected from VERCEL_URL if not set)                            |
| `CFBD_ALERT_EMAIL`                | No                 | Email address for low API call alerts (required if using email alerts)                              |
| `RESEND_API_KEY`                  | No                 | Resend API key for email alerts (required if using email alerts)                                    |
| `RESEND_FROM_EMAIL`               | No                 | From email address for alerts (optional, defaults to 'alerts@yourdomain.com')                       |
| `DATABASE_URL`                    | Yes (prod/preview) | PostgreSQL connection string (Neon pooled URL) for Prisma                                           |
| `DIRECT_URL`                      | Yes (prod/preview) | PostgreSQL direct connection string (Neon non-pooled URL) for Prisma migrations                     |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | No                 | Bypass token for Vercel Authentication (preview) and rate limit bypass                              |
| `FIXTURE_YEAR`                    | No                 | Legacy sync fallback for fixture data. Prefer the admin dashboard toggle (`/admin`) in dev/preview  |

---

## Notes

- CFBD data is cached in Upstash Redis (production and preview when configured) with TTLs per data type
- Conference identifiers use CFBD format (e.g., "SEC" for SEC)
- Per-IP rate limiting (60 req/min) enforced in production and preview via `middleware.ts`
- Tiebreaker rules are async and may fetch external data on demand (e.g., SP+ and FPI ratings for MWC team rating score rule)
- Simulation snapshots stored in PostgreSQL (Prisma/Neon) with hash-based deduplication

**API Route Pattern**: `export const GET = async (request: NextRequest) => { ... }`

**Type Safety**: Uses CFBD TypeScript types directly

---

**See also:** [Data Endpoints](./api-reference-data.md)
