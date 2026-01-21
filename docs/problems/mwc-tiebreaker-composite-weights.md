# Mountain West Conference Tiebreaker Composite Weights Problem

## Problem Statement

The Mountain West Conference (MWC) tiebreaker system is not producing the correct championship matchup for the 2025 season. The simulation currently selects **Boise State vs New Mexico**, but the official result was **Boise State vs UNLV**.

## Background

### Official 2025 MWC Results

In 2025, there was a **four-way tie** at 6-2 conference record between:
- Boise State
- UNLV
- San Diego State
- New Mexico

The MWC used their official tiebreaker procedure (Rule 2) which uses:
1. **CFP Rankings** (if available) - OR
2. **Composite average of computer metrics**: Connelly SP+, ESPN SOR, KPI, and SportSource rankings

The official composite averages were:
- **Boise State**: 47.75 (lowest = best)
- **UNLV**: 45.50 (second lowest = best)
- **San Diego State**: 51.00
- **New Mexico**: 54.75

**Result**: Boise State and UNLV advanced to the championship game (the two teams with the **lowest** composite averages).

### Current Implementation

Our implementation uses:
1. **CFP Rankings first** (if available) - ✅ Correct per MWC rules
2. **Fallback composite** approximating SP+/SOR:
   - Net PPA (SP+ component)
   - Net Success Rate (SP+ component)
   - Net Explosiveness (SP+ component)
   - Net Finishing Drives / Points Per Opportunity (SP+ component)
   - Strength of Schedule (SOR component - opponent win percentage)

**Current weights:**
- SP+ components: 60% total
  - PPA: 30% of SP+ (18% total)
  - Success Rate: 25% of SP+ (15% total)
  - Explosiveness: 25% of SP+ (15% total)
  - Finishing Drives: 20% of SP+ (12% total)
- SOS component: 40% total

## The Data

### Team Advanced Stats (from fixtures)

**Boise State:**
- Net PPA: 0.1058
- Net Success Rate: 0.0628
- Net Explosiveness: -0.1093 (worst)
- Net Finishing Drives: -0.2311 (worst)
- Strength of Schedule: 0.5156 (best)

**UNLV:**
- Net PPA: 0.0939
- Net Success Rate: 0.0327
- Net Explosiveness: -0.0063 (slightly better than SDSU)
- Net Finishing Drives: 0.6914
- Strength of Schedule: 0.4531 (worst, tied with SDSU)

**San Diego State:**
- Net PPA: 0.1582 (best)
- Net Success Rate: 0.0856 (best)
- Net Explosiveness: -0.0016
- Net Finishing Drives: 1.3505 (best)
- Strength of Schedule: 0.4531 (worst, tied with UNLV)

**New Mexico:**
- Net PPA: 0.0673 (worst)
- Net Success Rate: 0.0182 (worst)
- Net Explosiveness: 0.0265 (best)
- Net Finishing Drives: 0.8365
- Strength of Schedule: 0.4688

### Key Observations

1. **Boise State** has the **best SOS** (0.5156) - this should help them
2. **UNLV and San Diego State** have the **same SOS** (0.4531, worst) - so SOS cannot differentiate them
3. **UNLV's only advantage** over SDSU is slightly better explosiveness (-0.0063 vs -0.0016)
4. **San Diego State dominates** in PPA, Success Rate, and Finishing Drives
5. The current weights favor SDSU too much because of their strong PPA/SR/FD metrics

## The Challenge

We need to find weight combinations that:
1. **Favor Boise State** (best SOS should help)
2. **Favor UNLV over San Diego State** (despite SDSU having better PPA, SR, and FD)
3. **UNLV's only advantage** is explosiveness, which is a very small difference (-0.0063 vs -0.0016)

## Current Code Location

The composite calculation is in:
- `lib/cfb/tiebreaker-rules/common/team-rating-score.ts`
- Lines 175-188 contain the weight configuration

## Testing Approach

1. Use the simulation endpoint: `POST /api/simulate/cfb/mwc` with `{ "season": 2025 }`
2. Check the `championship` array in the response
3. It should be `["68", "2439"]` (Boise State and UNLV team IDs)
4. Adjust weights in `team-rating-score.ts` and re-test

## Files to Modify

- `lib/cfb/tiebreaker-rules/common/team-rating-score.ts` - Update the weight values in the composite calculation

## Constraints

- We cannot access the actual SP+, SOR, KPI, or SportSource rankings (they're proprietary)
- We must approximate using available CFBD data (PPA, success rate, explosiveness, finishing drives, SOS)
- The MWC composite uses **lower numbers = better** (like rankings), but our implementation uses **higher = better** (we normalize and invert)

## Prompt for New Agent

```
I need help adjusting the composite weight calculation for the Mountain West Conference tiebreaker system.

PROBLEM:
The simulation is selecting Boise State vs New Mexico for the 2025 MWC championship, but the correct result should be Boise State vs UNLV.

CONTEXT:
- 4 teams tied at 6-2: Boise State, UNLV, San Diego State, New Mexico
- MWC uses CFP rankings first, then a composite of SP+/SOR/KPI/SportSource
- Official result: Boise State (47.75) and UNLV (45.50) had the lowest composite averages
- Our approximation uses: PPA, Success Rate, Explosiveness, Finishing Drives, and Strength of Schedule

DATA:
- Boise State: Best SOS (0.5156), worst explosiveness (-0.1093), worst finishing drives (-0.2311)
- UNLV: Worst SOS (0.4531, tied with SDSU), slightly better explosiveness than SDSU (-0.0063 vs -0.0016)
- San Diego State: Best PPA (0.1582), best SR (0.0856), best FD (1.3505), worst SOS (0.4531, tied with UNLV)
- New Mexico: Worst PPA (0.0673), worst SR (0.0182), best explosiveness (0.0265)

KEY INSIGHT:
UNLV and SDSU have the same SOS, so the SP+ component must favor UNLV. UNLV's only advantage is a tiny explosiveness edge (-0.0063 vs -0.0016).

TASK:
1. Update the weights in lib/cfb/tiebreaker-rules/common/team-rating-score.ts
2. Test using: POST /api/simulate/cfb/mwc with {"season": 2025}
3. Verify the championship array is ["68", "2439"] (Boise State and UNLV)
4. Iterate until correct

The current weights are:
- SP+ components (60%): PPA=0.3, SR=0.25, Exp=0.25, FD=0.2
- SOS component (40%)

Adjust these weights to produce Boise State vs UNLV as the top 2 teams.
```

