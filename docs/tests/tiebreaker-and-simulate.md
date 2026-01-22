# Tiebreaker Logic and Simulate Endpoint Testing

Tests the complete tiebreaker implementation: Simulate endpoint, conference tiebreaker rules (including async rules that fetch SP+ and FPI data), and standings generation.

**Related:** [API Reference](../guides/api-reference.md)

---

## Prerequisites

**Note**: All routes use dynamic structure `/api/[operation]/[sport]/[conf]` where `sport` is "cfb" and `conf` is the conference abbreviation (e.g., "SEC" for SEC conference). The simulate endpoint is `/api/simulate/[sport]/[conf]`.

**Data Requirements**: All data is fetched from CFBD API on each request. No database setup required. Games include `displayName`, team display fields, `predictedScore` (calculated from CFBD data), all completed games have final scores from CFBD API.

---

## Testing Procedures

**Setup**:
```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
```

**Basic Simulate**: `POST /api/simulate/cfb/SEC` with `{"season": 2025, "overrides": {}}`. Expected: Status 200, `standings` (all teams in conference), `championship` (top 2), `tieLogs`. Checks: All teams in conference, ranks 1-N, team display fields populated, championship array has 2 teams. **Note**: Dynamic endpoint supports multiple conferences (e.g., `/api/simulate/cfb/MWC` for Mountain West Conference). Some conferences use async tiebreaker rules that fetch external data (SP+ and FPI ratings) on demand.

**Simulate with Overrides**: `{"season": 2025, "overrides": {"gameId": {"homeScore": 35, "awayScore": 24}}}`. Expected: Status 200, standings reflect overrides. Game IDs match the `id` field from GameLean objects returned by the games endpoint.

**Invalid Score Validation**: Tie score → Status 400 (tie not allowed), Negative score → Status 400 (negative not allowed), Non-integer → Status 400 (whole numbers only), Missing `season` → Status 400

**Tiebreaker Rules**: Check `tieLogs` - Rules applied in order (varies by conference), each step has `rule` (formatted name, e.g., "Head-to-Head", "Opponent Win Percentage", "Team Rating Score"), `detail`, `survivors`, `tieBroken` (boolean), `label` ("Advances" or "Remaining"), survivors array decreases or stays same. **Note**: Some rules are async and fetch external data (e.g., SP+ and FPI ratings for MWC team rating score rule). Rules are conference-specific and configured in `lib/cfb/tiebreaker-rules/{conf}/config.ts`.

**Championship Matchup**: Verify `championship[0] == standings[0].teamId`, `championship[1] == standings[1].teamId`, top 2 teams have highest win percentages

**Data Integrity**: Verify no null/empty abbrev/displayName, logo URLs start with "https://", color codes valid hex (6 characters)

---

## Performance & Troubleshooting

**Performance**: Response time < 2s (no overrides), < 3s (10 overrides), no memory leaks after 10 consecutive requests

**Troubleshooting**: "Cannot read properties of undefined" → Games missing displayName/logo/color (restart dev server, verify CFBD API responses). "No conference games found" → Invalid season or conference (check CFBD API, verify conference abbreviation). Empty standings → No teams with conference game records (ensure conferenceGame flag true in CFBD data). Incorrect tiebreaker → Logic error or missing data (check tie logs, verify scores, check head-to-head games)

---

## Testing Checklist

**Basic**: Basic simulate (no overrides), simulate with valid overrides, invalid score validation (tie/negative/non-integer), missing required fields, multi-conference support (SEC, MWC, etc.)

**Tiebreaker**: Rule A (head-to-head), all rules present in tie logs (varies by conference), championship matchup correct, async rules (SP+/FPI fetching) work correctly

**Data Quality**: Team display data populated, all teams in standings (varies by conference size), records accurate, explanations readable

**Performance**: Response time < 2s, no errors after multiple requests
