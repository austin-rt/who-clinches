# Data Flow

How data flows through the application: fetching, user interactions, and state updates.

**Related Documentation:**
- [Frontend Index](./index.md) - Frontend documentation overview
- [State Management](./state-management.md) - Redux store and persistence
- [Components](./components.md) - Component patterns

---

## Game Data Fetching

- RTK Query with automatic caching and conditional polling
- `useGamesData({ sport, conf, season })` hook - Main hook for game data with intelligent polling
- Dynamic routes require sport/conf parameters: `/api/games/[sport]/[conf]`
- Automatic refetch on window focus
- `lastUpdated` synced to Redux on successful fetch

### Polling Strategy

The `useGamesData` hook implements conditional polling based on game states:

1. **Initial Load**: Fetches full season data via `useGetSeasonGameDataQuery`
2. **Live Games Polling**: When games are in progress (`state: 'in'`):
   - Polls `/api/games/[sport]/[conf]/live` every 5 minutes
   - Updates scores and game status only (lightweight)
   - Stops when all games are completed
3. **Pre-Game Spreads Polling**: When games are scheduled (`state: 'pre'`):
   - Only in production/preview environments (not localhost)
   - Only when viewing in "scores" mode
   - Polls `/api/games/[sport]/[conf]/spreads` every 5 minutes
   - Updates betting odds and spreads only
4. **No Polling**: When all games are completed (`state: 'post'` and `completed: true`)

This strategy minimizes API calls while ensuring fresh data when users are actively viewing games.

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

**Last Updated**: January 2025

