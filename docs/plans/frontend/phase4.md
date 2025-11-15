# Phase 4: Simulation & Standings Display

**Scope:** Fetch tiebreaker results from API, display standings table with tiebreaker explanations

**Dependencies:** Phase 3 (overrides working)

**Files to Create/Modify:**

- `app/components/SimulateButton.tsx` (new)
- `app/components/StandingsTable.tsx` (new)
- `app/components/StandingRow.tsx` (new)
- `app/components/TieBreakerExplainer.tsx` (new)
- `app/page.tsx` (update to show standings after simulate)

**API Integration (RTK Query):**

RTK Query is already set up in `app/store/apiSlice.ts` with `useSimulateMutation` hook.

```typescript
// app/components/SimulateButton.tsx
import { useSimulateMutation } from '@/app/store/apiSlice';
import { SimulateRequest } from '@/lib/api-types';

const SimulateButton = ({ season, conferenceId, overrides }: SimulateRequest) => {
  // RTK Query mutation hook - automatically handles loading, error states
  const [simulate, { isLoading, isError, error, data }] = useSimulateMutation();

  const handleSimulate = async () => {
    try {
      await simulate({ season, conferenceId, overrides }).unwrap();
      // Success - data is available in `data` property
      // data.standings, data.tieLogs, data.championship
    } catch (err) {
      // Error handled automatically by RTK Query
      // Can show toast notification here
    }
  };

  return (
    <button
      className="btn btn-primary"
      onClick={handleSimulate}
      disabled={isLoading}
    >
      {isLoading ? 'Simulating...' : 'Simulate Standings'}
    </button>
  );
};
```

**RTK Query Benefits:**

- Automatic loading/error states - `isLoading`, `isError`, `error` provided automatically
- TypeScript support - full type safety from API types
- Optimistic updates - can implement optimistic UI updates if needed
- Cache invalidation - automatically invalidates related cache tags

**Component Definitions:**

```typescript
// app/components/SimulateButton.tsx
// Uses DaisyUI btn component
// Props: onSimulate callback, loading state
// Renders: "Simulate Standings" button, loading state during fetch

// app/components/StandingsTable.tsx
// Uses DaisyUI table component
// Props: standings array, tieLogs array, championship tuple
// Renders: table with columns (Rank, Team, Record, Conf Record, Explanation)

// app/components/StandingRow.tsx
// Uses DaisyUI table row styling
// Props: standing object, tieLog for this team (if any), isChampionship
// Renders: single row with team info + tiebreaker explanation

// app/components/TieBreakerExplainer.tsx
// Props: tieLog object
// Renders: collapsible section explaining tiebreaker steps
// Shows: "Head-to-Head (Rule A): UGA 2-0, ALA 1-1 → UGA advances" etc.
```

**Implementation Checklist:**

- [ ] Use `useSimulateMutation` from RTK Query (already set up in `app/store/apiSlice.ts`)
- [ ] Create SimulateButton component using mutation hook with loading state
- [ ] Create StandingsTable using DaisyUI table component
- [ ] Create StandingRow to display team standings
- [ ] Create TieBreakerExplainer to show tiebreaker details
- [ ] Highlight championship matchup (top 2 teams) with different styling
- [ ] Add error handling using `isError` and `error` from RTK Query mutation
- [ ] Display standings on same page as games (below games list)
- [ ] Make standings table responsive
- [ ] Test: standings update when overrides change

**Manual Testing:**

1. Run `npm run dev`
2. Make some game overrides
3. Click "Simulate Standings" button
4. Verify loading state shows
5. After response, table should appear below games
6. Check standings - should have Rank, Team, Record, Conf Record, Explanation columns
7. Check top 2 teams - should be highlighted as championship
8. Click on explanation - should expand/collapse tiebreaker details
9. Change an override, simulate again - standings should update
10. Test on mobile - table should be readable

**Known Gotchas:**

- `/api/simulate` response uses `teamId` in standings (correct)
- Championship field is array of 2 team IDs
- TieLogs may be empty - handle gracefully
- Invalid overrides return 400 error - display error message
- Standings persist on page (same page as games)

**Error Handling & Notifications:**

- Backend validation errors from `/api/simulate` should be displayed to user
- Invalid override errors: "Scores cannot be equal", "Scores must be whole numbers", "Scores cannot be negative"
- Use React Toast library for error/success notifications
- **Implementation Note:** React Toast library will be added in this phase (Phase 4)
  - Install: `npm install react-hot-toast` or similar
  - Use for: API error toasts, validation error toasts, success confirmations
  - Can also be used retroactively for Phase 3 "Reset to Live" feedback
  - Error messages displayed inline below score inputs (Phase 3) AND in toast (Phase 4)

**Version Automation Setup:**

After Phase 4 is complete and `/api/simulate` is successfully returning to the FE, set up automated semantic versioning:

- Install `standard-version`: `npm install -D standard-version`
- Add to `package.json` scripts:
  ```json
  "release": "standard-version"
  ```
- Wire Husky post-commit hook (already installed in Phase 0):
  - Create `.husky/prepare-commit-msg` hook
  - Hook will auto-parse commit messages and increment minor version on release
- Usage: `npm run release` bumps version based on commits (`feat:` = minor, `fix:` = patch, `BREAKING CHANGE:` = major)
- Generates CHANGELOG automatically from commit history
- Creates git tags for each release

**Files to Create/Modify (for version automation):**

- `package.json` (add `standard-version` to devDependencies, add `release` script)
- `.husky/prepare-commit-msg` (new - hook configuration for version bumping)
