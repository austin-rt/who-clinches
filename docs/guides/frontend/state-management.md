# State Management

Redux store structure, slices, and persistence patterns.

**Related Documentation:**

- [Frontend Index](./index.md) - Frontend documentation overview
- [Data Flow](./data-flow.md) - How state updates flow through the application

---

## Store Provider

**StoreProvider** (`app/components/StoreProvider.tsx`): Wraps app with Redux `Provider` and `PersistGate` for SSR-safe hydration. Automatically restores persisted state from localStorage.

---

## Redux Store Structure

**Store Configuration** (`app/store/store.ts`):

```typescript
{
  ui: UIState,              // Theme, mode, view, hideCompletedGames, standingsOpen
  app: AppState,            // Season, isInSeason, allowGraphQL
  gamePicks: GamePicksState, // User game selections
  api: ApiState             // RTK Query cache
}
```

---

## UI State (`app/store/uiSlice.ts`)

**State Interface:**

```typescript
interface UIState {
  theme: string; // Team theme (e.g., 'sec', 'alabama')
  mode: ThemeMode; // 'light' | 'dark'
  view: ViewMode; // 'picks' | 'scores'
  hideCompletedGames: boolean; // Hide completed games in picks mode
  standingsOpen: boolean; // Whether standings panel is open
}
```

**Actions:**

- `setTheme(theme: string)`
- `setMode(mode: ThemeMode)`
- `setView(view: ViewMode)`
- `setHideCompletedGames(hide: boolean)`
- `setStandingsOpen(open: boolean)`

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

**Important**: All localStorage access in this codebase is through redux-persist. There is no direct `localStorage.getItem()` or `localStorage.setItem()` usage. Components interact with Redux state only; persistence is handled automatically by redux-persist.

**Implementation** (`app/store/store.ts`): Uses `persistReducer` to wrap ui and gamePicks slices. Automatically reads from localStorage on app load and writes on state changes. SSR-safe via `PersistGate` component. Single source of truth (Redux).

**Configuration:**

**Persistence Config** (`app/store/store.ts`):

- `uiPersistConfig`: key `'ui'`, blacklist `['standingsOpen']` (UI state only)
- `appPersistConfig`: key `'app'`, blacklist `['isInSeason']` (server data)
- `gamePicksPersistConfig`: key `'gamePicks'`, includes `redux-persist-expire` transform
  - Expires after 1 hour (3600 seconds) of inactivity
  - Automatically clears picks when expired
  - Expiration timer resets on each state update
- localStorage keys: `persist:ui`, `persist:app`, `persist:gamePicks`
- Middleware: redux-persist actions ignored in serializableCheck

**Usage:** Components dispatch Redux actions normally - persistence is automatic.

**Game Picks Expiration:** Game picks are automatically cleared from localStorage after 1 hour of inactivity. The expiration timer resets whenever picks are updated, ensuring active users retain their selections. This prevents stale simulation data from persisting across sessions.

**Notes:** API slice (RTK Query) is NOT persisted. State restored on app load via `PersistGate`.
