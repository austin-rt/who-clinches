# API Reference: Stats Endpoints

Complete reference for statistics endpoints.

**Related:** [Main API Reference](./api-reference.md)

**Note**: Rankings are cached in Upstash Redis (production only) with a weekly TTL (Saturday 11 AM ET). Non-production environments fetch directly from the CFBD API.

---

## GET /api/stats/rankings

Fetches College Football Playoff (CFP) rankings from CFBD API.

**Query Parameters**: 
- `season` (string, required) - Season year
- `week` (string, optional) - Week number (if invalid, returns 400 error)

**Response**: `{ "rankings": PollWeek[] | null }`

**PollWeek**: Contains CFP poll data with team rankings. Returns `null` if no CFP rankings are available for the specified season/week.

**Caching**: Cached in Upstash Redis (production only) with weekly TTL (Saturday 11 AM ET).

**Error Responses**: 
- `400` - Missing or invalid season/week parameter
- `500` - CFBD API error

**Notes**: Filters CFBD rankings to only include College Football Playoff polls (CFP, Playoff Committee Rankings). Returns `null` if no CFP rankings found.

---

**See also:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)
