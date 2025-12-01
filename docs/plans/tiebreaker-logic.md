# Conference Tiebreaker Logic Implementation

> **⚠️ PLANNING DOCUMENT - IMPLEMENTATION MAY DIFFER**
> 
> For actual implementation details, refer to:
> - Actual code in `/app/api/simulate/[sport]/[conf]/route.ts` (e.g., `/app/api/simulate/cfb/sec/route.ts`)
> - `/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts` for tiebreaker logic
> - [API Reference](../guides/api-reference.md) for current API documentation
> - [Tiebreaker Testing](../tests/tiebreaker-and-simulate.md) for test procedures
> - `/lib/constants.ts` for sports and conference configuration

---

## Overview

Conference tiebreaker engine (rules A-E). `/api/simulate` accepts score overrides and returns resolved standings. Current standings endpoints (`/api/standings/[sport]/[conf]` and `/api/games/[sport]/[conf]`) also use tiebreaker logic to properly rank teams based on completed games, working correctly with incomplete seasons.

---

## Conference Tiebreaker Rules

| Rule | Requirement | Action | Next if Tie |
|------|-------------|--------|-------------|
| **A: Head-to-Head** | ≥2 games among tied teams | Best head-to-head record wins | → Rule B |
| **B: Common Opponents** | ≥4 common opponents | Best record vs common opponents | → Rule C |
| **C: Highest Placed Opponent** | Common opponents exist | Best record vs highest-placed common opponent | → Rule D |
| **D: Opponent Win %** | All opponents | Highest cumulative opponent win % | → Rule E |
| **E: Scoring Margin** | All games | Highest relative margin (offensive cap: 200%, defensive min: 0%) | Final |

---

## Implementation

**Core Functions** (`lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts`):
- `applyOverrides()` - Validates/applies score overrides
- `getTeamRecord()` - Calculates wins/losses
- `ruleAHeadToHead()` - Rule A implementation
- `ruleBCommonOpponents()` - Rule B implementation
- `ruleCHighestPlacedOpponent()` - Rule C implementation
- `ruleDOpponentWinPercentage()` - Rule D implementation
- `ruleEScoringMargin()` - Rule E implementation
- `resolveTies()` - Cascading tiebreaker engine
- `calculateStandings()` - Full standings calculation
- `calculateStandingsFromCompletedGames()` - Reusable function for current standings (works with incomplete seasons)

**API Endpoints**:
- `/api/simulate/[sport]/[conf]` (e.g., `/app/api/simulate/cfb/sec/route.ts`):
  - Input: `{ season, overrides }`
  - Output: `{ standings, championship, tieLogs }`
  - Validates: Non-negative integers, no ties
  - Uses `predictedScore` when no override provided
- `/api/standings/[sport]/[conf]`: Returns current standings using tiebreaker logic (completed games only)
- `/api/games/[sport]/[conf]`: Returns games with team rankings calculated using tiebreaker logic

**Data Flow:** 
- Simulate: Overrides → Records → Standings → Tie Resolution (A-E) → Explanations → Output
- Current Standings: Completed Games → Records → Standings → Tie Resolution (A-E) → Rankings (no explanations needed)

---

## Key Points

- **Recursive Resolution**: Rules applied recursively (Rule A → Rule B → ...)
- **Minimum Requirements**: Rules A/B skip if requirements not met
- **Scoring Caps**: Rule E uses relative percentage-based calculation (offensive cap: 200%, defensive minimum: 0%)
- **Championship**: Top 2 teams = Conference Championship matchup
- **Full Standings**: Always returns all 16 teams
- **Incomplete Seasons**: All tiebreaker rules work correctly with incomplete seasons (games without scores are automatically skipped)
- **Team Enrichment**: Team metadata is enriched at reshape level before database upsert, ensuring all team name variations are available in Game model

**Testing:** See [Tiebreaker Testing](../tests/tiebreaker-and-simulate.md)

---

**For current implementation details, see actual code in `/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts` and `/app/api/simulate/[sport]/[conf]/route.ts` (e.g., `/app/api/simulate/cfb/sec/route.ts`).**
