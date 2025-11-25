# API Reference: Cron Jobs - Data Updates

Reference for data update cron endpoints.

**Related:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md) | [Batch & Testing Jobs](./api-reference-cron-batch.md)

---

**Authentication:** All cron jobs require `Authorization: Bearer {CRON_SECRET}`. See [Cron Jobs API Reference](./api-reference-cron.md) for details.

---

## GET /api/cron/[sport]/[conf]/update-games

**Example**: `/api/cron/cfb/sec/update-games`

Updates scores, states, and odds for games.

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "sec")

**Query Parameters**: `mode` (string) - `active` (default, incomplete games only), `week` (current week), `season` (entire season)

**Schedule**: Hobby: via `update-all` daily 10PM ET (`0 2 * * *` UTC) with `mode=season`. Pro: Every 5 min Thu-Fri 9PM-2AM ET, Sat 4PM-2AM ET.

**Response:**

```json
{
  "updated": 6,
  "gamesChecked": 6,
  "activeGames": 16,
  "espnCalls": 1,
  "lastUpdated": "2025-11-12T01:40:28.882Z",
  "errors": []
}
```

**Response Fields**: `updated`, `gamesChecked`, `activeGames`, `espnCalls`, `lastUpdated`, `errors[]`

**Updates**: `state`, `completed`, `home.score`, `away.score`, `home.rank`, `away.rank`, `odds.*`, `predictedScore`

**Logic**: `mode=season` pulls entire season, `mode=week` pulls current week, `mode=active` (default) updates incomplete games only. Recalculates `predictedScore` for all games.

---

## GET /api/cron/[sport]/[conf]/update-spreads

**Example**: `/api/cron/cfb/sec/update-spreads`

**Pro Mode Only**: Updates betting odds and recalculates predicted scores for upcoming games.

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "sec")

**Schedule**: Pro: Every hour 1PM-5AM ET (`0 13-5 * * *` UTC). Hobby: Not used (via batch endpoint)

**Response**: Same format as `update-games`

**Updates**: `odds.*`, `predictedScore`

**Logic**: Queries upcoming conference games, fetches odds from ESPN, updates if changed. Recalculates `predictedScore` using priority: ESPN odds → team averages + spread → ranking-based → home field advantage

**Notes**: Pro-only, more frequent than `update-games` to catch line movements, only updates odds (not scores/states)

---

## GET /api/cron/[sport]/[conf]/update-rankings

**Example**: `/api/cron/cfb/sec/update-rankings`

Updates team rankings, standings, and season statistics.

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "sec")

**Schedule**: Hobby: via `update-all` daily 10PM ET (`0 2 * * *` UTC). Pro: Sunday 3AM ET + Wednesday 3AM ET (`0 3 * * 0` + `0 3 * * 3`)

**Response Fields**: `updated`, `teamsChecked` (16), `espnCalls`, `lastUpdated`, `errors[]`

**Updates**: `nationalRanking`, `conferenceStanding`, `record.*`, `record.stats.*` (including `avgPointsFor`/`avgPointsAgainst` for `predictedScore`)

**Logic**: Loops through all conference teams, calls Site API (metadata/rankings) and Core API (stats/averages), falls back to Site API if Core API null, 500ms rate limit, retries once

**Notes**: Critical for `predictedScore`, run weekly after rankings release

---

## GET /api/cron/[sport]/[conf]/update-team-averages

**Example**: `/api/cron/cfb/sec/update-team-averages`

**Pro Mode Only**: Updates team season statistics more frequently than rankings cron.

**Path Parameters**: `sport` (string, e.g., "cfb"), `conf` (string, e.g., "sec")

**Schedule**: Pro: Sunday 1AM ET (`0 6 * * 0` UTC). Hobby: Not used (via `update-rankings`)

**Response**: Same format as `update-rankings`

**Updates**: Same as `update-rankings` (focused on stats)

**Logic**: Same as `update-rankings` but separate for Pro mode, allows frequent stat updates without full rankings sync

**Notes**: Pro-only, runs Sunday after games complete

---

**See also:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md) | [Batch & Testing Jobs](./api-reference-cron-batch.md)

