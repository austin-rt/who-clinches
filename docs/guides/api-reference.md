# API Reference

Complete reference for all Conference Tiebreaker API endpoints.

---

## Endpoint Documentation

- **[Data Endpoints](./api-reference-data.md)** - GET /api/games/[sport]/[conf] (CFBD fetch), GET /api/standings/[sport]/[conf] (standings calculation), POST /api/simulate/[sport]/[conf] (dynamic endpoint)

**Note**: All endpoints fetch data directly from the CFBD API on each request. No database persistence or scheduled jobs are used.

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
| `CFBD_API_KEY`        | Yes      | CFBD API key (get from https://collegefootballdata.com/) |
| `CFBD_ALERT_WEBHOOK_URL` | No    | Webhook URL for low API call alerts  |
| `CFBD_ALERT_EMAIL`    | No       | Email address for low API call alerts |
| `RESEND_API_KEY`      | No       | Resend API key for email alerts      |
| `RESEND_FROM_EMAIL`   | No       | From email address for alerts         |

---

## Notes

- All endpoints fetch data directly from CFBD API on each request
- Conference identifiers use CFBD format (e.g., "SEC" for SEC)
- Frontend uses RTK Query with GraphQL subscriptions for live updates (when in season)
- REST API used when out of season or GraphQL disabled

**API Route Pattern**: `export const GET = async (request: NextRequest) => { ... }`

**Type Safety**: Uses CFBD TypeScript types directly

---

**See also:** [Data Endpoints](./api-reference-data.md)
