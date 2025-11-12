# Phase 2: Games List & Filtering

**Scope:** Fetch games from API, display by week in collapsible accordions, implement "Show Completed Games" toggle

**Dependencies:** Phase 1 (layout shell exists)

**Files to Create/Modify:**

- `app/components/GamesList.tsx` (new)
- `app/components/GameCard.tsx` (new)
- `app/components/WeekAccordion.tsx` (new)
- `app/components/GamesFilter.tsx` (new)
- `app/hooks/useGames.ts` (new)
- `app/page.tsx` (update to use GamesList)

**API Integration:**

```typescript
// app/hooks/useGames.ts
export function useGames(season: number, conferenceId: number) {
  const [games, setGames] = useState<FrontendGame[]>([]);
  const [teams, setTeams] = useState<TeamMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await fetch(`/api/games?season=${season}&conferenceId=${conferenceId}`);
        const data: GamesResponse = await response.json();

        // Enrich games with team metadata
        const teamMap = new Map(data.teams.map((t) => [t.id, t]));
        const enrichedGames: FrontendGame[] = data.events.map((game) => ({
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

        setGames(enrichedGames);
        setTeams(data.teams);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch games');
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, [season, conferenceId]);

  return { games, teams, loading, error };
}
```

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

- [ ] Create `useGames` hook to fetch from `/api/games`
- [ ] Handle API response structure: `{ events, teams, lastUpdated }`
- [ ] Enrich games with team metadata from `teams` array
- [ ] Create GamesList component with filtering logic
- [ ] Create WeekAccordion with checkbox-based collapse
- [ ] Create GameCard to display individual game
- [ ] Create GamesFilter toggle component
- [ ] Handle loading state (DaisyUI spinner)
- [ ] Handle error state (DaisyUI alert)
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
