# Phase 3: Game Overrides & Score Inputs

**Scope:** Allow users to select game winners via team buttons or custom scores via inline inputs. Hybrid design with real-time validation, persist valid overrides via redux-persist, and reset to live scores.

**Dependencies:** Phase 2 (games displayed)

**Files to Create/Modify:**

- `app/components/GameCard.tsx` (update to include override controls)
- `app/components/OverrideControl.tsx` (new - hybrid button + input component)
- `app/store/gamePicksSlice.ts` (update - extend existing gamePicks state to include overrides)
- `app/page.tsx` (update to pass overrides to simulate, handle reset)

---

## Override Behavior

**UI Design**: Hybrid button + input mode

- Default view: Team buttons + score display + "Edit Scores" button
- Edit view: Team buttons + score inputs + "Hide Scores" button
- Team buttons: Click to set winner (auto-calculates opponent score -1)
- Score display: "Alabama: 24 vs Georgia: 21" (labeled format)
- Scores prefilled with `predictedScore` from API
- Button styling: Dynamic team colors (see [Styling Guide](./phase3-styling.md))

**Override Persistence**: Uses redux-persist via `gamePicksSlice`. Format `{ [gameEspnId]: { homeScore, awayScore } }`. Uses `game.espnId` as key. Only valid scores persisted. Automatically persisted to localStorage via redux-persist (key: `persist:gamePicks`).

**Reset to Live**: Button calls `/api/games`, clears overrides, refills inputs, shows loading state.

---

## Validation Rules

**Validation Rules** (React Hook Form):

- No tie scores (`homeScore !== awayScore`)
- Non-negative integers (`>= 0`, `Number.isInteger()`)
- Real-time validation on keystroke, errors below inputs, auto-save valid changes only

**Type** (`types/frontend.ts`):

```typescript
export interface UserOverrides {
  [gameEspnId: string]: {
    homeScore: number; // >= 0, integer
    awayScore: number; // >= 0, integer, !== homeScore
  };
}
```

---

## Component Definitions

**OverrideControl.tsx**: Props: `game`, `currentOverride`, `onOverride`. Uses React Hook Form. State: `editMode` (toggle views). Renders: Default view (buttons + score display + "Edit Scores"), Edit view (buttons + inputs + "Hide Scores"). Behavior: Button click sets winner (auto-calculates opponent -1), input change validates real-time and auto-saves if valid, styling reflects selected state.

**gamePicksSlice.ts**: Extend existing slice to include override actions. Methods: `setGamePick()` (existing), `clearGamePick()` (existing), `clearAllPicks()` (existing). Persistence handled automatically by redux-persist. Only stores valid scores.

---

## Implementation Checklist

**Setup**: Install React Hook Form (`npm install react-hook-form`), optional: Joi/Zod for validation

**Component Implementation**: Create `OverrideControl.tsx` (hybrid button + input), implement editMode state, create default view (buttons + score display + "Edit Scores"), create edit view (buttons + inputs + "Hide Scores"), prefill inputs with `game.predictedScore`

**Button Styling** (See [Styling Guide](./phase3-styling.md)): Apply dynamic team colors (CSS variables), implement `.btn.selected`/`.btn.unselected`, handle ESPN color format (add `#`), update styling based on selected state

**Validation**: Implement React Hook Form (real-time), validate no tie scores, non-negative integers, whole numbers, display errors below inputs, handle button click auto-calculation

**Persistence**: Extend `gamePicksSlice` with override actions, only store valid overrides, update GameCard to include OverrideControl, auto-save on valid change via Redux dispatch, populate overrides map for `/api/simulate`. Persistence handled automatically by redux-persist.

**Reset Functionality**: Create `resetToLive` function, add loading state, call cron job/get live data, fetch fresh `/api/games`, clear overrides, update component state, show toast (Phase 4+)

**UI & UX**: "Reset to Live" button prominent, loading indicator, visual indication of overrides, score display format "Alabama: 24 vs Georgia: 21", smooth transitions, mobile responsive

---

## Manual Testing

**Button-Based Override**: Load games, click team buttons (home/away), verify selected state, click simulate, refresh page (persists via redux-persist)

**Score Input Mode**: Click "Edit Scores", verify inputs prefilled, type valid score (error clears), type invalid score (error shown, no Redux update), fix input, click "Hide Scores", refresh (persists via redux-persist)

**Reset to Live**: Make overrides, click "Reset to Live", verify loading indicator, fresh data fetched, scores reset, overrides cleared via Redux action, redux-persist clears persisted state

**Multi-Game**: Test multiple games independently, verify Redux state only contains games with overrides, test mobile view

---

## Button Styling

See [Styling Guide](./phase3-styling.md) for CSS variables approach and implementation details.

---

## Important Notes

**Important Notes:**

- Override keys use `game.espnId` (matches backend `applyOverrides()`)
- `predictedScore` always present, used as default for buttons/inputs
- Button clicks calculate opponent -1, styling reflects selected winner
- Persistence: Uses redux-persist (key: `persist:gamePicks`), only valid scores stored
