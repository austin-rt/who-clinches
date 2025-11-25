# Tiebreaker Logic and Simulate Endpoint Testing

Tests the complete tiebreaker implementation: Game model updates, simulate endpoint, conference tiebreaker rules A-E, and standings generation.

**Related:** [API Reference](../guides/api-reference.md) | [Tiebreaker Logic Plan](../plans/tiebreaker-logic.md)

---

## Prerequisites

**Database Setup**: Fresh database with updated Game model, all conference teams pulled via `/api/pull-teams/cfb/sec`, full 2025 regular season games (weeks 1-14) pulled via `/api/pull-games/cfb/sec`

**Note**: Routes use dynamic structure `/api/[operation]/[sport]/[conf]` where `sport` is "cfb" and `conf` is "sec" for SEC conference.

**Data Requirements**: All conference teams in database, ~128 conference games (2025, weeks 1-14), games include `displayName`, team display fields, `predictedScore`, all completed games have final scores

---

## Testing Procedures

**Setup**:
```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
```

**Basic Simulate**: `POST /api/simulate/cfb/sec` (or `/api/simulate/[sport]/[conf]` with sport="cfb", conf="sec") with `{"season": 2025, "overrides": {}}`. Expected: Status 200, `standings` (16 teams), `championship` (top 2), `tieLogs`. Checks: All 16 teams, ranks 1-16, team display fields populated, championship array has 2 teams

**Simulate with Overrides**: `{"season": 2025, "overrides": {"gameEspnId": {"homeScore": 35, "awayScore": 24}}}`. Expected: Status 200, standings reflect overrides

**Invalid Score Validation**: Tie score → Status 400 (tie not allowed), Negative score → Status 400 (negative not allowed), Non-integer → Status 400 (whole numbers only), Missing `season` → Status 400

**Tiebreaker Rules**: Check `tieLogs` - Rules applied in order A, B, C, D, E, each step has `rule`, `detail`, `survivors` fields, survivors array decreases or stays same

**Championship Matchup**: Verify `championship[0] == standings[0].teamId`, `championship[1] == standings[1].teamId`, top 2 teams have highest win percentages

**Data Integrity**: Verify no null/empty abbrev/displayName, logo URLs start with "https://", color codes valid hex (6 characters)

---

## Performance & Troubleshooting

**Performance**: Response time < 2s (no overrides), < 3s (10 overrides), no memory leaks after 10 consecutive requests

**Troubleshooting**: "Cannot read properties of undefined" → Games missing displayName/logo/color (restart dev server, drop database, re-pull games). "No conference games found" → Wrong database or no games (check MONGODB_URI, verify games exist). Empty standings → No teams with conference game records (ensure conferenceGame flag true). Incorrect tiebreaker → Logic error or missing data (check tie logs, verify scores, check head-to-head games)

---

## Testing Checklist

**Basic**: Basic simulate (no overrides), simulate with valid overrides, invalid score validation (tie/negative/non-integer), missing required fields

**Tiebreaker**: Rule A (head-to-head), all rules present in tie logs, championship matchup correct

**Data Quality**: Team display data populated, all 16 teams in standings, records accurate, explanations readable

**Performance**: Response time < 2s, no errors after multiple requests
