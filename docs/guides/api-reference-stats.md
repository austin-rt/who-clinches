# API Reference: Stats Endpoints

Complete reference for statistics endpoints.

**Related:** [Main API Reference](./api-reference.md)

**Note**: All endpoints fetch data directly from the CFBD API on each request. No database persistence is used.

---

## GET /api/stats/rankings

Fetches College Football Playoff (CFP) rankings from CFBD API.

**Query Parameters**: 
- `season` (string, required) - Season year
- `week` (string, optional) - Week number (if invalid, returns 400 error)

**Response**: `{ "rankings": PollWeek[] | null }`

**PollWeek**: Contains CFP poll data with team rankings. Returns `null` if no CFP rankings are available for the specified season/week.

**Caching**: No caching (rankings update at different times throughout the week). Response includes `Cache-Control: no-store` header.

**Error Responses**: 
- `400` - Missing or invalid season/week parameter
- `500` - CFBD API error

**Notes**: Filters CFBD rankings to only include College Football Playoff polls (CFP, Playoff Committee Rankings). Returns `null` if no CFP rankings found.

---

**See also:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)
