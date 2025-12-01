# API Reference

Complete reference for all Conference Tiebreaker API endpoints.

---

## Endpoint Documentation

- **[Data Endpoints](./api-reference-data.md)** - GET /api/games/[sport]/[conf] (fast MongoDB query), POST /api/games/[sport]/[conf] (ESPN fetch), POST /api/simulate/[sport]/[conf]
- **[Cron Jobs](./api-reference-cron.md)** - Migration notes

---

## Common Response Codes

| Code | Meaning      | Common Causes                          |
| ---- | ------------ | -------------------------------------- |
| 200  | Success      | Request completed successfully         |
| 400  | Bad Request  | Missing required fields, invalid input |
| 500  | Server Error | Database error, ESPN API timeout       |

---

## Rate Limiting

**ESPN API:**
- Site API: ~500ms between requests
- Scoreboard API: No rate limit (batched by week)

**Our APIs:**
- Data endpoints: No rate limit
- Frontend polling: Conditional (every 60 seconds for live games, every 2 minutes for spreads, disabled in development)

---

## Environment Variables

| Variable              | Required | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `CRON_SECRET`         | No       | Not used (on-demand architecture, no cron endpoints) |
| `MONGODB_USER`        | Yes      | MongoDB username                     |
| `MONGODB_PASSWORD`    | Yes      | MongoDB password                     |
| `MONGODB_HOST`        | Yes      | MongoDB cluster host                 |
| `MONGODB_APP_NAME`    | Yes      | MongoDB application name             |
| `MONGODB_DB`          | Yes*     | Database name (required locally)     |
| `VERCEL_ENV`          | No       | Vercel environment (auto-set)        |
| `MONGODB_MEMORY_SERVER_URI` | No  | In-memory test database URI (test mode) |

---

## Error Logging

All endpoints log errors to MongoDB `errors` collection:

```typescript
{
  timestamp: Date,
  endpoint: string,      // e.g., "/api/cron/update-rankings"
  payload: object,       // Request details
  error: string,         // Error message
  stackTrace: string,    // Full stack trace
  createdAt: Date,
  updatedAt: Date
}
```

**Query Errors:**
```javascript
db.errors.find({ endpoint: '/api/games/cfb/sec' }).sort({ timestamp: -1 });
```

---

## Notes

- All timestamps in ISO 8601 format (UTC)
- GET /api/games/[sport]/[conf] queries MongoDB only (read-only, fast, ~50-200ms)
- POST /api/games/[sport]/[conf] fetches from ESPN, reshapes data, upserts to database, and returns reshaped data
- Dev/prod/preview databases store reshaped data (Game, Team models), not raw ESPN responses
- Conference IDs vary by conference (e.g., 8 for SEC)
- Team IDs are ESPN team IDs (e.g., "333" = Alabama)
- Frontend uses RTK Query with two-phase loading (GET for fast initial load, POST for background refresh) and conditional polling for live updates

**API Route Pattern**: `export const POST/GET = async (request: NextRequest) => { ... }`

**Database Pattern**: `await dbConnect()` before any DB operation

**Error Logging Pattern**: `ErrorModel.create({ timestamp, endpoint, payload, error, stackTrace })`

**Type Casting Pattern**: `.lean<GameLean[]>()` for MongoDB queries

---

**See also:** [Data Endpoints](./api-reference-data.md) | [Cron Jobs](./api-reference-cron.md)
