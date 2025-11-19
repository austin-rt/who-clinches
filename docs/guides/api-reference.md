# API Reference

Complete reference for all SEC Tiebreaker API endpoints.

**Related Documentation:**
- [Comprehensive API Testing](../tests/comprehensive-api-testing.md) - Detailed testing procedures
- [ESPN API Testing](../tests/espn-api-testing.md) - ESPN API field verification patterns

---

## Endpoint Documentation

- **[Data Endpoints](./api-reference-data.md)** - GET /api/games, POST /api/pull-teams, POST /api/pull-games, POST /api/simulate
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

| Variable      | Required | Description                          |
| ------------- | -------- | ------------------------------------ |
| `CRON_SECRET` | Yes      | Bearer token for cron authentication |
| `MONGODB_URI` | Yes      | MongoDB connection string            |

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
- Conference ID 8 = SEC
- Team IDs are ESPN team IDs (e.g., "333" = Alabama)

---

**For detailed endpoint documentation, see:**
- [Data Endpoints](./api-reference-data.md)
- [Cron Jobs](./api-reference-cron.md)
