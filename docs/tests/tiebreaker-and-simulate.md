# Tiebreaker Logic and Simulate Endpoint Testing

Tests the complete tiebreaker implementation: Game model updates, simulate endpoint, conference tiebreaker rules A-E, and standings generation.

**Related:** [API Reference](../guides/api-reference.md) | [Tiebreaker Logic Plan](../plans/tiebreaker-logic.md)

---

## Prerequisites

**Database Setup:**
1. Fresh database with updated Game model (includes `displayName`, team fields: `logo`, `color`, `displayName`, `predictedScore`)
2. All conference teams pulled via `/api/pull-teams`
3. Full 2025 regular season games (weeks 1-14) pulled via `/api/pull-games`

**Data Requirements:**
- All conference teams in database
- ~128 conference games (2025 season, weeks 1-14)
- Games must include: `displayName`, team display fields, `predictedScore`
- All completed games have final scores

---

## Testing Procedures

### Basic Simulate - No Overrides

**Test:**
```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}' | jq .
```

**Expected:** Status 200, `standings` array (16 teams), `championship` array (top 2), `tieLogs` array

**Checks:**
- All 16 teams present in standings
- Ranks are sequential 1-16
- Team display fields populated (displayName, logo, color)
- Records are realistic
- Championship array has exactly 2 teams
- Top 2 teams in standings match championship array

### Simulate with Overrides

**Test:**
```bash
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752686": {"homeScore": 35, "awayScore": 24}}}' | jq .
```

**Expected:** Status 200, standings reflect overrides

**Checks:**
- Overrides reflected in final standings
- Records updated correctly
- Tiebreaker rules applied with new scores

### Invalid Score Validation

**Tie Score:**
```bash
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752686": {"homeScore": 21, "awayScore": 21}}}'
```
**Expected:** Status 400, error mentions tie scores not allowed

**Negative Score:**
```bash
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752686": {"homeScore": -5, "awayScore": 24}}}'
```
**Expected:** Status 400, error mentions negative scores

**Non-Integer Score:**
```bash
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {"401752686": {"homeScore": 35.5, "awayScore": 24}}}'
```
**Expected:** Status 400, error mentions whole numbers

**Missing Required Fields:**
```bash
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"overrides": {}}'
```
**Expected:** Status 400, error mentions missing fields

### Tiebreaker Rules

**Rule A - Head-to-Head:**
```bash
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}' | jq '.tieLogs[] | select(.steps[0].rule == "A: Head-to-Head")'
```

**Checks:**
- Tie logs show Rule A being applied
- Team with better head-to-head record ranked higher
- Explanation strings mention head-to-head

**All Rules:**
```bash
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}' | jq '.tieLogs'
```

**Checks:**
- Rules applied in order: A, B, C, D, E
- Each step has `rule`, `detail`, `survivors` fields
- Survivors array decreases or stays same at each step

### Championship Matchup

**Test:**
```bash
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}' | jq '{first: .standings[0], second: .standings[1], championship: .championship}'
```

**Checks:**
- Championship[0] == standings[0].teamId
- Championship[1] == standings[1].teamId
- Top 2 teams have highest win percentages

### Data Integrity

**Team Display Data:**
```bash
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}' | jq '.standings[] | {abbrev, displayName, logo, color}'
```

**Checks:**
- No null/empty abbrev, displayName fields
- Logo URLs start with "https://"
- Color codes are valid hex (6 characters)

---

## Performance

**Response Time:**
- Simulate with no overrides: < 2 seconds
- Simulate with 10 overrides: < 3 seconds

**Memory:**
- No memory leaks after 10 consecutive requests
- Server remains responsive

---

## Troubleshooting

**"Cannot read properties of undefined (reading 'home')":**
- Games missing displayName, logo, color fields
- Fix: Restart dev server, drop database, re-pull games

**"No conference games found for this season":**
- Wrong database connected or no games in database
- Fix: Check `.env.local` for correct MONGODB_URI, verify games exist

**Empty standings array:**
- No teams with conference game records
- Fix: Ensure conferenceGame flag is true, verify conference teams in constants

**Incorrect tiebreaker results:**
- Logic error or missing game data
- Debug: Check tie logs, verify game scores, check head-to-head games exist

---

## Testing Checklist

**Basic:**
- [ ] Basic simulate (no overrides)
- [ ] Simulate with valid overrides
- [ ] Invalid score validation (tie, negative, non-integer)
- [ ] Missing required fields

**Tiebreaker:**
- [ ] Rule A (head-to-head)
- [ ] All rules present in tie logs
- [ ] Championship matchup correct

**Data Quality:**
- [ ] Team display data populated
- [ ] All conference teams in standings
- [ ] Records are accurate
- [ ] Explanations are readable

**Performance:**
- [ ] Response time < 2s
- [ ] No errors after multiple requests
