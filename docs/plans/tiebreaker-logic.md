# Conference Tiebreaker Logic Implementation

> **⚠️ PLANNING DOCUMENT - IMPLEMENTATION MAY DIFFER**
> 
> For actual implementation details, refer to:
> - Actual code in `/app/api/simulate/route.ts`
> - `/lib/tiebreaker-helpers.ts` for tiebreaker logic
> - [API Reference](../guides/api-reference.md) for current API documentation
> - [Tiebreaker Testing](../tests/tiebreaker-and-simulate.md) for test procedures
> - `/lib/constants.ts` for actual constant definitions

---

## Overview

Conference tiebreaker engine (rules A-E). `/api/simulate` accepts score overrides and returns resolved standings.

---

## Conference Tiebreaker Rules

| Rule | Requirement | Action | Next if Tie |
|------|-------------|--------|-------------|
| **A: Head-to-Head** | ≥2 games among tied teams | Best head-to-head record wins | → Rule B |
| **B: Common Opponents** | ≥4 common opponents | Best record vs common opponents | → Rule C |
| **C: Highest Placed Opponent** | Common opponents exist | Best record vs highest-placed common opponent | → Rule D |
| **D: Opponent Win %** | All opponents | Highest cumulative opponent win % | → Rule E |
| **E: Scoring Margin** | All games | Highest margin (caps: +42 offense, -48 defense) | Final |

---

## Implementation

**Core Functions** (`lib/tiebreaker-helpers.ts`):
- `applyOverrides()` - Validates/applies score overrides
- `getTeamRecord()` - Calculates wins/losses
- `ruleAHeadToHead()` - Rule A implementation
- `ruleBCommonOpponents()` - Rule B implementation
- `ruleCHighestPlacedOpponent()` - Rule C implementation
- `ruleDOpponentWinPercentage()` - Rule D implementation
- `ruleEScoringMargin()` - Rule E implementation
- `resolveTies()` - Cascading tiebreaker engine
- `calculateStandings()` - Full standings calculation

**API Endpoint** (`app/api/simulate/route.ts`):
- Input: `{ season, conferenceId, overrides }`
- Output: `{ standings, championship, tieLogs }`
- Validates: Non-negative integers, no ties
- Uses `predictedScore` when no override provided

**Data Flow:** Overrides → Records → Standings → Tie Resolution (A-E) → Explanations → Output

---

## Key Points

- **Recursive Resolution**: Rules applied recursively (Rule A → Rule B → ...)
- **Minimum Requirements**: Rules A/B skip if requirements not met
- **Scoring Caps**: Rule E caps at +42/-48 to prevent skew
- **Championship**: Top 2 teams = Conference Championship matchup
- **Full Standings**: Always returns all 16 teams

**Testing:** See [Tiebreaker Testing](../tests/tiebreaker-and-simulate.md)

---

**For current implementation details, see actual code in `/lib/tiebreaker-helpers.ts` and `/app/api/simulate/route.ts`.**
