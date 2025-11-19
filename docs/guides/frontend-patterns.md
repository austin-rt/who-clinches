# Frontend Patterns and UX Documentation

Complete documentation of frontend architecture, component patterns, state management, and UX design decisions.

**Related Documentation:**
- [API Reference](./api-reference.md) - Backend API endpoints
- [AI Guide](../ai-guide.md) - Development patterns and principles

---

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + DaisyUI components
- **State Management**: Redux Toolkit (RTK) + RTK Query
- **Icons**: React Icons

### File Structure

```
app/
├── components/           # React components
│   ├── CompactGameButton.tsx    # Compact mode game selection
│   ├── CompactWeekGrid.tsx       # Compact mode grid layout
│   ├── DarkModeToggle.tsx        # Theme mode switcher
│   ├── DaySection.tsx            # Day-based game grouping
│   ├── FinalWeeks.tsx            # Completed games section
│   ├── GameCard.tsx               # Expanded mode game card
│   ├── GamesList.tsx              # Main games container
│   ├── Header.tsx                 # App header with controls
│   ├── HideCompletedToggle.tsx    # Toggle completed games visibility
│   ├── LastUpdated.tsx            # Scoreboard update timestamp
│   ├── RemainingWeeks.tsx         # Upcoming games section
│   ├── Score.tsx                  # Editable score component
│   ├── Team.tsx                   # Team logo/name display
│   ├── ThemeInitializer.tsx       # Redux-localStorage sync
│   ├── ThemeSync.tsx              # Theme DOM sync
│   └── ViewToggle.tsx             # View mode switcher
├── hooks/
│   └── useLocalStorage.ts         # Generic localStorage sync hook
├── store/                         # Redux state management
│   ├── apiSlice.ts                # RTK Query API slice
│   ├── gamePicksSlice.ts          # Game picks state
│   ├── hooks.ts                   # Typed Redux hooks
│   ├── store.ts                   # Redux store config
│   ├── uiSlice.ts                 # UI state (theme, mode, view)
│   └── useUI.ts                   # UI state selector hook
├── page.tsx                       # Home page
└── layout.tsx                     # Root layout with providers
```

---

## State Management

### Redux Store Structure

**Store Configuration** (`app/store/store.ts`):
```typescript
{
  ui: UIState,              // Theme, mode, view, hideCompletedGames, lastUpdated
  gamePicks: GamePicksState, // User game selections
  api: ApiState             // RTK Query cache
}
```

### UI State (`app/store/uiSlice.ts`)

**State Interface:**
```typescript
interface UIState {
  theme: string;                    // Team theme (e.g., 'sec', 'alabama')
  mode: ThemeMode;                  // 'light' | 'dark'
  view: ViewMode;                   // 'picks' | 'scores'
  hideCompletedGames: boolean;       // Hide completed games in picks mode
  lastUpdated: string | null;       // ISO timestamp from API
}
```

**Actions:**
- `setTheme(theme: string)`
- `setMode(mode: ThemeMode)`
- `setView(view: ViewMode)`
- `setHideCompletedGames(hide: boolean)`
- `setLastUpdated(timestamp: string)`

**Usage:**
```typescript
import { useUIState } from '@/app/store/useUI';
const { theme, mode, view, hideCompletedGames, setView } = useUIState();
```

### Game Picks State (`app/store/gamePicksSlice.ts`)

**State Interface:**
```typescript
interface GamePicksState {
  picks: Record<string, { homeScore: number; awayScore: number }>;
}
```

**Actions:**
- `setGamePick({ gameId, pick })`
- `clearGamePick(gameId)`
- `clearAllPicks()`

**Usage:**
```typescript
import { useAppDispatch } from '@/app/store/hooks';
import { setGamePick } from '@/app/store/gamePicksSlice';

dispatch(setGamePick({ gameId: game.espnId, pick: { homeScore: 24, awayScore: 21 } }));
```

### localStorage Synchronization

**Pattern**: `useLocalStorage` hook syncs Redux state with localStorage

**Implementation** (`app/hooks/useLocalStorage.ts`):
- Reads from localStorage on mount
- Writes to localStorage on change
- SSR-safe (handles hydration mismatches)
- Single source of truth (Redux)

**Usage:**
```typescript
const [view, setViewValue] = useLocalStorage<ViewMode>(
  'sec-tiebreaker-view',
  'picks',
  setView,
  (state) => state.ui.view
);
```

---

## View Modes

### Picks Mode (Compact View)
- Fixed-size game cards (230px × 110px)
- Team logo buttons for selection
- "WIN"/"LOSS" labels
- Score calculated automatically on pick
- Hide completed games toggle available

### Scores Mode (Expanded View)
- Full game cards with editable scores
- Inline score inputs for incomplete games
- Validation on blur (no ties, no negatives)
- Read-only display for completed games

---

## Component Patterns

### Theme-Aware Components
- Use DaisyUI semantic colors (`text-primary`, `bg-base-200`)
- Theme applied via `data-theme` attribute
- CSS variables for theme colors

### Conditional Rendering Based on View Mode
```typescript
const isEditable = view === 'scores' && !game.completed;
if (isEditable) {
  return <input type="text" value={score} onChange={...} />;
}
return <span>{score}</span>;
```

### Score Calculation Pattern
- Completed games: Use actual scores
- Incomplete games: Calculate to ensure picked team wins
- Uses `predictedScore` as base, adjusts to favor picked team

---

## UX Design Decisions

### View Mode Toggle
- Single button with conditional rendering
- Icon + text (both states)
- Absolute positioning (no layout shift)
- Theme-aware colors

### Hide Completed Games Toggle
- Button with dynamic text
- Only affects picks mode
- Preference persisted to localStorage

### Compact Game Cards
- Fixed size: `w-[230px] h-[110px]`
- Team logo buttons (clickable)
- Selected team highlight
- "WIN"/"LOSS" labels

### Score Editing
- Inline editable inputs with validation
- Validation: no ties, no negatives, integers only
- Error message below invalid input
- Valid scores save automatically on blur

### Dark Mode
- System-wide theme toggle
- Light mode: SEC blue (`text-primary`)
- Dark mode: SEC yellow (`text-secondary`)
- Backgrounds: DaisyUI `base-200`, `base-300`

---

## Data Flow

### Game Data Fetching
- RTK Query with automatic caching
- `useGetGamesQuery` hook
- Automatic refetch on window focus
- `lastUpdated` synced to Redux on successful fetch

### Game Picks Flow
1. User clicks team logo in compact mode
2. `CompactGameButton` calculates scores
3. Dispatches `setGamePick` to Redux
4. Redux state updates
5. `useLocalStorage` persists to localStorage
6. Component re-renders with new selection

### Score Editing Flow
1. User edits score input in scores mode
2. `Score` component validates on blur
3. If valid: Dispatches `setGamePick` to Redux
4. Redux state updates → `useLocalStorage` persists
5. Component re-renders with new score

---

## Styling Patterns

### DaisyUI Components
- `navbar`: Header
- `btn`: Buttons
- `card`, `card-body`: Game cards
- `swap`: View toggle animation
- `collapse`: Week accordions

### Tailwind Utilities
- Layout: `container mx-auto`, `flex`, `grid`, `gap-*`
- Colors: `bg-base-200`, `text-primary`, `border-base-300`
- Responsive: Mobile-first, breakpoints `sm:`, `md:`, `lg:`, `xl:`

---

## Performance Considerations

### Memoization
- Use `useMemo` for expensive calculations (e.g., week/day grouping)
- RTK Query automatic memoization for selectors

### RTK Query Caching
- Stale-while-revalidate pattern
- Automatic refetch on window focus
- Cache invalidation via tags

### Component Optimization
- Memoized selectors (RTK Query automatic)
- Conditional rendering (view mode switching)
- Local state for transient UI

---

**Last Updated**: November 2025
