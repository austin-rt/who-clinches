# API Reference: Cron Jobs

Complete reference for scheduled update endpoints.

**Related:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)

**Cron Job Documentation:**
- [Data Update Jobs](./api-reference-cron-data.md) - update-games, update-spreads, update-rankings, update-team-averages
- [Batch & Testing Jobs](./api-reference-cron-batch.md) - update-all, update-test-data, run-reshape-tests

---

## Authentication

All cron jobs require Bearer token authentication:

```
Authorization: Bearer {CRON_SECRET}
```

**401 Response:**
```json
{
  "error": "Unauthorized"
}
```

---

For detailed endpoint documentation, see:
- [Data Update Jobs](./api-reference-cron-data.md) - Core data update endpoints
- [Batch & Testing Jobs](./api-reference-cron-batch.md) - Batch orchestration and testing endpoints

---

**See also:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)
