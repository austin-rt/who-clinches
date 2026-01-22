# Comprehensive API Testing Guide

Complete testing procedures for all Conference Tiebreaker API endpoints.

**Environment-agnostic**: Use placeholders `{BASE_URL}` and credential variables for any environment.

**Related:** [API Reference](../guides/api-reference.md) | [API Types](../../lib/api-types.ts)

---

## Prerequisites

**Environment Files**: `.env.local` (local, default), `.env.preview` (staging), `.env.production` (production).

**Required Credentials**: `VERCEL_AUTOMATION_BYPASS_SECRET` (auto-handled by scripts/tests, only needed for protected Vercel deployments)

**Setup**: Environment variables `BASE_URL`, dev server running, appropriate `.env.*` file

---

## Testing Procedures

**Setup**:
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
```

**GET /api/games/[sport]/[conf]**: Fetches games and teams from CFBD API. Query params: `season` (optional, defaults to current season), `week` (optional, requires season). Expected: Status 200, `events` array (GameLean[] with `home`/`away` containing `teamId`, `abbrev`, `displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`, `score`, `rank`), `teams` array (TeamMetadata: `id`, `abbrev`, `name`, `displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`, `conferenceStanding`, `conferenceRecord`, `rank`), `season` (number). Example: `GET /api/games/cfb/SEC?season=2025&week=11`

**GET /api/standings/[sport]/[conf]**: Fetches current conference standings calculated from completed conference games. Query params: `season` (optional, defaults to current season). Expected: Status 200, `teams` array (TeamMetadata with `conferenceStanding`, `conferenceRecord`, `rank`). Example: `GET /api/standings/cfb/SEC?season=2025`

**POST /api/simulate/[sport]/[conf]**: Expected: Status 200, `standings` (all teams in conference, ranks 1-N), `championship` (length 2), `tieLogs`. Invalid: Missing `season`, invalid score (negative/non-integer/tie) → Status 400. Dynamic endpoint supporting multiple conferences (e.g., `/api/simulate/cfb/SEC`, `/api/simulate/cfb/MWC`). Game IDs in overrides match the `id` field from GameLean objects. **Note**: Some conferences use async tiebreaker rules that fetch external data (SP+ and FPI ratings) on demand. Some conferences may display a simulation disclaimer when external data (e.g., KPI, SportSource) is not available.

**GET /api/games/[sport]/[conf]/subscribe**: GraphQL subscription for live score updates (Server-Sent Events). Only available when in season and GraphQL is enabled. Example: `GET /api/games/cfb/SEC/subscribe`

---

## Success Criteria & Troubleshooting

**Success Criteria**: Valid requests return 2xx, invalid return 4xx, response schemas match `lib/api-types.ts`, no unhandled errors

**Troubleshooting**: Bypass token → Verify `VERCEL_AUTOMATION_BYPASS_SECRET` matches Vercel setting. CFBD API errors → Check API key and rate limits. GraphQL subscription errors → Verify `allowGraphQL` is enabled and season status is correct.
