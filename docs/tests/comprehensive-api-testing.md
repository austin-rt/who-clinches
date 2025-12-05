# Comprehensive API Testing Guide

Complete testing procedures for all Conference Tiebreaker API endpoints.

**Environment-agnostic**: Use placeholders `{BASE_URL}`, `{DATABASE}`, and credential variables for any environment.

**Related:** [API Reference](../guides/api-reference.md) | [ESPN API Testing](./espn-api-testing.md) | [API Types](../../lib/api-types.ts)

---

## Prerequisites

**Environment Files**: `.env.local` (local, default), `.env.preview` (staging), `.env.production` (production). Database verification uses read-only credentials from `.env.local`.

**Required Credentials**: `VERCEL_AUTOMATION_BYPASS_SECRET` (auto-handled by scripts/tests, only needed for protected Vercel deployments)

**Setup**: Environment variables `BASE_URL`, `DATABASE`, dev server running, appropriate `.env.*` file

---

## Testing Procedures

**Setup**:
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
```

**GET /api/games/[sport]/[conf]**: Queries database only (read-only, no ESPN fetch). Query params: `season`, `week`, `state` (pre/in/post), `from`, `to`. Expected: Status 200, same response format as POST. Example: `GET /api/games/cfb/sec?season=2025&week=11`

**POST /api/games/[sport]/[conf]**: Fetches from ESPN, upserts to database, returns data. Body params: `season`, `week`, `state` (pre/in/post), `from`, `to`, `force`. Expected: Status 200, `events` array (GameLean[] with `home`/`away` containing `teamEspnId`, `abbrev`, `displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`, `score`, `rank`), `teams` array (TeamMetadata: `id`, `abbrev`, `name`, `displayName`, `logo`, `color`, `alternateColor`, `conferenceStanding`, `conferenceRecord`), `lastUpdated`. Example: `POST /api/games/cfb/sec`

**POST /api/games/[sport]/[conf]/live**: Lightweight live game updates (scores/status only). Body params: `season`, `force` (no `week` parameter - always queries current week). Expected: Status 200, `events` array with updated scores. Upserts games (creates if they don't exist). Recalculates predicted scores. Example: `/api/games/cfb/sec/live`

**POST /api/games/[sport]/[conf]/spreads**: Spread/odds updates only. Body params: `season`, `week`, `force`. Expected: Status 200, `events` array with updated odds. Example: `/api/games/cfb/sec/spreads`

**Note**: There is no separate `/api/teams/[sport]/[conf]` endpoint. Teams are automatically extracted and upserted when fetching games via `POST /api/games/[sport]/[conf]`. Team metadata is included in the `teams` array of the games endpoint response.

**POST /api/simulate/[sport]/[conf]**: Expected: Status 200, `standings` (16 teams, ranks 1-16), `championship` (length 2), `tieLogs`. Invalid: Missing `season`, invalid score → Status 400. Dynamic endpoint supporting multiple conferences (e.g., `/api/simulate/cfb/sec`).


---

## Database Verification

**Setup** (see [ESPN Data Pipeline Quick Ref](./espn-data-pipeline-quick-ref.md) for full commands): Extract MongoDB credentials from `.env.local`

**Verify**: Teams count, games count (season 2025, conferenceGame: true), predictedScore exists for conference games

---

## Success Criteria & Troubleshooting

**Success Criteria**: Valid requests return 2xx, invalid return 4xx, response schemas match `lib/api-types.ts`, database state reflects changes, no unhandled errors, logs confirm correct database

**Troubleshooting**: Wrong database → Check Vercel logs for `[MongoDB] Connecting to database: {DATABASE}`. Bypass token → Verify `VERCEL_AUTOMATION_BYPASS_SECRET` matches Vercel setting. Rate limiting → Wait 1-2 minutes (500ms delay). Null conference records → Verify completed conference games exist in database (records are calculated from games, not from ESPN API)
