# Data Flow

How data flows through the application: fetching, user interactions, and state updates.

**Related Documentation:**
- [Frontend Index](./index.md) - Frontend documentation overview
- [State Management](./state-management.md) - Redux store and persistence
- [Components](./components.md) - Component patterns

---

## Game Data Fetching

- RTK Query with automatic caching
- `useGetGamesQuery` hook
- Automatic refetch on window focus
- `lastUpdated` synced to Redux on successful fetch

---

## Game Picks Flow

1. User clicks team logo in compact mode
2. `CompactGameButton` calculates scores
3. Dispatches `setGamePick` to Redux
4. Redux state updates
5. redux-persist automatically persists to localStorage
6. Component re-renders with new selection

---

## Score Editing Flow

1. User edits score input in scores mode
2. `Score` component validates on blur
3. If valid: Dispatches `setGamePick` to Redux
4. Redux state updates → redux-persist automatically persists
5. Component re-renders with new score

---

**Last Updated**: November 2025

