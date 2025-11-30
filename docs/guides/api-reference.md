# API Reference

Complete reference for all Conference Tiebreaker API endpoints.

---

## Endpoint Documentation

- **[Data Endpoints](./api-reference-data.md)** - POST /api/games/[sport]/[conf], POST /api/simulate/[sport]/[conf]
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
- Core API: ~500ms between requests
- Scoreboard API: No rate limit (batched by week)

**Our APIs:**
- Data endpoints: No rate limit
- Frontend polling: Conditional (every 5 min when games are active)

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
- All endpoints fetch from ESPN, reshape data, upsert to database, and return reshaped data
- Dev/prod/preview databases store reshaped data (Game, Team models), not raw ESPN responses
- Conference IDs vary by conference (e.g., 8 for SEC)
- Team IDs are ESPN team IDs (e.g., "333" = Alabama)
- Frontend uses RTK Query with conditional polling for live updates

---

**See also:** [Data Endpoints](./api-reference-data.md) | [Cron Jobs](./api-reference-cron.md)
