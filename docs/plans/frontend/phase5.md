# Phase 5: Team Theme Selector

**Scope:** Add team selector UI, dynamically switch DaisyUI theme based on selection, persist selection

**Dependencies:** Phase 4 (all features working)

**Approach:** Dynamic team themes from database
- Fetch teams from `/api/teams` endpoint (created in this phase)
- Dynamically inject CSS for each team theme
- Build custom dropdown (DaisyUI's theme controller won't work with dynamic themes)
- Full scalability for future conferences
- **Technical discussion tabled until Phase 5 implementation**

**Files to Create/Modify:**
- `app/api/teams/route.ts` (new - GET endpoint to fetch all teams from DB)
- `app/components/TeamThemeSelector.tsx` (new)
- `app/components/Header.tsx` (update to include theme selector)
- `app/hooks/useTeams.ts` (new - fetch teams and inject themes)
- `lib/api-types.ts` (add TeamsResponse type if not already added)

**Component Definitions:**
```typescript
// app/components/TeamThemeSelector.tsx
// Custom dropdown component (not DaisyUI's theme controller)
// Props: none
// Fetches teams from /api/teams
// Dynamically injects CSS for each team theme
// Renders: dropdown with all teams from database + "SEC Default"
// On selection: sets data-theme attribute and saves to localStorage

// app/hooks/useTeams.ts
// Fetches teams from /api/teams
// Injects CSS for each team theme dynamically
// Returns teams array and loading state
```

**Implementation Checklist:**
- [ ] Create `/api/teams` endpoint (GET, returns all teams with colors)
- [ ] Create `useTeams` hook to fetch teams and inject themes
- [ ] Implement dynamic CSS injection function
- [ ] Create TeamThemeSelector component with custom dropdown
- [ ] Handle loading state (themes not available until API loads)
- [ ] Populate dropdown with teams from API
- [ ] Save selection to localStorage on change
- [ ] Update Header to include TeamThemeSelector
- [ ] Add visual indicator of current theme
- [ ] Test theme persistence across page refreshes
- [ ] Ensure all components update colors when theme changes
- [ ] Handle error cases (API failure, localStorage corruption)

**Technical Discussion:**
- Dynamic CSS injection approach will be finalized during Phase 5 implementation
- DaisyUI theme controller limitations will be addressed
- Performance and caching strategies will be determined

**Manual Testing:**
1. Run `npm run dev`
2. Look for theme selector in Header
3. Click selector - should show dropdown with all teams from database + "SEC Default"
4. Select a team - page colors change to team theme
5. Select different team - colors change immediately
6. Check localStorage - key should show selected team
7. Refresh page - selected theme should persist
8. Test all teams - each should have distinct colors
9. Verify championship highlighting works with each theme
10. Test game override buttons - should show in theme colors
11. Test standings table - all text readable with chosen theme

**Known Gotchas:**
- Team abbreviations must match `data-theme` values exactly
- Some team color combinations may have poor contrast - test readability
- Dropdown should show current selection as selected option
- Add alt text for accessibility

