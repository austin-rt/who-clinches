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

**UI Design - Hybrid Button + Input Mode:**

- **Default view:** Team name buttons + scores displayed as text + "Edit Scores" button
- **Edit view:** Team buttons toggle to inline score input fields (optional mode)
- Always show scores (visible by default, clickable to edit)
- Team buttons: Click to set as winner (auto-calculates opponent's score to 1 point less)
- Score display: "Alabama: 24 vs Georgia: 21" (labeled format)
- Edit Scores button: Toggles between button/display mode and editable inputs
- Button styling: Dynamic team colors (primary when selected, outline when unselected)
- Buttons update immediately based on current override state
- Scores prefilled with `predictedScore` from API (guaranteed valid default)
- User can load page, click simulate immediately - all games valid by default
- Only valid overrides stored to localStorage (see Validation Rules below)

**Override Persistence:**

- Overrides stored in localStorage: key `"sec-tiebreaker-overrides-{season}"`
- Override format: `{ [gameEspnId]: { homeScore: number, awayScore: number } }`
- **Critical:** Uses `game.espnId` as key (ESPN ID is primary identifier, always available)
- Only valid scores persisted - invalid state never stored

**Reset to Live Behavior:**

- "Reset to Live" button appears prominently (header or top of games list)
- On click:
  1. Triggers cron job to fetch live scores from ESPN
  2. Calls `/api/games` to get updated data with new predicted scores
  3. Clears all overrides from localStorage
  4. Refills form inputs with new predicted scores
  5. Shows loading state during fetch

---

## Validation Rules

**Validation Rules** (React Hook Form):

```typescript
1. No tie scores: homeScore !== awayScore
   - Error: "Scores cannot be equal"

2. Non-negative only: homeScore >= 0 AND awayScore >= 0
   - Error: "Scores cannot be negative"

3. Whole numbers only: Number.isInteger(homeScore) && Number.isInteger(awayScore)
   - Error: "Scores must be whole numbers"

4. Any positive integer allowed: no max cap
```

**Frontend Validation Timing** (React Hook Form - configurable):

- Real-time validation on every keystroke in input fields
- Validation on button click (auto-calculated scores always valid)
- Display errors immediately below failing input
- Auto-save to localStorage on every valid change (invalid states never persist)
- Invalid overrides prevented from storing
- Backend also validates before simulation (defensive layer)

**Type Safety:**

```typescript
// Frontend override type (types/frontend.ts)
export interface UserOverrides {
  [gameEspnId: string]: {
    homeScore: number; // >= 0, integer only
    awayScore: number; // >= 0, integer only
    // homeScore !== awayScore
  };
}
```

---

## Component Definitions

```typescript
// app/components/OverrideControl.tsx
// Props: game (FrontendGame), currentOverride (override for this game or null), onOverride callback
// Uses React Hook Form with real-time validation
// State: editMode (toggle for showing inputs vs buttons)
//
// Renders two views:
//
// 1. DEFAULT VIEW (buttons + display):
//    - Team buttons with dynamic colors from API
//    - Button styling: team color background when selected, outline when unselected
//    - Score display: "Alabama: 24 vs Georgia: 21" (labeled text format)
//    - "Edit Scores" link/button to toggle to edit mode
//
// 2. EDIT VIEW (buttons + inputs):
//    - Team buttons (same as default, always available)
//    - Score inputs (only shown in edit mode)
//    - Prefilled with predictedScore values
//    - Real-time validation errors below inputs
//    - "Hide Scores" link/button to toggle back to default view
//
// Behavior:
//   - Button click: Set as winner, auto-calculate opponent score
//   - Score input change: Real-time validation, auto-save if valid
//   - Button styling reflects current selectedWinner state
//   - All state updates trigger onOverride callback
//   - Invalid states show errors but don't persist to localStorage

// Button Color Styling (CSS Variables + Classes):
// - Each button uses: className={`btn btn-${team.abbrev.toLowerCase()} ${isSelected ? 'selected' : 'unselected'}`}
// - CSS variable injected: style={{ '--team-color': `#${team.color}` }}
// - Primary color from API (ESPN format without #, add # when applying)
// - Fallback to DaisyUI primary color if no API color available

// app/hooks/useGameOverrides.ts
// State: overrides map from localStorage
// Methods:
//   - addOverride(gameEspnId, homeScore, awayScore) - validates before storing
//   - removeOverride(gameEspnId)
//   - clearAllOverrides()
//   - getOverride(gameEspnId)
//   - resetToLive() - clears all AND fetches fresh data from API
// Reads/writes from localStorage key "sec-tiebreaker-overrides-{season}"
// Only stores valid scores (validated before storage)
```

---

## Implementation Checklist

**Setup & Dependencies:**

- [ ] Install React Hook Form: `npm install react-hook-form`
- [ ] Install Joi or Zod for validation logic (optional - React Hook Form has built-in validators)

**Component Implementation:**

- [ ] Create `OverrideControl.tsx` component with hybrid button + input design
- [ ] Implement editMode state (toggle between default and edit views)
- [ ] Create default view: team buttons + score display + "Edit Scores" button
- [ ] Create edit view: team buttons + score inputs + "Hide Scores" button
- [ ] Prefill inputs with `game.predictedScore` values

**Button Styling & Colors:**

- [ ] Apply dynamic team colors from API to buttons using CSS variables
- [ ] Implement CSS classes: `.btn.selected` (background color) and `.btn.unselected` (outline)
- [ ] Add CSS rule: `--team-color: var(--team-color, var(--color-primary))` for fallback
- [ ] Handle ESPN color format: add `#` prefix when applying to CSS (colors come as `"ba0c2f"`)
- [ ] Update button styling based on selected winner state
- [ ] Ensure button colors match team abbreviations (e.g., `.btn-uga`, `.btn-georgia`)

**Validation & Real-time Feedback:**

- [ ] Implement React Hook Form with real-time validation
- [ ] Validate: no tie scores (homeScore !== awayScore)
- [ ] Validate: non-negative integers only (>= 0)
- [ ] Validate: whole numbers only (Number.isInteger)
- [ ] Display error messages immediately below failing inputs
- [ ] Handle button click auto-calculation (always produces valid scores)

**Persistence:**

- [ ] Create `useGameOverrides` hook to manage localStorage
- [ ] Only store valid overrides (validate before storing)
- [ ] Update GameCard to include OverrideControl
- [ ] On input change: validate, then auto-save if valid
- [ ] On button click: auto-calculate, validate, auto-save
- [ ] Populate overrides map when passing to `/api/simulate`

**Reset Functionality:**

- [ ] Create `resetToLive` function in useGameOverrides
- [ ] Add loading state during fetch
- [ ] Call cron job (or trigger update) to get live data
- [ ] Fetch fresh `/api/games` data
- [ ] Clear all overrides from localStorage
- [ ] Update component state with new predicted scores
- [ ] Show success/loading toast (Phase 4+ implementation, defer for now)

**UI & UX:**

- [ ] "Reset to Live" button prominent (header or top of games list)
- [ ] Loading indicator during reset fetch
- [ ] Show which games have overrides (visual indication on button state)
- [ ] Score display format: "Alabama: 24 vs Georgia: 21" (labeled text)
- [ ] Edit Scores toggle: smooth transition between default and edit views
- [ ] Mobile responsive: buttons and inputs stack appropriately

---

## Manual Testing

**Button-Based Override (Main Flow):**

1. Run `npm run dev`
2. Load games - see team buttons with team colors + score display "Alabama: 24 vs Georgia: 21"
3. Click home team button - score updates to make home team winner (e.g., "Alabama: 24 vs Georgia: 21")
4. Button shows selected state (team color background, not outline)
5. Click away team button - score updates to make away team winner (e.g., "Alabama: 21 vs Georgia: 24")
6. Away team button now shows selected state
7. Click simulate without any edits - should work (all games valid)
8. Refresh page - button selection persists from localStorage

**Score Input Mode (Optional):** 9. Click "Edit Scores" button - toggles to edit view, shows inputs + buttons 10. Inputs prefilled with current scores (predictedScore or override values) 11. Type valid score - error clears if it was showing, buttons update to reflect state 12. Type invalid score (negative, tie, decimal): - Should show error message below input - Should not update button state - Should not store to localStorage 13. Fix input - error clears, buttons update 14. Click "Hide Scores" - toggles back to default view (score display + buttons) 15. Scores still show as text (not hidden) 16. Refresh page - valid overrides persist from localStorage

**Reset to Live:** 17. Make some game overrides (buttons or inputs) 18. Click "Reset to Live" button: - Should show loading indicator - Should fetch fresh data - Scores should reset to new predicted values - All buttons deselected - All overrides cleared from localStorage - localStorage key should be empty

**Multi-Game Scenarios:** 19. Test multiple games - each tracks overrides independently 20. Edit one game, leave others default 21. localStorage (`DevTools → Application → Local Storage`): - Key: `sec-tiebreaker-overrides-{season}` - Value: only games with overrides present (no default state games) 22. Test mobile view - buttons and inputs stack appropriately

---

## Button Styling Implementation

**CSS Variables Approach (Recommended):**

This approach uses CSS variables injected per-button combined with DaisyUI classes for maximum flexibility and scalability.

```css
/* app/globals.css */

/* Base button styles for override controls */
.btn.selected {
  background-color: var(--team-color, var(--color-primary));
  border-color: var(--team-color, var(--color-primary));
  color: #ffffff;
  font-weight: 600;
}

.btn.unselected {
  background-color: transparent;
  border-color: var(--team-color, var(--color-primary));
  border-width: 2px;
  color: var(--team-color, var(--color-primary));
  font-weight: 500;
}

.btn.selected:hover {
  opacity: 0.9;
}

.btn.unselected:hover {
  background-color: rgba(var(--team-color-rgb), 0.1);
}

.btn.unselected:active {
  background-color: rgba(var(--team-color-rgb), 0.2);
}
```

**React Implementation Pattern:**

```typescript
// app/components/OverrideControl.tsx (simplified example)

<button
  className={`btn ${selectedWinner === 'home' ? 'selected' : 'unselected'}`}
  style={{
    '--team-color': `#${game.home.color}`,
  } as React.CSSProperties}
  onClick={() => handleWinnerClick('home')}
>
  {game.home.abbrev}
</button>

<button
  className={`btn ${selectedWinner === 'away' ? 'selected' : 'unselected'}`}
  style={{
    '--team-color': `#${game.away.color}`,
  } as React.CSSProperties}
  onClick={() => handleWinnerClick('away')}
>
  {game.away.abbrev}
</button>
```

**Why This Approach:**

- ✅ No CSS class generation required
- ✅ Colors come directly from API (ESPN data)
- ✅ Scales to unlimited teams/conferences
- ✅ Aligns with Phase 5 theme system (same pattern)
- ✅ DaisyUI compatible
- ✅ Respects user's selected theme (primary color fallback)
- ✅ No build-time CSS overhead

**Color Format Notes:**

- ESPN API provides colors as hex WITHOUT `#` prefix (e.g., `"ba0c2f"`)
- Always add `#` when applying to CSS: ``--team-color`: `#${team.color}` `
- Fallback to DaisyUI's `--color-primary` if color unavailable
- All team colors guaranteed in API response after Phase 0 fixes

---

## Known Gotchas & Important Notes

**espnId as Primary Key:**

- Override keys use `game.espnId` (ESPN ID, always available)
- NOT MongoDB `_id` or `_id` string
- This matches backend `applyOverrides()` function (line 21 of tiebreaker-helpers.ts)
- Every game guaranteed to have `espnId` (not optional in schema)

**Real-time Validation:**

- Validation happens on every keystroke in input fields (React Hook Form configured for real-time)
- Button clicks always produce valid scores (auto-calculated opponent score)
- Validation timing is configurable via React Hook Form options - not a blocking concern
- Backend validates defensively before `/api/simulate`
- If backend validation fails, error shown in toast (Phase 4+)

**Prefill & Default Values Strategy:**

- `predictedScore` always present in game data (guaranteed by database)
- Button scores use `predictedScore` as default if no override exists
- Input prefill uses current override OR `predictedScore` as fallback
- User can load page, click button or simulate immediately - all games valid by default
- Even with no user interaction, game has valid score for simulation

**Button State Management:**

- Button clicks calculate opponent score as 1 point less than selected team
- Button styling reflects current selected winner (background color vs outline)
- Multiple button clicks toggle between teams (clicking same team again toggles to unselected)
- Button state derives from current override in localStorage
- Buttons always available (never hidden, even in view modes)

**Edit Mode Toggle:**

- Default view: score display + buttons + "Edit Scores" link
- Edit view: score inputs + buttons + "Hide Scores" link
- Transition is smooth (no validation blocking mode toggle)
- Scores always visible (text in default view, inputs in edit view)
- Edit mode state is UI-only (not persisted to localStorage)

**localStorage Behavior:**

- Only valid overrides stored (invalid state never persists)
- If localStorage corrupted/invalid, treat as no overrides
- localStorage key includes season: `sec-tiebreaker-overrides-{season}`
- Format: `{ [gameEspnId]: { homeScore: number, awayScore: number } }`
- Size limit monitored (log warning if approaching limit)

**React Hook Form Implementation:**

- Use real-time validation (configurable via mode option)
- Preserve prefilled values on component remount
- Handle form reset (for "Reset to Live") cleanly
- No form submission event needed - auto-save on every valid change

**CSS Colors & ESPN Format:**

- ESPN provides colors as hex WITHOUT `#` prefix (e.g., `"ba0c2f"`)
- Add `#` prefix when applying to CSS: `style={{ '--team-color': `#${team.color}` }}`
- Fallback to DaisyUI primary color if no API color available
- Button classes: `.btn.selected` (background) and `.btn.unselected` (outline/border)
- CSS variable: `--team-color: var(--team-color, var(--color-primary))`

**Future: React Toast Integration (Phase 4+)**

- Error messages currently shown inline below inputs
- When implementing Phase 4 error handling:
  - Add `react-hot-toast` or similar library
  - Show error toasts for backend validation failures
  - Show success toast for "Reset to Live" completion
  - Defer full toast integration to Phase 4 implementation doc
