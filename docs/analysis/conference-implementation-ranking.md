# Conference Implementation Ranking by Ease

**Analysis Date:** Based on local tiebreaker rule files in `docs/tiebreaker-rules/cleaned/`

**Key Assumption:** We use our **Team Rating Score** (composite metric) instead of external CFP/BCS/computer rankings.

**Available Rules:**
- ✅ Rule A: Head-to-Head
- ✅ Rule B: Common Opponents  
- ✅ Rule C: Highest Placed Common Opponent
- ✅ Rule D: Opponent Win Percentage
- ✅ Rule E: Team Rating Score (our composite)
- ✅ SEC-specific: Scoring Margin (SEC only)

---

## Summary Ranking

| Rank | Conference | New Rules | Complexity | Ease |
|------|-----------|-----------|------------|------|
| 1 | **ACC** | 0 | Low | ⭐⭐⭐⭐⭐ |
| 1 | **Big Ten** | 0 | Low | ⭐⭐⭐⭐⭐ |
| 3 | **Pac-12** | 1 | Low | ⭐⭐⭐⭐ |
| 3 | **Big 12** | 1 | Low | ⭐⭐⭐⭐ |
| 5 | **C-USA** | 0 | Medium | ⭐⭐⭐ |
| 6 | **Mountain West** | 1 | Medium | ⭐⭐⭐ |
| 7 | **AAC** | 1 | Medium | ⭐⭐⭐ |
| 8 | **Sun Belt** | 3 | High | ⭐⭐ |

---

## Conference Details

### Easiest (0 new rules)
**ACC, Big Ten**: Direct reuse of existing rules in order: A → B → C → D → E

### Easy (1 new rule)
**Pac-12, Big 12**: A → B → C → D → [Total Wins] → E  
**Mountain West**: A → E → [Overall Win %] → C → B  
**AAC**: A → E → B → [Overall Win %]

**New Rule: Total Wins** (Pac-12, Big 12)
- Count total wins in season
- Only one FCS/lower division win counted
- Exclude games exempted per NCAA 17.10.5.2.1

**New Rule: Overall Win Percentage** (Mountain West, AAC)
- Calculate overall win % (conference + non-conference)
- Mountain West: Max one FCS win included
- AAC: Exclude exempt games

### Moderate (0-1 new rules)
**C-USA**: A → B → C → E → D (uses Team Rating Score instead of computer rankings)

### Most Complex (3 new rules)
**Sun Belt**: A → [Divisional Win %] → C → [Common Non-Divisional] → E → [Overall Win % vs FBS]

**New Rules:**
1. **Divisional Win %**: Calculate win percentage only within division
2. **Common Non-Divisional Opponents**: Filter common opponents to only non-divisional conference games
3. **Overall Win % vs FBS**: Calculate win percentage against FBS teams only (exclude FCS)

---

## Implementation Notes

**CFP/Computer Rankings Replacement**: All conferences that reference CFP rankings or computer metrics (AAC, C-USA, Mountain West, Sun Belt) use our **Team Rating Score** instead, which is already implemented.

**Source Files**: See `docs/tiebreaker-rules/cleaned/` for official conference tiebreaker rules.
