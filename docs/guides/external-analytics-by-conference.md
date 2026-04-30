# External Analytics Requirements by Conference

This documents what external analytics/computer metrics each conference's official tiebreaker rules actually require for the "Team Rating Score" (or equivalent) step, versus what we currently implement using CFBD API data.

## Current Implementation

We approximate every conference's Team Rating Score using **SP+ ranking** and **SOR (Strength of Record)** from the CFBD API, because those are the only two systems available through CFBD. The composite formula is `(SP+ + SOR) / 2`. This is an approximation -- no conference officially uses exactly this formula.

## What Each Conference Actually Requires

| Conference | Official External Analytics | Source Doc |
|------------|---------------------------|------------|
| **SEC** | SportSource Analytics (capped relative scoring margin) -- this is a *different* metric from Team Rating Score; SEC does not use a composite ranking system | `docs/tiebreaker-rules/cleaned/sec/sec-tiebreaker-rules-cleaned.txt` |
| **ACC** | SportSource Analytics (Team Rating Score metric) | `docs/tiebreaker-rules/raw/acc-tiebreaker-rules.txt` |
| **B1G** | SportSource Analytics (Team Rating Score metric) | `docs/tiebreaker-rules/cleaned/big10-tiebreaker-rules-cleaned.txt` |
| **Pac-12** | SportSource Analytics (Team Rating Score metric) | `docs/tiebreaker-rules/cleaned/pac12-tiebreaker-rules-cleaned.txt` |
| **MWC** | Connelly SP+, ESPN SOR, KPI, SportSource (4-system composite average) | `docs/tiebreaker-rules/raw/mw-tiebreaker-rules.txt` |
| **C-USA** | Connelly SP+, SportSource Analytics, ESPN SOR, KPI (4-system average) | `docs/tiebreaker-rules/raw/cusa-tiebreaker-rules.txt` |
| **AAC** | Connelly SP+, SportSource TR116 SOR, ESPN SOR, KPI (4-system composite) | `docs/tiebreaker-rules/raw/aac-tiebreaker-rules.txt` |
| **Sun Belt** | Anderson & Hester, Massey, Colley, Wolfe (4 completely different systems) | `docs/tiebreaker-rules/cleaned/sunbelt-tiebreaker-rules-cleaned.txt` |
| **MAC** | TODO: verify from official rules doc |
| **Big 12** | TODO: verify from official rules doc |

## Gaps Between Official Rules and Implementation

1. **ACC, B1G, Pac-12**: Official rules reference "SportSource Analytics (Team Rating Score metric)" -- a proprietary metric not available through CFBD. We approximate with SP+/SOR.

2. **MWC, C-USA, AAC**: Official rules specify a 4-system composite (SP+, SOR, KPI, SportSource). We only have 2 of the 4 systems (SP+ and SOR via FPI endpoint). KPI and SportSource are not available through CFBD.

3. **Sun Belt**: Official rules use entirely different systems (Anderson & Hester, Massey, Colley, Wolfe) -- none of which are available through CFBD. Our SP+/SOR approximation has no direct relationship to their official formula.

4. **SEC**: Does not use a composite ranking at all. SEC Rule E is "capped relative scoring margin" -- a scoring-based calculation, not an external analytics lookup. SEC's implementation (`rule-e-sec-scoring-margin.ts`) is separate from the Team Rating Score system.

## CFBD API Data Available

- **SP+ ratings**: `cfbdClient.getSp()` -- Connelly SP+ rankings/ratings
- **FPI/SOR**: `cfbdClient.getFpi()` -- ESPN FPI data, which includes Strength of Record (SOR)
- **CFP Rankings**: `cfbdClient.getRankings()` -- CFP Selection Committee rankings (used by AAC, MWC, Sun Belt as a prerequisite check before the composite)

## Not Available Through CFBD

- KPI rankings
- SportSource Analytics (Team Rating Score, TR116 SOR)
- Anderson & Hester
- Massey ratings
- Colley ratings
- Wolfe ratings

## Future Considerations

If additional data sources become available (through CFBD or other APIs), individual conference implementations could be updated to use their actual specified analytics rather than the SP+/SOR approximation. The conference config system (`lib/cfb/tiebreaker-rules/{conf}/config.ts`) and the modular rule architecture already support per-conference customization.
