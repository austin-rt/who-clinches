# API Reference: Stats Endpoints

Complete reference for statistics endpoints.

**Related:** [Main API Reference](./api-reference.md)

**Note**: All endpoints fetch data directly from the CFBD API on each request. No database persistence is used.

---

## GET /api/stats/rankings

Fetches College Football Playoff (CFP) rankings from CFBD API.

**Query Parameters**:

- `season` (string, required) - Season year (2024 or later)
- `week` (string, optional) - Week number (if invalid, returns 400 error)

**Response**: `{ "rankings": PollWeek[] | null }`

**PollWeek**: Contains CFP poll data with team rankings. Returns `null` if no CFP rankings are available for the specified season/week.

**Caching**: No caching (rankings update at different times throughout the week). Response includes `Cache-Control: no-store` header.

**Error Responses**:

- `400` - Missing or invalid season/week parameter
- `500` - CFBD API error

**Notes**: Filters CFBD rankings to only include College Football Playoff polls (CFP, Playoff Committee Rankings). Returns `null` if no CFP rankings found.

---

## GET /api/stats/advanced

Fetches advanced season statistics from CFBD API.

**Query Parameters**:

- `season` (string, required) - Season year (2024 or later. If invalid, returns 400 error)

**Response**: `{ "stats": AdvancedSeasonStat[] }`

**AdvancedSeasonStat**: Contains advanced team statistics for the season (e.g., SP+, FPI, SOR, turnover margin, yards per play).

**Caching**: Cached until next Monday at 5 AM ET (revalidates weekly after all games complete). Uses Next.js `unstable_cache` with dynamic revalidation.

**Error Responses**:

- `400` - Missing or invalid season parameter
- `500` - CFBD API error

**Notes**: Fetches comprehensive advanced statistics for all teams in the specified season. Cache revalidates weekly to ensure fresh data after weekend games complete.

---

**See also:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)
