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

## 1. **ACC** - EASIEST ⭐⭐⭐⭐⭐

**Source:** `docs/tiebreaker-rules/cleaned/acc-tiebreaker-rules-cleaned.txt`

**Rules Required:**
1. Head-to-Head ✅ (Rule A)
2. Common Opponents ✅ (Rule B)
3. Common Opponents by Order of Finish ✅ (Rule C)
4. Combined Win % of Conference Opponents ✅ (Rule D)
5. Team Rating Score ✅ (Rule E)
6. Random Draw ✅ (built-in)

**New Rules Needed:** **0** - All rules already exist

**Implementation:** Direct reuse of existing rules in order: A → B → C → D → E

**Proof:**
- Two-team tie: a→b→c→d→e→f (draw)
- Multiple-team tie: a→b→c→d→e→f (draw)

---

## 2. **Big Ten** - EASIEST ⭐⭐⭐⭐⭐

**Source:** `docs/tiebreaker-rules/cleaned/big10-tiebreaker-rules-cleaned.txt`

**Rules Required:**
1. Head-to-Head ✅ (Rule A)
2. Common Opponents ✅ (Rule B)
3. Common Opponents by Order of Finish ✅ (Rule C)
4. Combined Win % of Conference Opponents ✅ (Rule D)
5. Team Rating Score ✅ (Rule E)
6. Random Draw ✅ (built-in)

**New Rules Needed:** **0** - All rules already exist

**Implementation:** Direct reuse of existing rules in order: A → B → C → D → E

**Proof:**
- Two-team tie: A.1→A.3→A.4→A.5→A.6→A.7 (draw)
- Multiple-team tie: B.1→B.2→B.3→B.4→B.5→B.6 (draw)

**Note:** Big Ten has special handling for unbalanced schedules, but the core rules are identical.

---

## 3. **Pac-12** - EASY ⭐⭐⭐⭐

**Source:** `docs/tiebreaker-rules/cleaned/pac12-tiebreaker-rules-cleaned.txt`

**Rules Required:**
1. Head-to-Head ✅ (Rule A)
2. Common Opponents by Order of Finish ✅ (Rule C)
3. Common Opponents ✅ (Rule B)
4. Combined Win % of Conference Opponents ✅ (Rule D)
5. **Total Wins** ❌ (NEW - needs implementation)
6. Team Rating Score ✅ (Rule E)
7. Random Draw ✅ (built-in)

**New Rules Needed:** **1** - Total Wins (with FCS/exempt game logic)

**Implementation:** A → C → B → D → [NEW: Total Wins] → E

**Proof:**
- Two-team tie: (a)→(b)→(c)→(d)→(e)→(f)→(g)
- Multiple-team tie: (a)→(b)→(c)→(d)→(e)→(f)→(g)

**Total Wins Rule Details:**
- Only one win against FCS/lower division counted annually
- Games exempted per NCAA 17.10.5.2.1 not included
- Straightforward: count wins, apply filters

---

## 4. **Big 12** - EASY ⭐⭐⭐⭐

**Source:** `docs/tiebreaker-rules/cleaned/big12-tiebreaker-rules-cleaned.txt`

**Rules Required:**
1. Head-to-Head ✅ (Rule A)
2. Common Opponents ✅ (Rule B)
3. Common Opponents by Order of Finish ✅ (Rule C)
4. Combined Win % of Conference Opponents ✅ (Rule D)
5. **Total Wins** ❌ (NEW - needs implementation)
6. Team Rating Score ✅ (Rule E)
7. Random Draw ✅ (built-in)

**New Rules Needed:** **1** - Total Wins (same logic as Pac-12)

**Implementation:** A → B → C → D → [NEW: Total Wins] → E

**Proof:**
- Two-team tie: a→b→c→d→e→f→g
- Multiple-team tie: a→b→c→d→e→f→g

**Total Wins Rule Details:**
- Identical to Pac-12: one FCS win max, exempt games excluded
- Can reuse the same implementation

---

## 5. **C-USA** - MODERATE ⭐⭐⭐

**Source:** `docs/tiebreaker-rules/cleaned/cusa-tiebreaker-rules-cleaned.txt`

**Rules Required:**
1. Head-to-Head ✅ (Rule A)
2. Common Opponents ✅ (Rule B)
3. Common Opponents by Order of Finish ✅ (Rule C)
4. **Computer Rankings** ✅ (use Team Rating Score - Rule E)
5. Combined Win % of Conference Opponents ✅ (Rule D)
6. Random Draw ✅ (built-in)

**New Rules Needed:** **0** - All rules exist (Team Rating Score replaces computer rankings)

**Implementation:** A → B → C → E → D

**Proof:**
- Tiebreaker: 1→2→3→4→5→6
- Step 4 mentions "Average Computer Ranking" but we use Team Rating Score instead

**Note:** C-USA mentions "Connelly SP+, SportSource Analytics, ESPN SOR, and KPI Rankings" but we approximate with our composite Team Rating Score.

---

## 6. **Mountain West** - MODERATE ⭐⭐⭐

**Source:** `docs/tiebreaker-rules/cleaned/mw-tiebreaker-rules-cleaned.txt`

**Rules Required:**
1. Head-to-Head ✅ (Rule A)
2. **CFP Rankings/Computer Metrics** ✅ (use Team Rating Score - Rule E)
3. **Overall Win Percentage** ❌ (NEW - needs implementation)
4. Common Opponents by Order of Finish ✅ (Rule C)
5. Common Opponents ✅ (Rule B)
6. Random Draw ✅ (built-in)

**New Rules Needed:** **1** - Overall Win Percentage (with FCS limit)

**Implementation:** A → E → [NEW: Overall Win %] → C → B

**Proof:**
- Two-team tie: 1→2→3→4→5→6
- Multiple-team tie: 1→2→3→4→5→6

**Overall Win % Rule Details:**
- Maximum one win against FCS included
- Straightforward: calculate overall win % with FCS limit

**Note:** Step 2 has complex CFP/computer ranking logic, but we use Team Rating Score instead.

---

## 7. **AAC** - MODERATE ⭐⭐⭐

**Source:** `docs/tiebreaker-rules/cleaned/aac-tiebreaker-rules-cleaned.txt`

**Rules Required:**
1. Head-to-Head ✅ (Rule A)
2. **CFP Rankings/Computer Metrics** ✅ (use Team Rating Score - Rule E)
3. Common Opponents ✅ (Rule B)
4. **Overall Win Percentage** ❌ (NEW - needs implementation)
5. Random Draw ✅ (built-in)

**New Rules Needed:** **1** - Overall Win Percentage (excluding exempt games)

**Implementation:** A → E → B → [NEW: Overall Win %]

**Proof:**
- Two-team tie: 10.5.2→10.5.3-10.5.7 (CFP/computer, we use Team Rating Score)→10.5.8→10.5.9→10.5.10
- Multiple-team tie: 10.6.3→10.6.4-10.6.8 (CFP/computer, we use Team Rating Score)→10.6.9→10.6.10→10.6.11

**Overall Win % Rule Details:**
- "Highest overall winning percentage (conference and non-conference) excluding exempt games"
- Similar to Total Wins but uses percentage instead of count

**Note:** AAC has extensive CFP/computer ranking logic (steps 10.5.3-10.5.7, 10.6.4-10.6.8), but we replace all of it with Team Rating Score.

---

## 8. **Sun Belt** - MOST COMPLEX ⭐⭐

**Source:** `docs/tiebreaker-rules/cleaned/sunbelt-tiebreaker-rules-cleaned.txt`

**Rules Required:**
1. Head-to-Head ✅ (Rule A)
2. **Divisional Win Percentage** ❌ (NEW - needs implementation)
3. Common Opponents by Order of Finish ✅ (Rule C)
4. **Common Non-Divisional Opponents** ❌ (NEW - needs implementation)
5. **CFP Rankings/Computer Metrics** ✅ (use Team Rating Score - Rule E)
6. **Overall Win % vs FBS** ❌ (NEW - needs implementation)
7. Random Draw ✅ (built-in)

**New Rules Needed:** **3** - Divisional Win %, Common Non-Divisional Opponents, Overall Win % vs FBS

**Implementation:** A → [NEW: Divisional Win %] → C → [NEW: Common Non-Divisional] → E → [NEW: Overall Win % vs FBS]

**Proof:**
- Two-team tie: 1→2→3→4→5-8 (CFP/computer, we use Team Rating Score)→9→10
- Multiple-team tie: 1→2→3→4→5-7 (CFP/computer, we use Team Rating Score)→8→9

**New Rule Details:**
1. **Divisional Win %**: Calculate win percentage only within division
2. **Common Non-Divisional Opponents**: Filter common opponents to only non-divisional conference games
3. **Overall Win % vs FBS**: Calculate win percentage against FBS teams only (exclude FCS)

**Note:** Sun Belt is divisional, requiring division-aware logic throughout.

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

## Implementation Notes

### Total Wins Rule (Pac-12, Big 12)
- Count total wins in season
- Only one FCS/lower division win counted
- Exclude games exempted per NCAA 17.10.5.2.1
- Simple counting logic

### Overall Win Percentage (Mountain West, AAC)
- Calculate overall win % (conference + non-conference)
- Mountain West: Max one FCS win included
- AAC: Exclude exempt games
- Straightforward percentage calculation

### Sun Belt Specific Rules
- **Divisional Win %**: Requires division metadata
- **Common Non-Divisional Opponents**: Filter by division
- **Overall Win % vs FBS**: Filter opponents by FBS/FCS classification

### CFP/Computer Rankings Replacement
All conferences that reference CFP rankings or computer metrics (AAC, C-USA, Mountain West, Sun Belt) use our **Team Rating Score** instead, which is already implemented.

