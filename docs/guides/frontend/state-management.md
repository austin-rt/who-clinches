# State Management

Redux store structure, slices, and persistence patterns.

**Related Documentation:**
- [Frontend Index](./index.md) - Frontend documentation overview
- [Data Flow](./data-flow.md) - How state updates flow through the application

---

## Store Provider

**StoreProvider** (`app/components/StoreProvider.tsx`):
- Wraps app with Redux `Provider`
- Includes `PersistGate` from redux-persist for SSR-safe hydration
- Automatically restores persisted state from localStorage on app load
- `loading={null}` prevents flash of unstyled content during hydration

---

## Redux Store Structure

**Store Configuration** (`app/store/store.ts`):
```typescript
{
  ui: UIState,              // Theme, mode, view, hideCompletedGames, lastUpdated
  gamePicks: GamePicksState, // User game selections
  api: ApiState             // RTK Query cache
}
```

---

## UI State (`app/store/uiSlice.ts`)

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

---

## Game Picks State (`app/store/gamePicksSlice.ts`)

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

---

## State Persistence with redux-persist

**Pattern**: redux-persist automatically syncs Redux state with localStorage

**Implementation** (`app/store/store.ts`):
- Uses `persistReducer` to wrap ui and gamePicks slices
- Automatically reads from localStorage on app load
- Automatically writes to localStorage on state changes
- SSR-safe via `PersistGate` component
- Single source of truth (Redux)

**Configuration:**

**TODO**: Document persistence configuration once finalized. Include persist config objects, localStorage keys, and middleware configuration.

**Usage:**
Components dispatch Redux actions normally - persistence is automatic:
```typescript
import { useAppDispatch } from '@/app/store/hooks';
import { setView } from '@/app/store/uiSlice';

dispatch(setView('scores')); // Automatically persisted to localStorage
```

**Important Notes:**
- API slice (RTK Query) is NOT persisted - cache is ephemeral
- `lastUpdated` field in UI state is blacklisted (server data, not user preference)
- Persistence happens automatically on every state change - no manual localStorage calls needed
- State is restored on app load via `PersistGate` before rendering children

---

**Last Updated**: November 2025

