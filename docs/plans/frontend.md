# Frontend Development Plan

**Project:** SEC Tiebreaker UI  
**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, DaisyUI  
**Status:** Planning Phase

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Type System](#type-system)
3. [Theme System Architecture](#theme-system-architecture)
4. [Tailwind & DaisyUI Configuration](#tailwind--daisyui-configuration)
5. [Phased Implementation](#phased-implementation)
6. [Build & Deployment](#build--deployment)

---

## Architecture Overview

### File Structure

```
app/
├── components/              # React components (App Router convention)
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Navigation.tsx
│   ├── GamesList.tsx
│   ├── GameCard.tsx
│   ├── WeekAccordion.tsx
│   ├── GamesFilter.tsx
│   ├── ScoreInputs.tsx
│   ├── SimulateButton.tsx
│   ├── StandingsTable.tsx
│   ├── StandingRow.tsx
│   ├── TieBreakerExplainer.tsx
│   └── TeamThemeSelector.tsx
├── hooks/                   # React hooks
│   ├── useGames.ts
│   ├── useSimulate.ts
│   ├── useGameOverrides.ts
│   └── useTheme.ts
├── lib/                     # Backend types/helpers (existing - DO NOT MODIFY)
│   ├── types.ts             # Backend types (existing)
│   ├── api-types.ts         # API request/response types (existing)
│   └── ...
├── types/                    # Frontend-specific types (NEW)
│   └── frontend.ts
├── globals.css              # Tailwind + DaisyUI config
├── layout.tsx
└── page.tsx

lib/                         # Backend code (existing)
types/                       # Frontend types (new)
```

**Key Decisions:**

- Components in `app/components/` (Next.js App Router convention)
- Frontend types in `types/frontend.ts` (separate from backend `lib/types.ts`)
- Hooks in `app/hooks/` (co-located with components)
- Scalable structure for future sports/conferences

### State Management

- **React Hooks:** `useState`, `useEffect`, `useCallback`, `useMemo`
- **localStorage:** User preferences and game overrides
- **No external state management:** Keep it simple initially

### Component Hierarchy

```
RootLayout
├── Header
│   └── TeamThemeSelector
├── Navigation
├── Main Content (page.tsx)
│   ├── GamesFilter
│   ├── ResetLiveButton
│   ├── GamesList
│   │   └── WeekAccordion[] (multiple can be open)
│   │       └── GameCard[]
│   │           └── ScoreInputs
│   ├── SimulateButton
│   └── StandingsTable
│       └── StandingRow[]
│           └── TieBreakerExplainer
└── Footer
```

---

## Type System

### Frontend Type Definitions

**File:** `types/frontend.ts`

```typescript
/**
 * Frontend-specific type definitions
 * Backend types are in lib/types.ts and lib/api-types.ts
 */

import { GameLean, TeamLean } from '@/lib/types';
import { GamesResponse, SimulateResponse, StandingEntry, TieLog } from '@/lib/api-types';

// Re-export API types for convenience
export type { GamesResponse, SimulateResponse, StandingEntry, TieLog };

// Frontend game type (based on GameLean but with guaranteed optional fields handled)
export interface FrontendGame extends Omit<GameLean, 'home' | 'away'> {
  home: {
    teamEspnId: string;
    abbrev: string;
    displayName: string; // Guaranteed by API response teams metadata
    logo: string; // Guaranteed by API response teams metadata
    color: string; // Guaranteed by API response teams metadata
    score: number | null;
    rank: number | null;
  };
  away: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;
    logo: string;
    color: string;
    score: number | null;
    rank: number | null;
  };
}

// User overrides (matches SimulateRequest['overrides'])
export interface UserOverrides {
  [gameEspnId: string]: {
    homeScore: number;
    awayScore: number;
  };
}

// SEC Team metadata for theme selector
export interface SECTeam {
  abbrev: string;
  displayName: string;
  espnId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

// Theme configuration
export interface ThemeConfig {
  name: string;
  abbrev: string;
  primary: string;
  primaryContent: string;
  secondary: string;
  secondaryContent: string;
  accent: string;
  accentContent: string;
}
```

**Key Points:**

- Frontend types extend/transform backend types
- `FrontendGame` enriches `GameLean` with guaranteed team metadata from API
- Re-export API types for convenience
- Separate file to avoid conflicts with backend types

---

## Theme System Architecture

### Default Theme Strategy

**Decision:** The app loads with a custom SEC theme (not team-specific) on first visit.

**SEC Theme Colors (Official Brand Colors):**

- Primary: SEC Blue (`#004B8D`) - Pantone PMS 2945 XGC
- Secondary: SEC Gold (`#FFD046`) - Pantone PMS 7404 U
- Accent: White (`#FFFFFF`)
- Neutral: Black (`#000000`)

**Theme Selection Flow:**

1. On first visit: Load SEC default theme
2. User selects favorite team: Switch to team theme
3. Theme persists in localStorage: `"sec-tiebreaker-theme"`
4. On subsequent visits: Load saved theme from localStorage
5. If localStorage corrupted: Fall back to SEC default theme

**localStorage Keys:**

- `"sec-tiebreaker-theme"`: Team abbreviation string (e.g., `"alabama"`, `"georgia"`) or `"sec"` for default
- `"sec-tiebreaker-mode"`: `"light"` or `"dark"` for base color mode

**Theme Independence:**

- Team selection affects: `primary`, `secondary`, `accent` colors (buttons, highlights, etc.)
- Mode selection affects: `base-100`, `base-200`, `base-300`, `base-content` (backgrounds, text)
- These are independent - user can mix any team with any mode

### DaisyUI Theme System

DaisyUI uses `data-theme` attribute on `<html>` element to switch themes. All DaisyUI components automatically use theme colors via CSS variables.

**Theme Structure:**

```css
[data-theme='sec'] {
  --color-primary: #004b8d; /* SEC Blue - Official Brand Color */
  --color-primary-content: #ffffff;
  --color-secondary: #ffd046; /* SEC Gold - Official Brand Color */
  --color-secondary-content: #000000;
  --color-accent: #ffffff;
  --color-accent-content: #000000;
}

[data-theme='alabama'] {
  --color-primary: #a00000; /* Crimson */
  --color-primary-content: #ffffff;
  --color-secondary: #ffffff; /* White */
  --color-secondary-content: #000000;
  --color-accent: #231f20; /* Black */
  --color-accent-content: #ffffff;
}

/* ... all 16 SEC teams */
```

### Team Theme Definitions

**Source of Truth:** Team colors come from the database (ESPN API) via `/api/games` response.

**Current State:**

- ✅ Database stores `color` and `alternateColor` for each team (from ESPN) - **VERIFIED**
- ✅ All 16 teams have both color fields populated - **VERIFIED**
- ❌ `/api/games` currently does NOT include colors in `TeamMetadata` response
- **Action Required:** Add colors to API response (no reseed needed)

**Implementation Strategy:**

1. **Update `/api/games` endpoint** to include colors:
   - Add `color` and `alternateColor` to `TeamMetadata` interface
   - Update query to select these fields: `.select("_id abbreviation displayName logo color alternateColor")`
   - Include in response

2. **Frontend Override System:**
   - Create `app/config/theme-overrides.ts` for manual color adjustments
   - Override only teams that need correction (ESPN colors may not match official brand)
   - Frontend merges API colors with overrides: `override[teamId] || apiColor`

3. **Theme Generation:**
   - Frontend receives team colors from API
   - Applies overrides if needed
   - Generates DaisyUI theme CSS variables dynamically
   - Falls back to SEC default theme if team data missing

**Example Override File:**

```typescript
// app/config/theme-overrides.ts
export const themeOverrides: Record<
  string,
  {
    primary: string;
    secondary: string;
    accent: string;
  }
> = {
  // Only override teams where ESPN colors don't match official brand
  '333': {
    // Alabama
    primary: '#A00000', // Crimson (ESPN might have different shade)
    secondary: '#FFFFFF',
    accent: '#231F20',
  },
  // Add more as needed
};
```

**Benefits:**

- Single source of truth (database/ESPN)
- Easy to update when ESPN changes team colors
- Minimal hardcoding (only overrides)
- Scalable for future teams/conferences

---

## Tailwind & DaisyUI Configuration

### Compatibility Research

**Finding:** DaisyUI requires a `tailwind.config.js` file and is not fully compatible with Tailwind CSS 4's CSS-based configuration (`@theme inline` syntax). DaisyUI is designed to work with Tailwind CSS 3.x's JavaScript configuration approach.

**Decision:**

- **Downgrade to Tailwind CSS 3.x** for DaisyUI compatibility
- Use traditional `tailwind.config.js` file (not CSS-based config)
- DaisyUI plugin integration via `tailwind.config.js`

**Rationale:**

- DaisyUI provides significant value with pre-built components
- Tailwind 3.x is stable and well-supported
- Can upgrade to Tailwind 4 later if/when DaisyUI adds support

### Configuration Files

**tailwind.config.js** (required for DaisyUI):

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      'light', // DaisyUI default (light mode base)
      'dark', // DaisyUI default (dark mode base)
      'sec', // Custom SEC theme (Phase 0)
      // Team themes will be added dynamically in Phase 5
    ],
  },
};
```

**Theme Architecture:**

- **Light/Dark Mode:** Controls `base-100`, `base-200`, `base-300`, `base-content` (backgrounds and text)
- **Team Selection:** Controls `primary`, `secondary`, `accent` (team colors for buttons, highlights, etc.)
- **Independent:** User can select team colors + light/dark mode independently
- **Base colors:** Mild, readable colors that don't use team colors

**postcss.config.mjs** (update for Tailwind 3):

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

**app/globals.css** (update):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Light/Dark Mode Base Colors (independent of team selection) */
/* These control backgrounds and text - mild, readable colors */
/* Applied via data-mode attribute, works with any team theme */
html[data-mode='light'],
html:not([data-mode]) {
  /* Light mode base colors (default) */
  --color-base-100: #ffffff; /* Main background */
  --color-base-200: #f5f5f5; /* Secondary background */
  --color-base-300: #e5e5e5; /* Tertiary background */
  --color-base-content: #1f2937; /* Main text color (dark gray) */
}

html[data-mode='dark'] {
  /* Dark mode base colors */
  --color-base-100: #1a1a1a; /* Main background (dark) */
  --color-base-200: #2d2d2d; /* Secondary background */
  --color-base-300: #404040; /* Tertiary background */
  --color-base-content: #f5f5f5; /* Main text color (light) */
}

/* SEC Default Theme - Team Colors Only */
/* Background/text controlled by light/dark mode above */
[data-theme='sec'] {
  --color-primary: #004b8d; /* SEC Blue - Pantone PMS 2945 XGC */
  --color-primary-content: #ffffff;
  --color-secondary: #ffd046; /* SEC Gold - Pantone PMS 7404 U */
  --color-secondary-content: #000000;
  --color-accent: #ffffff;
  --color-accent-content: #000000;
}

/* Team themes will be dynamically injected in Phase 5 from database */
/* Each team theme only defines primary, secondary, accent colors */
/* Base colors inherited from light/dark mode */
```

---

## Phased Implementation

### PHASE 0: Config & Setup

**Scope:** Install DaisyUI, configure Tailwind, create TypeScript types, set up team color themes

**Dependencies:** None (first phase)

**⚠️ CRITICAL BACKEND FIXES REQUIRED (Blocking Issue):**

- **Fix #1:** Update `lib/api-types.ts` - Add `color` and `alternateColor` to `TeamMetadata` interface
- **Fix #2:** Update `app/api/games/route.ts` - Return colors in API response (line 125 query, lines 143-151 mapping)
- **Impact:** Database has colors, but API doesn't expose them. Phase 0 cannot complete without these fixes.

**Files to Create/Modify:**

- `package.json` (downgrade Tailwind to 3.x, add DaisyUI)
- `tailwind.config.js` (new - required for DaisyUI)
- `postcss.config.mjs` (update for Tailwind 3)
- `app/globals.css` (add SEC default theme only - team themes in Phase 5)
- `types/frontend.ts` (new - frontend type definitions)
- `app/layout.tsx` (update to initialize SEC theme from localStorage)
- `lib/api-types.ts` (CRITICAL FIX: add colors to TeamMetadata)
- `app/api/games/route.ts` (CRITICAL FIX: return colors in response)

**Configuration Steps:**

```bash
npm install daisyui@latest
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

**Type Definitions:**

- Create `types/frontend.ts` with all frontend types (see Type System section)
- Re-export relevant types from `lib/api-types.ts`

**Critical API Fixes (REQUIRED - See Above):**

1. **CRITICAL FIX: Update `TeamMetadata` interface in `lib/api-types.ts`:**

   ```typescript
   export interface TeamMetadata {
     id: string;
     abbrev: string;
     displayName: string;
     logo: string;
     color: string; // ADD THIS
     alternateColor: string; // ADD THIS
   }
   ```

2. **CRITICAL FIX: Update `/api/games` endpoint in `app/api/games/route.ts`:**
   - **Line 125:** Change query from `.select("_id abbreviation displayName logo")` to `.select("_id abbreviation displayName logo color alternateColor")`
   - **Lines 143-151:** Update mapping to include:
     ```typescript
     color: team.color,
     alternateColor: team.alternateColor,
     ```
   - **Note:** Database already has all color data - no reseed required

**Backend Verification:**
After fixes, verify with:

```bash
curl http://localhost:3000/api/games?season=2025&conferenceId=8 | jq '.teams[0]'
# Should include: "color": "...", "alternateColor": "..."
```

**Theme Strategy - Phased Approach:**

**Phase 0 (Current):** Hardcode SEC default theme only

- Simple, reliable, gets us started
- SEC theme defined in CSS
- No team themes yet

**Phase 5 (Future):** Dynamic team themes from database

- Will implement dynamic CSS injection from `/api/teams`
- Team list and colors from database
- Full scalability for future conferences
- Discussion tabled until Phase 5 implementation

**Phase 0 Theme Implementation:**

```typescript
// app/layout.tsx - Simple theme initialization
'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load saved team theme or default to SEC
    const savedTeam = localStorage.getItem('sec-tiebreaker-theme') || 'sec';

    // Load saved mode or default to light
    const savedMode = localStorage.getItem('sec-tiebreaker-mode') || 'light';

    // Apply both: team colors + light/dark mode
    // data-theme controls primary/secondary/accent (team colors)
    // data-mode controls base-100/base-content (backgrounds/text)
    document.documentElement.setAttribute('data-theme', savedTeam);
    document.documentElement.setAttribute('data-mode', savedMode);
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Theme Strategy:**

- **Team colors (primary/secondary/accent):** Controlled by `data-theme` attribute
- **Base colors (background/text):** Controlled by light/dark mode
- **Storage:** Two localStorage keys: `sec-tiebreaker-theme` (team) and `sec-tiebreaker-mode` (light/dark)
- **Phase 0:** Only SEC theme + light mode. Team themes and mode toggle in Phase 5.

**Implementation Checklist:**

- [ ] Downgrade Tailwind to 3.x
- [ ] Install DaisyUI
- [ ] Create `tailwind.config.js` with DaisyUI plugin
- [ ] Update `postcss.config.mjs`
- [ ] Add SEC default theme to `globals.css` (only SEC theme for Phase 0)
- [ ] Update `lib/api-types.ts`:
  - [ ] Add `color` and `alternateColor` to `TeamMetadata` interface
  - [ ] Create `TeamsResponse` interface for `/api/teams` endpoint
- [ ] Update `/api/games` endpoint:
  - [ ] Add `color alternateColor` to query select
  - [ ] Include colors in `TeamMetadata` mapping
- [ ] Create `/api/teams` endpoint (new) - **Deferred to Phase 5**
- [ ] Create `types/frontend.ts` with frontend types
- [ ] Update `app/layout.tsx` to initialize SEC theme from localStorage (useEffect)
- [ ] Test SEC theme works and persists
- [ ] **Note:** Team themes and dynamic injection deferred to Phase 5
- [ ] Test localStorage persistence

**Manual Testing:**

1. Run `npm run dev`
2. Check browser console for errors
3. Test `/api/games` endpoint includes colors:

   ```bash
   curl http://localhost:3000/api/games?season=2025&conferenceId=8
   ```

   - Check `teams` array - each team should have `color` and `alternateColor`

4. Inspect `<html>` element - should have `data-theme="sec"`
5. Verify SEC theme colors are applied (blue primary, gold secondary)
6. Check localStorage has `sec-tiebreaker-theme` key with value "sec"
7. Refresh page - SEC theme should persist
8. **Note:** Team theme selector testing deferred to Phase 5

**Known Gotchas:**

- Tailwind 3 requires `tailwind.config.js` (not CSS-based like Tailwind 4)
- DaisyUI themes must be defined in both `tailwind.config.js` and CSS
- Theme switching requires `data-theme` on `<html>` element
- localStorage may be unavailable in SSR - handle gracefully
- Team colors from ESPN may not match official brand colors - use overrides file
- **Static CSS approach:** All themes defined in CSS at build time, API data only for dropdown
- **ESPN color format is hex WITHOUT `#` prefix** (e.g., `"ba0c2f"` not `"#ba0c2f"`) - add `#` prefix in CSS
- Database already has all color data - verified: all 16 teams have both `color` and `alternateColor` stored
- DaisyUI themes array in `tailwind.config.js` registers themes, CSS defines actual colors
- **Phase 0:** Only SEC theme implemented. Simple `data-theme` initialization in layout.
- **Phase 5:** Will implement dynamic team themes from database (discussion tabled until then)
- `/api/teams` endpoint deferred to Phase 5

---

### PHASE 1: Basic Layout & Navigation

**Scope:** Create root layout shell with header, navigation, and footer using DaisyUI components

**Dependencies:** Phase 0 (DaisyUI installed, themes configured)

**Files to Create/Modify:**

- `app/components/Header.tsx` (new)
- `app/components/Navigation.tsx` (new)
- `app/components/Footer.tsx` (new)
- `app/layout.tsx` (update to use Header/Footer)

**Component Definitions:**

```typescript
// app/components/Header.tsx
// Uses DaisyUI navbar component
// Props: none
// Displays: app title, theme selector placeholder

// app/components/Navigation.tsx
// Uses DaisyUI menu component
// Props: none (single page app for now)
// Displays: placeholder for future navigation

// app/components/Footer.tsx
// Uses DaisyUI footer component
// Props: none
// Displays: copyright, season info
```

**Implementation Checklist:**

- [ ] Create Header with DaisyUI navbar
- [ ] Create Navigation component (placeholder for future)
- [ ] Create Footer with DaisyUI footer
- [ ] Update `app/layout.tsx` to wrap children
- [ ] Apply semantic DaisyUI colors (not hardcoded)
- [ ] Add responsive classes
- [ ] Ensure theme colors apply via `data-theme`

**Manual Testing:**

1. Run `npm run dev`
2. Verify Header at top, Footer at bottom
3. Switch theme - colors should update
4. Test responsive layout
5. Verify no console errors

---

### PHASE 2: Games List & Filtering

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

---

### PHASE 3: Game Overrides & Score Inputs

**Scope:** Allow users to input custom game scores with validation, persist valid overrides to localStorage, reset to live

**Dependencies:** Phase 2 (games displayed)

**Files to Create/Modify:**

- `app/components/GameCard.tsx` (update to include score inputs)
- `app/components/ScoreInputs.tsx` (new - React Hook Form component)
- `app/hooks/useGameOverrides.ts` (new - manage localStorage)
- `app/page.tsx` (update overrides handling and reset button)

**Override Behavior:**

- Two score input fields per game (home and away)
- Inputs prefilled with `predictedScore` (guaranteed valid default)
- User can simulate immediately without entering any values
- Validation on form submission: no ties, non-negative, whole numbers only
- Only valid overrides persisted to localStorage
- Override format: `{ [gameEspnId]: { homeScore: number, awayScore: number } }`
- Reset to Live: fetches fresh data, clears overrides, refills with new predicted scores

**Validation Rules:**

- No tie scores: `homeScore !== awayScore`
- Non-negative: `homeScore >= 0 && awayScore >= 0`
- Whole numbers: `Number.isInteger(homeScore) && Number.isInteger(awayScore)`
- Any positive integer allowed (no max cap)

**Component Definitions:**

```typescript
// app/components/ScoreInputs.tsx
// Uses React Hook Form for validation
// Props: game (FrontendGame), currentOverride, onOverride callback
// Renders:
//   - Home team label + logo + score input (prefilled with predictedScore.home)
//   - Away team label + logo + score input (prefilled with predictedScore.away)
//   - Error messages below inputs (if validation fails)
// Validation: no ties, non-negative, whole numbers only
// On submit: validate → persist if valid → error display if invalid

// app/hooks/useGameOverrides.ts
// State: overrides map from localStorage
// Methods:
//   - addOverride(gameEspnId, homeScore, awayScore) - validates before storing
//   - removeOverride(gameEspnId)
//   - clearAllOverrides()
//   - getOverride(gameEspnId)
//   - resetToLive() - fetches live data, clears overrides, refills forms
// Only stores valid scores (validated before storage)
// Reads/writes from localStorage key "sec-tiebreaker-overrides-{season}"
```

**Implementation Checklist:**

- [ ] Install React Hook Form: `npm install react-hook-form`
- [ ] Create `ScoreInputs.tsx` component with React Hook Form validation
- [ ] Prefill inputs with `game.predictedScore` values
- [ ] Implement validation: no ties, non-negative, whole numbers only
- [ ] Display error messages below failing inputs
- [ ] Prevent form submission if validation fails
- [ ] Create `useGameOverrides` hook to manage localStorage
- [ ] Only store valid overrides (validate before storing)
- [ ] Update GameCard to include ScoreInputs
- [ ] Add "Reset to Live" button (prominent location)
- [ ] Implement reset to live: fetch fresh data, clear overrides, update form inputs
- [ ] Add loading state during reset fetch
- [ ] Show which games have overrides (visual indication)
- [ ] Handle localStorage edge cases (corruption, invalid state)

**Manual Testing:**

1. Run `npm run dev`
2. Load games - all score inputs prefilled with predictedScore
3. Click simulate without any changes - should work (all games valid)
4. Edit a score to create an override - input accepts positive integers
5. Try invalid input (negative, tie, decimal):
   - Should show error message
   - Should not store to localStorage
   - Should not allow simulation
6. Fix input - error clears, can now simulate
7. Refresh page - valid overrides persist from localStorage
8. Click "Reset to Live":
   - Should show loading indicator
   - Should fetch fresh data
   - Scores should update with new predicted values
   - All overrides cleared
   - localStorage should be empty
9. Test multiple games - each tracks overrides independently

**Known Gotchas:**

- Override keys use `game.espnId` (ESPN ID, always available, primary identifier)
- NOT MongoDB `_id` - this matches backend `applyOverrides()` function
- `predictedScore` always present in game data (guaranteed by database)
- Only valid overrides stored (invalid state never persists)
- Validation happens on form submission (not real-time keystroke)
- localStorage key includes season: `sec-tiebreaker-overrides-{season}`
- Future: React Toast for error/success messages (Phase 4+ implementation)

---

### PHASE 4: Simulation & Standings Display

**Scope:** Fetch tiebreaker results from API, display standings table with tiebreaker explanations

**Dependencies:** Phase 3 (overrides working)

**Files to Create/Modify:**

- `app/components/SimulateButton.tsx` (new)
- `app/components/StandingsTable.tsx` (new)
- `app/components/StandingRow.tsx` (new)
- `app/components/TieBreakerExplainer.tsx` (new)
- `app/hooks/useSimulate.ts` (new)
- `app/page.tsx` (update to show standings after simulate)

**API Integration:**

```typescript
// app/hooks/useSimulate.ts
export function useSimulate() {
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [tieLogs, setTieLogs] = useState<TieLog[]>([]);
  const [championship, setChampionship] = useState<[string, string] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulate = async (season: number, conferenceId: string, overrides: UserOverrides) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, conferenceId, overrides }),
      });
      const data: SimulateResponse = await response.json();
      setStandings(data.standings);
      setTieLogs(data.tieLogs);
      setChampionship(data.championship);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return { standings, tieLogs, championship, loading, error, simulate };
}
```

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

- [ ] Create `useSimulate` hook to POST to `/api/simulate`
- [ ] Create SimulateButton component with loading state
- [ ] Create StandingsTable using DaisyUI table component
- [ ] Create StandingRow to display team standings
- [ ] Create TieBreakerExplainer to show tiebreaker details
- [ ] Highlight championship matchup (top 2 teams) with different styling
- [ ] Add error handling (API errors, invalid overrides)
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

---

### PHASE 5: Team Theme Selector

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
3. Click selector - should show dropdown with all 16 teams + "SEC Default"
4. Select "Alabama" - page colors change to Alabama theme
5. Select different team - colors change immediately
6. Check localStorage - key should show selected team
7. Refresh page - selected theme should persist
8. Test all 16 teams - each should have distinct colors
9. Verify championship highlighting works with each theme
10. Test game override buttons - should show in theme colors
11. Test standings table - all text readable with chosen theme

**Known Gotchas:**

- Team abbreviations must match `data-theme` values exactly
- Some team color combinations may have poor contrast - test readability
- Dropdown should show current selection as selected option
- Add alt text for accessibility

---

## Build & Deployment

### Local Development

```bash
npm run dev          # Start dev server
npm run lint         # Run ESLint
npm run build        # Build for production (includes type check)
```

### Pre-commit

- Husky hooks run ESLint and TypeScript checks
- All files must pass strict TypeScript checking
- No `any` types allowed

### Environment Variables

- None required for frontend (backend URLs are relative)

### Deployment

- Push to `develop` branch → auto-deploys to staging
- Merge to `main` branch → auto-deploys to production
- Vercel handles build and deployment

---

## Workflow Expectations

1. **Generate Plan** ✅ (this document)
2. **User Reviews Plan** (current step)
3. **User Approves** → "Start Phase 0"
4. **Implement Phase 0** → Commit → Pause → Request Testing
5. **User Tests** → "works as expected" or feedback
6. **If Feedback:** Iterate. **If Working:** "Ready for Phase 1?"
7. **Repeat Steps 3-6** for each phase

**After Each Implementation:**

- Write clean, typed code (no shortcuts)
- Create one commit per phase
- Commit message format: `feat: Phase X - [feature name]`
- Pause explicitly and request testing
- Wait for user feedback before next phase

---

## Important Constraints

1. **Plan before code** - This plan must be approved before implementation
2. **DaisyUI is foundational** - Phase 0 MUST be complete before Phase 1
3. **One feature per phase** - No combining features across phases
4. **Code → Commit → Pause → Test → Wait** - Workflow for each phase
5. **TypeScript strict** - Every prop, return type, localStorage value must be typed
6. **Small commits** - Each phase = one small, reviewable commit
7. **DaisyUI best practices** - Use semantic colors, checkbox accordions, theme switching
8. **No assumptions** - All decisions documented in this plan

---

## Scalability Considerations

**Future Expansion:**

- Structure supports multiple sports/conferences
- Component organization allows for route-specific components
- Type system can be extended for new sports
- Theme system can add conference-specific themes

**Current Scope:**

- Single page application (SEC Football only)
- Standings on same page as games
- No routing needed initially

**Future Enhancements:**

- Add routing for different sports/conferences
- Separate pages for games vs standings
- WebSocket/SSE for real-time updates
- Multi-conference support
