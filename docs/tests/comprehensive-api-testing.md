# Comprehensive API Testing Guide

Complete testing procedures for all Conference Tiebreaker API endpoints.

**Environment-agnostic**: Use placeholders `{BASE_URL}`, `{DATABASE}`, and credential variables for any environment.

**Related:** [API Reference](../guides/api-reference.md) | [ESPN API Testing](./espn-api-testing.md) | [API Types](../../lib/api-types.ts)

---

## Prerequisites

**Environment Files**: `.env.local` (local, default), `.env.preview` (staging), `.env.production` (production). Database verification uses read-only credentials from `.env.local`.

**Required Credentials**: `VERCEL_AUTOMATION_BYPASS_SECRET` (auto-handled by scripts/tests), `CRON_SECRET`, `MONGODB_USER_READONLY`, `MONGODB_PASSWORD_READONLY`

**Setup**: Environment variables `BASE_URL`, `DATABASE`, dev server running, appropriate `.env.*` file

---

## Testing Procedures

## Testing Procedures

**Setup**:
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
```

**POST /api/pull-teams/[sport]/[conf]**: Pre-check teams exist. Expected: Status 200, `upserted: 16`. Invalid: Unsupported conference → Status 400. Example: `/api/pull-teams/cfb/sec`

**POST /api/pull-games/[sport]/[conf]**: Prerequisites: Teams seeded first. Pre-check games exist. Expected: Status 200, `upserted`, `weeksPulled` array. Invalid: Missing `season` → Status 400. Example: `/api/pull-games/cfb/sec`

**GET /api/games/[sport]/[conf]**: Query params: `season`, `week`, `state` (pre/in/post), `from`, `to`. Expected: Status 200, `events` array, `teams` array (TeamMetadata: `id`, `abbrev`, `displayName`, `logo`, `color`, `alternateColor`), `lastUpdated`. Example: `/api/games/cfb/sec`

**POST /api/simulate/[sport]/[conf]**: Expected: Status 200, `standings` (16 teams, ranks 1-16), `championship` (length 2), `tieLogs`. Invalid: Missing `season`, invalid score → Status 400. Example: `/api/simulate/cfb/sec`

**Cron Jobs** (all require `Authorization: Bearer ${CRON_SECRET}`): `update-games` (modes: `season`, `week`, default), `update-rankings` (16 teams), `update-spreads`, `update-team-averages`, `update-all` (batch). Invalid: Missing/invalid auth → Status 401

---

## Database Verification

**Setup** (see [ESPN Data Pipeline Quick Ref](./espn-data-pipeline-quick-ref.md) for full commands): Extract MongoDB credentials from `.env.local`

**Verify**: Teams count, games count (season 2025, conferenceGame: true), predictedScore exists for conference games

---

## Success Criteria & Troubleshooting

**Success Criteria**: Valid requests return 2xx, invalid return 4xx, response schemas match `lib/api-types.ts`, database state reflects changes, no unhandled errors, logs confirm correct database

**Troubleshooting**: Wrong database → Check Vercel logs for `[MongoDB] Connecting to database: {DATABASE}`. Bypass token → Verify `VERCEL_AUTOMATION_BYPASS_SECRET` matches Vercel setting. Rate limiting → Wait 1-2 minutes (500ms delay). Null conference records → Check ESPN Core API accessibility
