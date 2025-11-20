# UX Design Decisions

User experience design decisions and interaction patterns.

**Related Documentation:**
- [Frontend Index](./index.md) - Frontend documentation overview
- [View Modes](./view-modes.md) - Picks and Scores modes
- [Components](./components.md) - Component implementations

---

## View Mode Button

- Single button with conditional rendering
- Icon + text (both states)
- Absolute positioning (no layout shift)
- Theme-aware colors

---

## Hide Completed Games Button

- Button with dynamic text
- Only affects picks mode
- Preference persisted via redux-persist

---

## Compact Game Cards

- Fixed-size game cards
- Team logo buttons (clickable)
- Selected team highlight
- "WIN"/"LOSS" labels

**TODO**: Document specific dimensions and styling details once finalized.

---

## Score Editing

- Inline editable inputs with validation
- Validation: no ties, no negatives, integers only
- Error message below invalid input
- Valid scores save automatically on blur

---

## Dark Mode

**TODO**: Document dark mode implementation once finalized. Include toggle component details, color schemes, and styling approach.

---

**Last Updated**: November 2025

