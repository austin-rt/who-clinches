# Comprehensive Integration Tests for SEC Tiebreaker Rules

## Overview
Replace existing smoke tests in `__tests__/lib/tiebreaker-rules/integration.test.ts` with comprehensive integration tests that verify:
1. Rules cascade correctly (A → B → C → D → E)
2. Recursion works when teams are eliminated and re-ranked
3. Final outcomes match official SEC rules document expectations

## Implementation Details

### File to Update
- `__tests__/lib/tiebreaker-rules/integration.test.ts` - Replace all existing tests with comprehensive integration tests

### Test Approach
**Critical**: Tests must be written based SOLELY on the official SEC rules documents in `docs/tiebreaker-rules/sec/`. The current implementation should be ignored when writing tests. Tests verify that the implementation produces the correct outcomes according to the official rules, not that it matches current behavior.

### Test Structure
Each test will:
- Read the exact scenario from the SEC rules document (e.g., `docs/tiebreaker-rules/sec/rule-a-head-to-head.txt`)
- Use `createMockGame` from `test-helpers.ts` to create game data matching SEC document examples EXACTLY
- Call `breakTie(tiedTeams, games, allTeams, explanations)` to test full flow
- Verify `result.ranked` matches expected final ranking as stated in the SEC document
- Verify `result.steps` contains the correct rule that broke the tie (as specified in the SEC document)
- For recursion scenarios, verify eliminated teams are re-ranked using full cascade (check for multiple steps with appropriate rules as described in SEC documents)

### Test Categories

#### 1. Rule A Integration Tests
From `docs/tiebreaker-rules/sec/rule-a-head-to-head.txt`:
- **Two-team tie** (lines 75-83): Team A defeats Team B → verify Team A advances
- **Three-team tie for first place Example #1** (lines 87-93): Team A defeats B and C → verify Team A advances
- **Three-team tie for first place Example #2** (lines 94-103): Team A loses to B and C → verify A eliminated, B/C revert to two-team tiebreaker (test recursion)
- **Three-team tie for second place Example #2** (lines 126-134): Team A loses to B and C → verify A eliminated, B/C revert to two-team tiebreaker

#### 2. Rule B Integration Tests
From `docs/tiebreaker-rules/sec/rule-b-common-opponents.txt`:
- **Two-team tie** (lines 64-76): Team A 2-0 vs common, Team B 1-1 → verify Team A advances
- **Three-team tie for first place Example #1** (lines 104-117): Team A 2-0, Team B 1-1, Team C 0-2 → verify Team A advances, Teams B and C re-ranked using full cascade (test recursion)
- **Three-team tie for first place Example #2** (lines 118-132): Team A 2-0, Team B 2-0, Team C 1-1 → verify Team C eliminated, Teams A and B revert to two-team tiebreaker
- **Three-team tie for second place Example #1** (lines 148-160): Team A 2-0, Team B 1-1, Team C 0-2 → verify Team A advances, Teams B and C eliminated
- **Three-team tie for second place Example #2** (lines 161-174): Team A 2-0, Team B 2-0, Team C 1-1 → verify Team C eliminated, Teams A and B revert to two-team tiebreaker

#### 3. Rule C Integration Tests
From `docs/tiebreaker-rules/sec/rule-c-highest-placed-opponent.txt`:
- **Two-team tie Example #1** (lines 112-133): Verify Team B advances based on record vs highest-placed common opponent
- **Three-team tie for first place Example #2** (lines 219-240): Team A and Team B advance → verify they revert to two-team tiebreaker (test recursion)
- **Three-team tie for first place Example #3** (lines 242-262): Team A advances, Teams B and C revert to two-team tiebreaker (test recursion)
- **Three-team tie for second place Example #3** (lines 336-357): Team D eliminated, Teams B and C revert to two-team tiebreaker (test recursion)

#### 4. Rule D Integration Tests
From `docs/tiebreaker-rules/sec/rule-d-opponent-win-percentage.txt`:
- **Two-team tie** (lines 56-68): Team A advances based on opponent win percentage
- **Three-team tie for first place** (lines 70-85): Team A advances, Teams B and C revert to two-team tiebreaker (test recursion)
- **Three-team tie for second place** (lines 88-102): Team A advances

#### 5. Rule E Integration Tests
From `docs/tiebreaker-rules/sec/rule-e-scoring-margin.txt`:
- **Two-team tie** (lines 77-90): Team A advances based on scoring margin
- **Three-team tie for first place** (lines 92-107): Team A advances, Teams B and C revert to two-team tiebreaker (test recursion)
- **Three-team tie for second place** (lines 110-125): Team A advances

### Verification Patterns

For each test:
1. **Final Ranking**: `expect(result.ranked).toEqual([...expectedOrder])`
2. **Rule Reached**: `expect(result.steps.some(step => step.rule.includes('RuleName'))).toBe(true)`
3. **Recursion Verification**: For scenarios with recursion, verify `result.steps` contains multiple steps showing the recursive tiebreaker process
4. **Rule Cascade**: Verify earlier rules don't break the tie when they shouldn't (check that steps show progression through rules)

### Key Implementation Notes
- **Source of Truth**: All test scenarios, expected outcomes, and verification criteria come directly from the SEC rules documents in `docs/tiebreaker-rules/sec/`
- Use team IDs ('A', 'B', 'C', 'D', 'E', etc.) consistently as used in SEC documents
- Create all necessary games to match SEC document examples EXACTLY (scores, teams, outcomes)
- Include all teams in `allTeams` parameter (not just tied teams) - use all teams mentioned in the SEC document scenario
- For Rule C tests, create additional games/teams as specified in the SEC document to establish standings for "highest placed opponent" logic
- For Rule D/E tests, create full conference schedules as needed per SEC document examples to calculate opponent win percentages and scoring margins accurately
- **Ignore current implementation behavior** - write tests based on what the SEC rules say should happen, then verify the implementation produces those results

## Test Implementation Todos

1. Read all SEC rules documents to extract exact game scenarios and expected outcomes for each test case
2. Implement Rule A integration tests (two-team tie, three-team tie for first/second place with recursion scenarios)
3. Implement Rule B integration tests (two-team tie, three-team tie for first/second place with recursion scenarios)
4. Implement Rule C integration tests (two-team tie, three-team tie for first/second place with recursion scenarios)
5. Implement Rule D integration tests (two-team tie, three-team tie for first/second place with recursion scenarios)
6. Implement Rule E integration tests (two-team tie, three-team tie for first/second place with recursion scenarios)
7. Run tests and verify all scenarios pass, checking that recursion and rule cascading work correctly