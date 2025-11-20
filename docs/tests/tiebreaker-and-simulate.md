# Tiebreaker Logic and Simulate Endpoint Testing

Tests the complete tiebreaker implementation: Game model updates, simulate endpoint, conference tiebreaker rules A-E, and standings generation.

**Related Documentation:**
- [API Reference](../guides/api-reference.md) - `/api/simulate` endpoint documentation
- [Tiebreaker Logic Plan](../plans/tiebreaker-logic.md) - Original planning document (historical reference)

---

## Prerequisites

### Database Setup

1. Fresh database with updated Game model (includes `displayName`, team fields: `logo`, `color`, `displayName`, `predictedScore`)
2. All conference teams pulled via `/api/pull-teams`
3. Full 2025 regular season games (weeks 1-14) pulled via `/api/pull-games`

### Data Requirements

- All conference teams in database
- ~128 conference games (2025 season, weeks 1-14)
- Games must include:
  - Game `displayName` field (format: "{away abbrev} @ {home abbrev}")
  - Team display fields (`displayName`, `logo`, `color`) for home/away teams
  - `predictedScore` field for conference games
- All completed games have final scores

---

## Test 1: Basic Simulate - No Overrides

Tests standings calculation based on actual game results with no user predictions.

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {}
  }' | jq .
```

### Expected Results

- **Status**: 200
- **Response Structure**:
  ```json
  {
    "standings": [...],
    "championship": ["teamId1", "teamId2"],
    "tieLogs": [...]
  }
  ```
- **Standings Array**:
  - Length: Number of teams in conference (e.g., 16 for SEC)
  - Ordered by rank (1-16)
  - Each entry has: `rank`, `teamId`, `abbrev`, `displayName`, `logo`, `color`, `record`, `confRecord`, `explainPosition`
- **Championship**: Array with top 2 team IDs
- **Tie Logs**: Array of tie scenarios that were broken (may be empty if no ties)

### Checks

- [ ] Status 200
- [ ] All 16 teams present in standings
- [ ] Ranks are sequential 1-16
- [ ] Team display fields populated (displayName, logo, color not empty/null)
- [ ] Records are realistic (wins + losses = total games played)
- [ ] explainPosition strings are human-readable
- [ ] Championship array has exactly 2 teams
- [ ] Top 2 teams in standings match championship array

---

## Test 2: Simulate with Overrides

Tests user score predictions for incomplete/future games.

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {
      "401752686": {
        "homeScore": 35,
        "awayScore": 24
      }
    }
  }' | jq .
```

_Replace `401752686` with an actual game ESPN ID from your database_

### Expected Results

- Status 200
- Standings reflect the overridden score
- Team records updated based on override
- No error about tie scores

### Checks

- [ ] Status 200
- [ ] Overridden game affects team records correctly
- [ ] Winner gains a win, loser gains a loss
- [ ] explainPosition updated if override affects ranking

---

## Test 3: Invalid Overrides - Tie Score

Tests validation of user input (ties not allowed).

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {
      "401752686": {
        "homeScore": 21,
        "awayScore": 21
      }
    }
  }'
```

### Expected Results

- **Status**: 500
- **Error Message**: Contains "Tie scores not allowed"

### Checks

- [ ] Status 500
- [ ] Error message mentions tie scores

---

## Test 4: Invalid Overrides - Negative Score

Tests validation of negative scores.

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {
      "401752686": {
        "homeScore": -5,
        "awayScore": 24
      }
    }
  }'
```

### Expected Results

- **Status**: 500
- **Error Message**: Contains "cannot be negative"

### Checks

- [ ] Status 500
- [ ] Error message mentions negative scores

---

## Test 5: Invalid Overrides - Non-Integer Score

Tests validation of decimal/float scores.

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {
      "401752686": {
        "homeScore": 35.5,
        "awayScore": 24
      }
    }
  }'
```

### Expected Results

- **Status**: 500
- **Error Message**: Contains "must be whole numbers"

### Checks

- [ ] Status 500
- [ ] Error message mentions whole numbers

---

## Test 6: Missing Required Fields

Tests API validation for missing season/conferenceId.

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "overrides": {}
  }'
```

### Expected Results

- **Status**: 400
- **Error Message**: Contains "Missing required fields"

### Checks

- [ ] Status 400
- [ ] Error mentions missing fields

---

## Test 7: Tiebreaker Rule A - Head-to-Head

Tests that head-to-head record breaks ties correctly.

### Setup

Identify 2-3 teams with identical conference records that have played each other.

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {}
  }' | jq '.tieLogs[] | select(.steps[0].rule == "A: Head-to-Head")'
```

### Expected Results

- Tie logs show Rule A being applied
- Team with better head-to-head record ranked higher
- explainPosition mentions head-to-head

### Checks

- [ ] Tie logs include Rule A applications
- [ ] Head-to-head winner correctly identified
- [ ] Explanation strings mention head-to-head

---

## Test 8: Verify All Tiebreaker Rules

Tests that rules B-E can be applied when needed.

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {}
  }' | jq '.tieLogs'
```

### Expected Results

- Tie logs show various rules being applied
- Rules applied in order: A, B, C, D, E
- Each step has `rule`, `detail`, `survivors` fields

### Checks

- [ ] Tie logs present (if there are any ties)
- [ ] Rules are applied in correct order
- [ ] Survivors array decreases or stays same at each step
- [ ] Human-readable details for each rule

---

## Test 9: Championship Matchup

Tests that top 2 teams are correctly identified.

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {}
  }' | jq '{
    first: .standings[0],
    second: .standings[1],
    championship: .championship
  }'
```

### Expected Results

- Championship array matches top 2 standings
- Both teams have best records in conference

### Checks

- [ ] Championship[0] == standings[0].teamId
- [ ] Championship[1] == standings[1].teamId
- [ ] Top 2 teams have highest win percentages

---

## Test 10: Data Integrity

Tests that team display data is properly populated.

### Command

```bash
BASE_URL=$(grep BASE_URL .env.local | cut -d '=' -f2 || echo "http://localhost:3000")
curl -X POST "${BASE_URL}/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2025,
    "conferenceId": "8",
    "overrides": {}
  }' | jq '.standings[] | {abbrev, displayName, logo, color}'
```

### Expected Results

- All teams have non-empty abbrev (e.g., "UGA", "ALA")
- All teams have displayName (e.g., "Georgia Bulldogs")
- All teams have logo URL
- All teams have color hex code

### Checks

- [ ] No null/empty abbrev fields
- [ ] No null/empty displayName fields
- [ ] Logo URLs start with "https://"
- [ ] Color codes are valid hex (6 characters)

---

## Performance Checks

### Response Time

- Simulate with no overrides: < 2 seconds
- Simulate with 10 overrides: < 3 seconds

### Memory

- No memory leaks after 10 consecutive requests
- Server remains responsive

---

## Integration with Cron Jobs

These will be tested after cron implementation:

1. Live games cron updates scores → simulate reflects new standings
2. Rankings cron updates team data → simulate uses updated averages for Rule E
3. Spreads cron updates odds → affects predictedScore prefills (future feature)

---

## Troubleshooting

### "Cannot read properties of undefined (reading 'home')"

**Cause**: Games in database don't have displayName, logo, color fields

**Fix**:

1. Restart dev server (model changes require restart)
2. Drop database
3. Re-pull games: `POST /api/pull-games` with no week parameter
4. Verify: `GET /api/games?season=2025&week=1` - check if `home.displayName` exists

### "No conference games found for this season"

**Cause**: Wrong database connected or no games in database

**Fix**:

1. Check `.env.local` for correct MONGODB_URI and database name
2. Verify games exist: `GET /api/games?season=2025&conferenceId=8`
3. Re-pull if needed

### Empty standings array

**Cause**: No teams with conference game records

**Fix**:

1. Ensure conferenceGame flag is true for pulled games
2. Verify conference teams are in constants: check `lib/constants.ts`
3. Re-pull games ensuring `conferenceId: 8` in request

### Incorrect tiebreaker results

**Cause**: Logic error or missing game data

**Debug**:

1. Check tie logs to see which rules were applied
2. Verify game scores are correct in database
3. Check that all head-to-head games exist
4. Review explainPosition strings for clues

---

## Testing Checklist

### Basic Functionality

- [ ] Test 1: Basic simulate (no overrides)
- [ ] Test 2: Simulate with valid overrides
- [ ] Test 3: Invalid - tie score
- [ ] Test 4: Invalid - negative score
- [ ] Test 5: Invalid - non-integer score
- [ ] Test 6: Missing required fields

### Tiebreaker Rules

- [ ] Test 7: Rule A (head-to-head)
- [ ] Test 8: All rules present in tie logs
- [ ] Test 9: Championship matchup correct

### Data Quality

- [ ] Test 10: Team display data populated
- [ ] All conference teams in standings
- [ ] Records are accurate
- [ ] Explanations are readable

### Performance

- [ ] Response time < 2s for basic simulate
- [ ] No errors after multiple requests
- [ ] Server remains stable

---

## Next Steps

After tiebreaker tests pass:

1. Test cron jobs (see `cron-jobs-testing.md`)
2. Test predicted score prefill logic
3. Test Rule E with simulated scores
4. Deploy to staging and test with production data
