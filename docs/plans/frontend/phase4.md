# Phase 4: Simulation & Standings Display

**Scope:** Fetch tiebreaker results from API, display standings table with tiebreaker explanations

**Dependencies:** Phase 3 (overrides working)

**Related Documentation:**
- [API Reference](../../guides/api-reference.md) - `/api/simulate` endpoint documentation
- [Tiebreaker Testing](../../tests/tiebreaker-and-simulate.md) - Test procedures for simulate endpoint

**Files to Create/Modify:**

- `app/components/SimulateButton.tsx` (new)
- `app/components/StandingsTable.tsx` (new)
- `app/components/StandingRow.tsx` (new)
- `app/components/TieBreakerExplainer.tsx` (new)
- `app/page.tsx` (update to show standings after simulate)

**API Integration (RTK Query)**: RTK Query set up in `app/store/apiSlice.ts` with `useSimulateMutation` hook. Use `useSimulateMutation()` with dynamic routes - requires `{ sport, conf, season, overrides }` in request body. Automatically handles loading/error states (`isLoading`, `isError`, `error`), full TypeScript support, optimistic updates, cache invalidation

**Component Definitions**: `SimulateButton.tsx` (DaisyUI btn, loading state), `StandingsTable.tsx` (DaisyUI table, columns: Rank/Team/Record/Conf Record/Explanation), `StandingRow.tsx` (single row with team info + tiebreaker explanation), `TieBreakerExplainer.tsx` (collapsible section explaining tiebreaker steps)

**Implementation Checklist**: Use `useSimulateMutation` from RTK Query, create SimulateButton (loading state), create StandingsTable (DaisyUI table), create StandingRow, create TieBreakerExplainer, highlight championship (top 2), add error handling (`isError`, `error`), display standings below games, make responsive, test standings update when overrides change

**Manual Testing**: Run `npm run dev`, make game overrides, click "Simulate Standings", verify loading state, table appears below games, check columns (Rank/Team/Record/Conf Record/Explanation), top 2 highlighted as championship, explanation expands/collapses, change override and simulate again (standings update), test mobile (table readable)

**Known Gotchas**: `/api/simulate` response uses `teamId` in standings, championship is array of 2 team IDs, TieLogs may be empty (handle gracefully), invalid overrides return 400 (display error), standings persist on page

**Error Handling & Notifications**: Backend validation errors displayed to user, invalid override errors ("Scores cannot be equal", "Scores must be whole numbers", "Scores cannot be negative"), use React Toast library (`npm install react-hot-toast`) for API/validation error toasts, success confirmations, can be used retroactively for Phase 3 "Reset to Live" feedback

**Version Automation Setup** (After Phase 4): Install `standard-version` (`npm install -D standard-version`), add `"release": "standard-version"` to `package.json` scripts, create `.husky/prepare-commit-msg` hook (auto-parse commit messages, increment version). Usage: `npm run release` bumps version (`feat:` = minor, `fix:` = patch, `BREAKING CHANGE:` = major), generates CHANGELOG automatically, creates git tags
