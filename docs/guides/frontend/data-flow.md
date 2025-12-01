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

**Data Pipeline**: ESPN API → Reshape (with team enrichment) → Database Upsert → API Response
- Team metadata (`displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`) is enriched at the reshape level before upsert
- All team name variations are stored in the `Game` model, eliminating the need for multiple enrichment steps

**RTK Query Hooks** (from `app/store/apiSlice.ts`):
- `useGetSeasonGameDataFromCacheQuery({ sport, conf, season?, week?, state?, from?, to? })` - Fast MongoDB query (GET request, ~50-200ms)
- `useGetSeasonGameDataQuery({ sport, conf, season?, week?, state?, from?, to?, force? })` - Full season data with ESPN fetch (POST request, ~500-2000ms)
- `useGetLiveGameDataQuery({ sport, conf, season?, force? })` - Live game updates (no week parameter - always queries current week)
- `useGetSpreadDataQuery({ sport, conf, season?, week?, force? })` - Spread/odds updates
- `useSimulateMutation()` - Requires `{ sport, conf, season, overrides }` in request body

### Initial Load Strategy

The `useGamesData` hook implements a two-phase loading strategy for fast initial loads:

1. **Fast Initial Load**: Uses `useGetSeasonGameDataFromCacheQuery` (GET request) to fetch from MongoDB immediately (~50-200ms)
2. **Background Refresh**: Automatically triggers `useGetSeasonGameDataQuery` (POST request) after initial load completes to fetch fresh data from ESPN (~500-2000ms)
3. **UI Updates**: Loading spinner only shows during GET request; POST refresh happens silently in background

### Polling Strategy

After initial load, the `useGamesData` hook implements conditional polling based on game states and start times:
1. **Live Games Polling**: Starts when:
   - Games are in progress (`state: 'in'`), OR
   - Games are starting within 5 minutes of kickoff (`state: 'pre'` and game date is within 5 minutes)
   - Polls `/api/games/[sport]/[conf]/live` every 60 seconds
   - Updates scores and game status only (lightweight)
   - Only works in production/preview environments (disabled in development)
   - Continues until all games are post (`state: 'post'`)
2. **Pre-Game Spreads Polling**: When games are scheduled (`state: 'pre'`) and NOT starting within 5 minutes:
   - Only in production/preview environments (not localhost)
   - Only when viewing in "scores" mode
   - Polls `/api/games/[sport]/[conf]/spreads` every 5 minutes
   - Updates betting odds and spreads only
3. **No Polling**: When all games are post (`state: 'post'`)

This strategy minimizes API calls while ensuring fresh data when users are actively viewing games. Polling starts 5 minutes before kickoff to ensure scores update immediately when games begin. Live polling is disabled in development to reduce unnecessary API calls during local development.

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

## Redux Patterns

**State Management:**
- `useAppSelector()`, `useAppDispatch()` from `app/store/hooks.ts`
- `useUIState()` hook from `app/store/useUI.ts`
- redux-persist automatically persists ui and gamePicks slices to localStorage (keys: `persist:ui`, `persist:gamePicks`)

**Component Patterns:** Arrow function syntax with default export. Define types in `types/frontend.ts` or `lib/types.ts` (no inline literal union types).

**Last Updated**: January 2025

