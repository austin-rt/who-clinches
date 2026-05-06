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

**Data Pipeline**: CFBD API → Redis cache (production/preview) → Reshape (with team enrichment) → API Response

- Team metadata (`displayName`, `shortDisplayName`, `logo`, `color`, `alternateColor`) is enriched at the reshape level from CFBD API responses
- CFBD data is cached in Upstash Redis (production and preview when configured) with TTLs per data type
- Simulation snapshots are persisted to PostgreSQL (Prisma/Neon) when the user shares results

**RTK Query Hooks** (from `app/store/apiSlice.ts`):

- `useGetSeasonGameDataQuery({ sport, conf, season, week? })` - Fetch games from CFBD API (GET request to `/api/games/[sport]/[conf]`)
- `useSimulateMutation()` - Requires `{ sport, conf, season, games, teams, overrides }` in request body

### Initial Load Strategy

The `useGamesData` hook implements a single-phase loading strategy:

1. **Initial Load**: Uses `useGetSeasonGameDataQuery` (GET request) to fetch from CFBD API
2. **GraphQL Subscription**: When games are live or starting soon, automatically subscribes to `/api/games/[sport]/[conf]/subscribe` for real-time updates via Server-Sent Events
3. **UI Updates**: Loading spinner shows during initial fetch; subscription updates happen automatically

### Subscription Strategy

After initial load, the `useGamesData` hook implements conditional GraphQL subscriptions based on game states and start times:

1. **Live Games Subscription**: Starts when:
   - Games are in progress (`state: 'in'`), OR
   - Games are starting within 5 minutes of kickoff (`state: 'pre'` and game date is within 5 minutes)
   - Subscribes to `/api/games/[sport]/[conf]/subscribe` (Server-Sent Events)
   - Receives real-time score and game status updates
   - Only available when in season and GraphQL is enabled
   - Continues until all games are post (`state: 'post'`)
2. **No Subscription**: When all games are post (`state: 'post'`) or out of season

This strategy minimizes API calls while ensuring fresh data when users are actively viewing games. Subscription starts 5 minutes before kickoff to ensure scores update immediately when games begin. Falls back to REST API when out of season or GraphQL is disabled.

---

## Game Picks Flow

1. User clicks team logo in compact mode
2. `CompactGameButton` calculates scores
3. Dispatches `setGamePick` to Redux
4. Redux state updates
5. Component re-renders with new selection

---

## Score Editing Flow

1. User edits score input in scores mode
2. `Score` component validates on blur
3. If valid: Dispatches `setGamePick` to Redux
4. Redux state updates
5. Component re-renders with new score

---

## Redux Patterns

**State Management:**

- `useAppSelector()`, `useAppDispatch()` from `app/store/hooks.ts`
- `useUIState()` hook from `app/store/useUI.ts`
- redux-persist automatically persists ui and app slices to localStorage (keys: `persist:ui`, `persist:app`)

---

## Share Flow

1. User clicks **Simulate** → `SimulateButton` posts to `/api/simulate/[sport]/[conf]` → receives `SimulateResponse`
2. `simulateResponse` state set on conference page → passed to `Standings` → `SimulatedStandings` → `ShareButton`
3. `ShareButton` fires POST to `/api/share/[sport]/[conf]` in background `useEffect` immediately (pre-fetch)
4. Share API stores snapshot in PostgreSQL with hash dedup, returns URL
5. User clicks **Share Results** → modal opens instantly with pre-fetched URL
6. Results page (`/results/[id]`) fetches snapshot from DB and renders with shared components

**Component Patterns:** Arrow function syntax with default export. Define types in `types/frontend.ts` or `lib/types.ts` (no inline literal union types).

**Last Updated**: May 2026
