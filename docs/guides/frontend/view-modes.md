# View Modes

Two distinct viewing modes for interacting with games: Picks (compact) and Scores (expanded).

**Related Documentation:**

- [Frontend Index](./index.md) - Frontend documentation overview
- [UX Design](./ux-design.md) - UX design decisions for view modes
- [Components](./components.md) - Component patterns used in each mode

---

## Picks Mode (Compact View)

- Fixed-size game cards
- Team logo buttons for selection
- "WIN"/"LOSS" labels
- Score calculated automatically on pick
- Hide completed games button available
- Per-week reset button on each week heading (`WeekResetButton`)

**TODO**: Document specific dimensions once finalized.

---

## Scores Mode (Expanded View)

- Full game cards with editable scores
- Inline score inputs for incomplete games
- Validation on blur (no ties, no negatives)
- Read-only display for completed games
- Per-week reset button on each week heading (`WeekResetButton`, rendered inside `ExpandedWeekGroup`)

---

## Per-Week Reset

Both modes expose a `WeekResetButton` (`app/components/WeekResetButton.tsx`) on every week's heading row:

- If every game in the week is `completed`, the button clears picks for all of them
- Otherwise it clears picks only for `!game.completed` games (preserving any user-edited completed-game scores)
- Reset works by dispatching `clearGamePick(gameId)` per target game; existing default-pick fall-back logic in `CompactGameButton` (compact mode) and `Score` (`getCurrentScores`, expanded mode) re-seeds the cleared games from `predictedScore`
- The optional `onReset` callback is forwarded from the conference page through `GamesList` so the existing global `handleReset` (which clears `simulateResponse`) is also invoked, keeping the standings panel from going stale

---

**Last Updated**: November 2025
