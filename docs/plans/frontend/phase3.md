# Phase 3: Game Overrides & Score Inputs

**Scope:** Allow users to select game winners via team buttons or custom scores via inline inputs. Hybrid design with real-time validation, persist valid overrides to localStorage, and reset to live scores.

**Dependencies:** Phase 2 (games displayed)

**Files to Create/Modify:**

- `app/components/GameCard.tsx` (update to include override controls)
- `app/components/OverrideControl.tsx` (new - hybrid button + input component)
- `app/hooks/useGameOverrides.ts` (new - manage localStorage)
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

**Override Persistence**: localStorage key `"sec-tiebreaker-overrides-{season}"`, format `{ [gameEspnId]: { homeScore, awayScore } }`. Uses `game.espnId` as key. Only valid scores persisted.

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

**useGameOverrides.ts**: Manages localStorage. Methods: `addOverride()`, `removeOverride()`, `clearAllOverrides()`, `getOverride()`, `resetToLive()`. Key: `"sec-tiebreaker-overrides-{season}"`. Only stores valid scores.

---

## Implementation Checklist

**Setup**: Install React Hook Form (`npm install react-hook-form`), optional: Joi/Zod for validation

**Component Implementation**: Create `OverrideControl.tsx` (hybrid button + input), implement editMode state, create default view (buttons + score display + "Edit Scores"), create edit view (buttons + inputs + "Hide Scores"), prefill inputs with `game.predictedScore`

**Button Styling** (See [Styling Guide](./phase3-styling.md)): Apply dynamic team colors (CSS variables), implement `.btn.selected`/`.btn.unselected`, handle ESPN color format (add `#`), update styling based on selected state

**Validation**: Implement React Hook Form (real-time), validate no tie scores, non-negative integers, whole numbers, display errors below inputs, handle button click auto-calculation

**Persistence**: Create `useGameOverrides` hook, only store valid overrides, update GameCard to include OverrideControl, auto-save on valid change, populate overrides map for `/api/simulate`

**Reset Functionality**: Create `resetToLive` function, add loading state, call cron job/get live data, fetch fresh `/api/games`, clear overrides, update component state, show toast (Phase 4+)

**UI & UX**: "Reset to Live" button prominent, loading indicator, visual indication of overrides, score display format "Alabama: 24 vs Georgia: 21", smooth transitions, mobile responsive

---

## Manual Testing

**Button-Based Override**: Load games, click team buttons (home/away), verify selected state, click simulate, refresh page (persists from localStorage)

**Score Input Mode**: Click "Edit Scores", verify inputs prefilled, type valid score (error clears), type invalid score (error shown, no localStorage update), fix input, click "Hide Scores", refresh (persists)

**Reset to Live**: Make overrides, click "Reset to Live", verify loading indicator, fresh data fetched, scores reset, overrides cleared, localStorage empty

**Multi-Game**: Test multiple games independently, verify localStorage only contains games with overrides, test mobile view

---

## Button Styling

See [Styling Guide](./phase3-styling.md) for CSS variables approach and implementation details.

---

## Important Notes

**Important Notes:**
- Override keys use `game.espnId` (matches backend `applyOverrides()`)
- `predictedScore` always present, used as default for buttons/inputs
- Button clicks calculate opponent -1, styling reflects selected winner
- localStorage key: `"sec-tiebreaker-overrides-{season}"`, only valid scores stored
