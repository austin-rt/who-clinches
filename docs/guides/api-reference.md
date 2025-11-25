# API Reference

Complete reference for all Conference Tiebreaker API endpoints.

---

## Endpoint Documentation

- **[Data Endpoints](./api-reference-data.md)** - GET /api/games/[sport]/[conf], POST /api/pull-teams/[sport]/[conf], POST /api/pull-games/[sport]/[conf], POST /api/simulate/[sport]/[conf]
- **[Cron Jobs](./api-reference-cron.md)** - All scheduled update endpoints

---

## Common Response Codes

| Code | Meaning      | Common Causes                          |
| ---- | ------------ | -------------------------------------- |
| 200  | Success      | Request completed successfully         |
| 400  | Bad Request  | Missing required fields, invalid input |
| 401  | Unauthorized | Missing or invalid `CRON_SECRET`       |
| 500  | Server Error | Database error, ESPN API timeout       |

---

## Rate Limiting

**ESPN API:**
- Site API: ~500ms between requests
- Core API: ~500ms between requests
- Scoreboard API: No rate limit (batched by week)

**Our APIs:**
- Data endpoints: No rate limit
- Cron jobs: Scheduled (see individual endpoints)

---

## Environment Variables

| Variable              | Required | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `CRON_SECRET`         | Yes      | Bearer token for cron authentication |
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
db.errors.find({ endpoint: '/api/cron/update-rankings' }).sort({ timestamp: -1 });
```

---

## Notes

- All timestamps in ISO 8601 format (UTC)
- Season is hardcoded to 2025 in some cron jobs
- Conference IDs vary by conference (e.g., 8 for SEC)
- Team IDs are ESPN team IDs (e.g., "333" = Alabama)

---

**See also:** [Data Endpoints](./api-reference-data.md) | [Cron Jobs](./api-reference-cron.md)
