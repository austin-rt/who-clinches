# Phase 2: Games List & Filtering

**Scope:** Fetch games from API, display by week in collapsible accordions, implement "Show Completed Games" toggle

**Dependencies:** Phase 1 (layout shell exists)

**Files to Create/Modify:**

- `app/components/GamesList.tsx` (new)
- `app/components/GameCard.tsx` (new)
- `app/components/WeekAccordion.tsx` (new)
- `app/components/GamesFilter.tsx` (new)
- `app/page.tsx` (update to use GamesList)

**API Integration (RTK Query):**

RTK Query is already set up in `app/store/apiSlice.ts` with `useGetGamesQuery` hook.

```typescript
// app/components/GamesList.tsx
import { useGetGamesQuery } from '@/app/store/apiSlice';
import { useMemo } from 'react';

const GamesList = ({ season, conferenceId }: { season: number; conferenceId: number }) => {
  // RTK Query hook - automatically handles loading, error, caching, and refetching
  const { data, isLoading, isError, error } = useGetGamesQuery({
    season: season.toString(),
    conferenceId: conferenceId.toString(),
  });

        // Enrich games with team metadata
  const enrichedGames = useMemo(() => {
    if (!data) return [];
        const teamMap = new Map(data.teams.map((t) => [t.id, t]));
    return data.events.map((game) => ({
          ...game,
          home: {
            ...game.home,
            displayName: teamMap.get(game.home.teamEspnId)?.displayName || game.home.abbrev,
            logo: teamMap.get(game.home.teamEspnId)?.logo || '',
            color: teamMap.get(game.home.teamEspnId)?.color || '',
          },
          away: {
            ...game.away,
            displayName: teamMap.get(game.away.teamEspnId)?.displayName || game.away.abbrev,
            logo: teamMap.get(game.away.teamEspnId)?.logo || '',
            color: teamMap.get(game.away.teamEspnId)?.color || '',
          },
        }));
  }, [data]);

  // Handle loading/error states
  if (isLoading) return <div className="loading loading-spinner" />;
  if (isError) return <div className="alert alert-error">Error: {error?.toString()}</div>;

  // Render games list...
};
```

**RTK Query Benefits:**

- Automatic caching - games data cached and reused
- Loading/error states - `isLoading`, `isError`, `error` provided automatically
- Refetching - can easily poll for live game updates
- TypeScript support - full type safety from API types

**Component Definitions:**

```typescript
// app/components/GamesList.tsx
// Fetches games from /api/games
// Groups by week
// Props: season, conferenceId
// State: showCompleted toggle, games array, loading/error states

// app/components/WeekAccordion.tsx
// Uses DaisyUI collapse component with checkbox (independent open/close)
// Props: weekNumber, games[]
// Renders: accordion header with week label, GameCard components inside

// app/components/GameCard.tsx
// Uses DaisyUI card component
// Props: game object (FrontendGame)
// Renders: matchup display (home vs away with scores/ranks)

// app/components/GamesFilter.tsx
// Uses DaisyUI toggle/checkbox
// Props: showCompleted, onToggle callback
// Renders: "Show Completed Games" toggle
```

**Implementation Checklist:**

- [ ] Use `useGetGamesQuery` from RTK Query (already set up in `app/store/apiSlice.ts`)
- [ ] Handle API response structure: `{ events, teams, lastUpdated }`
- [ ] Enrich games with team metadata from `teams` array (use `useMemo` for performance)
- [ ] Create GamesList component with filtering logic
- [ ] Create WeekAccordion with checkbox-based collapse
- [ ] Create GameCard to display individual game
- [ ] Create GamesFilter toggle component
- [ ] Handle loading state using `isLoading` from RTK Query (DaisyUI spinner)
- [ ] Handle error state using `isError` from RTK Query (DaisyUI alert)
- [ ] Update `app/page.tsx` to use GamesList
- [ ] Test: multiple weeks can be open simultaneously

**Manual Testing:**

1. Run `npm run dev`
2. Load page - should see list of weeks
3. Click week - accordion expands
4. Click another week - both stay open (independent)
5. Toggle "Show Completed Games" - visibility changes
6. Check Network tab - `/api/games` request succeeds
7. Verify games display correctly with team logos/names
8. Test on mobile - responsive layout works

**Known Gotchas:**

- API returns `events` not `games` - use `data.events`
- Team metadata must be merged from `teams` array
- Use `teamEspnId` not `teamId` in game data
- Handle optional fields gracefully
- DaisyUI collapse uses checkbox for state management
