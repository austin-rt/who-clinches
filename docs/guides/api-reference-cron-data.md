# API Reference: Cron Jobs - Data Updates

Reference for data update cron endpoints.

**Related:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md) | [Batch & Testing Jobs](./api-reference-cron-batch.md)

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

## GET /api/cron/update-games

Updates scores, states, and odds for games.

**Query Parameters:**

| Parameter | Type   | Description                                   |
| --------- | ------ | --------------------------------------------- |
| `mode`    | string | `active` (default), `week`, or `season`       |

**Modes:** `active` (default, incomplete games only), `week` (current week), `season` (entire season)

**Schedule:** Hobby: via `update-all` daily 10PM ET (`0 2 * * *` UTC) with `mode=season`. Pro: Every 5 min Thu-Fri 9PM-2AM ET, Sat 4PM-2AM ET.

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

**Response Fields:** `updated`, `gamesChecked`, `activeGames`, `espnCalls`, `lastUpdated`, `errors[]`

**Updates:** `state`, `completed`, `home.score`, `away.score`, `home.rank`, `away.rank`, `odds.*`, `predictedScore`

**Logic:** `mode=season` pulls entire season, `mode=week` pulls current week, `mode=active` (default) updates incomplete games only. Recalculates `predictedScore` for all games.

---

## GET /api/cron/update-spreads

**Pro Mode Only**: Updates betting odds and recalculates predicted scores for upcoming games.

**Schedule:** Pro: Every hour 1PM-5AM ET (`0 13-5 * * *` UTC). Hobby: Not used (via batch endpoint).

**Response:** Same format as `update-games`

**Updates:** `odds.*`, `predictedScore`

**Logic:** Queries upcoming conference games, fetches odds from ESPN, updates if changed. Recalculates `predictedScore` using priority: ESPN odds → team averages + spread → ranking-based → home field advantage.

**Notes:** Pro-only. More frequent than `update-games` to catch line movements. Only updates odds, not scores/states.

---

## GET /api/cron/update-rankings

Updates team rankings, standings, and season statistics.

**Schedule:** Hobby: via `update-all` daily 10PM ET (`0 2 * * *` UTC). Pro: Sunday 3AM ET + Wednesday 3AM ET (`0 3 * * 0` + `0 3 * * 3`).

**Response:**

```json
{
  "updated": 16,
  "teamsChecked": 16,
  "espnCalls": 32,
  "lastUpdated": "2025-11-12T01:39:46.147Z",
  "errors": []
}
```

**Response Fields:** `updated`, `teamsChecked` (16), `espnCalls`, `lastUpdated`, `errors[]`

**Updates:** `nationalRanking`, `conferenceStanding`, `record.*`, `record.stats.*` (including `avgPointsFor`/`avgPointsAgainst` for `predictedScore`)

**Logic:** Loops through all conference teams, calls Site API (metadata/rankings) and Core API (stats/averages). Falls back to Site API if Core API null. 500ms rate limit, retries once.

**Notes:** Critical for `predictedScore`. Run weekly after rankings release.

---

## GET /api/cron/update-team-averages

**Pro Mode Only**: Updates team season statistics more frequently than rankings cron.

**Schedule:** Pro: Sunday 1AM ET (`0 6 * * 0` UTC). Hobby: Not used (via `update-rankings`).

**Response:** Same format as `update-rankings`

**Updates:** Same as `update-rankings` (focused on stats)

**Logic:** Same as `update-rankings` but separate for Pro mode. Allows frequent stat updates without full rankings sync.

**Notes:** Pro-only. Runs Sunday after games complete.

---

**See also:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md) | [Batch & Testing Jobs](./api-reference-cron-batch.md)

