# State Management

Redux store structure, slices, and persistence patterns.

**Related Documentation:**
- [Frontend Index](./index.md) - Frontend documentation overview
- [Data Flow](./data-flow.md) - How state updates flow through the application

---

## Store Provider

**StoreProvider** (`app/components/StoreProvider.tsx`): Wraps app with Redux `Provider` and `PersistGate` for SSR-safe hydration. Automatically restores persisted state from localStorage on app load.

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

**Usage:** `useUIState()` hook provides state and actions.

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

**Usage:** Dispatch actions via `useAppDispatch()` hook.

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

**Persistence Config** (`app/store/store.ts`):
```typescript
const uiPersistConfig = {
  key: 'ui',
  storage,
  blacklist: ['lastUpdated'], // Server data, not user preference
};

const gamePicksPersistConfig = {
  key: 'gamePicks',
  storage,
};
```

**localStorage Keys:**
- `persist:ui` - UI preferences (theme, mode, view, hideCompletedGames)
- `persist:gamePicks` - User game picks

**Middleware:** Redux Toolkit includes thunk by default. redux-persist actions (`persist/PERSIST`, `persist/REHYDRATE`, `persist/PURGE`) are ignored in serializableCheck.

**Usage:** Components dispatch Redux actions normally - persistence is automatic. No manual localStorage calls needed.

**Important Notes:**
- API slice (RTK Query) is NOT persisted - cache is ephemeral
- `lastUpdated` field in UI state is blacklisted (server data, not user preference)
- State is restored on app load via `PersistGate` before rendering children

