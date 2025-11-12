# Frontend Development Plan

**Project:** SEC Tiebreaker UI
**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, DaisyUI
**Status:** Planning Phase - **⚠️ AUDIT COMPLETED - See critical fixes below**

---

## ⚠️ CRITICAL: Phase 0 Requires Backend Fixes

**Before starting Phase 0 implementation, two critical backend fixes MUST be completed:**

1. **Update `lib/api-types.ts`** - Add `color` and `alternateColor` to `TeamMetadata` interface
2. **Update `app/api/games/route.ts`** - Return colors in `/api/games` response (lines 125 & 143-151)

**Why?** Database has colors, but API doesn't expose them. Without these fixes, phases 0-5 cannot complete.

**Details:** See [phase0.md](./phase0.md) - "CRITICAL: API Fixes Required Before Implementation"

**Full Audit Report:** [AUDIT_REPORT.md](../../AUDIT_REPORT.md)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Type System](#type-system)
3. [Theme System Architecture](#theme-system-architecture)
4. [Tailwind & DaisyUI Configuration](#tailwind--daisyui-configuration)
5. [Phased Implementation](#phased-implementation)
6. [Build & Deployment](#build--deployment)
7. [Workflow Expectations](#workflow-expectations)
8. [Important Constraints](#important-constraints)
9. [Scalability Considerations](#scalability-considerations)

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
│   ├── OverrideButtons.tsx
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
│   ├── GamesList
│   │   └── WeekAccordion[] (multiple can be open)
│   │       └── GameCard[]
│   │           └── OverrideButtons
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

import { GameLean, TeamLean } from "@/lib/types";
import { GamesResponse, SimulateResponse, StandingEntry, TieLog } from "@/lib/api-types";

// Re-export API types for convenience
export type { GamesResponse, SimulateResponse, StandingEntry, TieLog };

// Frontend game type (based on GameLean but with guaranteed optional fields handled)
export interface FrontendGame extends Omit<GameLean, 'home' | 'away'> {
  home: {
    teamEspnId: string;
    abbrev: string;
    displayName: string;  // Guaranteed by API response teams metadata
    logo: string;         // Guaranteed by API response teams metadata
    color: string;         // Guaranteed by API response teams metadata
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
[data-theme="sec"] {
  --color-primary: #004B8D;        /* SEC Blue - Official Brand Color */
  --color-primary-content: #ffffff;
  --color-secondary: #FFD046;     /* SEC Gold - Official Brand Color */
  --color-secondary-content: #000000;
  --color-accent: #ffffff;
  --color-accent-content: #000000;
}

[data-theme="alabama"] {
  --color-primary: #A00000;        /* Crimson */
  --color-primary-content: #ffffff;
  --color-secondary: #FFFFFF;      /* White */
  --color-secondary-content: #000000;
  --color-accent: #231F20;         /* Black */
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
export const themeOverrides: Record<string, {
  primary: string;
  secondary: string;
  accent: string;
}> = {
  // Only override teams where ESPN colors don't match official brand
  "333": { // Alabama
    primary: "#A00000",  // Crimson (ESPN might have different shade)
    secondary: "#FFFFFF",
    accent: "#231F20",
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
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "light",  // DaisyUI default (light mode base)
      "dark",   // DaisyUI default (dark mode base)
      "sec",    // Custom SEC theme (Phase 0)
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
html[data-mode="light"],
html:not([data-mode]) {
  /* Light mode base colors (default) */
  --color-base-100: #ffffff;        /* Main background */
  --color-base-200: #f5f5f5;        /* Secondary background */
  --color-base-300: #e5e5e5;        /* Tertiary background */
  --color-base-content: #1f2937;    /* Main text color (dark gray) */
}

html[data-mode="dark"] {
  /* Dark mode base colors */
  --color-base-100: #1a1a1a;        /* Main background (dark) */
  --color-base-200: #2d2d2d;        /* Secondary background */
  --color-base-300: #404040;        /* Tertiary background */
  --color-base-content: #f5f5f5;     /* Main text color (light) */
}

/* SEC Default Theme - Team Colors Only */
/* Background/text controlled by light/dark mode above */
[data-theme="sec"] {
  --color-primary: #004B8D;          /* SEC Blue - Pantone PMS 2945 XGC */
  --color-primary-content: #ffffff;
  --color-secondary: #FFD046;       /* SEC Gold - Pantone PMS 7404 U */
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

See individual phase files:
- [Phase 0: Config & Setup](./phase0.md)
- [Phase 1: Basic Layout & Navigation](./phase1.md)
- [Phase 2: Games List & Filtering](./phase2.md)
- [Phase 3: Game Overrides](./phase3.md)
- [Phase 4: Simulation & Standings Display](./phase4.md)
- [Phase 5: Team Theme Selector](./phase5.md)

---

## Development Progress

**Last Updated:** [Date will be updated as work progresses]

### Overall Status

- [ ] Phase 0: Config & Setup
- [ ] Phase 1: Basic Layout & Navigation
- [ ] Phase 2: Games List & Filtering
- [ ] Phase 3: Game Overrides
- [ ] Phase 4: Simulation & Standings Display
- [ ] Phase 5: Team Theme Selector

### Phase 0: Config & Setup

**Status:** Not Started  
**See:** [phase0.md](./phase0.md)

**Key Milestones:**
- [ ] Tailwind 3.x + DaisyUI installed
- [ ] SEC theme configured in CSS
- [ ] Frontend types created
- [ ] `/api/games` returns team colors
- [ ] Theme initialization working in layout

### Phase 1: Basic Layout & Navigation

**Status:** Not Started  
**See:** [phase1.md](./phase1.md)

**Key Milestones:**
- [ ] Header component created
- [ ] Footer component created
- [ ] Navigation placeholder created
- [ ] Layout wraps all pages

### Phase 2: Games List & Filtering

**Status:** Not Started  
**See:** [phase2.md](./phase2.md)

**Key Milestones:**
- [ ] `useGames` hook implemented
- [ ] GamesList component displays games
- [ ] WeekAccordion with independent collapse
- [ ] GamesFilter toggle working
- [ ] Games display with team logos/names

### Phase 3: Game Overrides

**Status:** Not Started  
**See:** [phase3.md](./phase3.md)

**Key Milestones:**
- [ ] `useGameOverrides` hook implemented
- [ ] OverrideButtons component created
- [ ] Overrides persist to localStorage
- [ ] "Reset to Live" button working
- [ ] Visual indication of overridden games

### Phase 4: Simulation & Standings Display

**Status:** Not Started  
**See:** [phase4.md](./phase4.md)

**Key Milestones:**
- [ ] `useSimulate` hook implemented
- [ ] SimulateButton component created
- [ ] StandingsTable displays results
- [ ] TieBreakerExplainer shows details
- [ ] Championship highlighting works

### Phase 5: Team Theme Selector

**Status:** Not Started  
**See:** [phase5.md](./phase5.md)

**Key Milestones:**
- [ ] `/api/teams` endpoint created
- [ ] Dynamic CSS injection implemented
- [ ] TeamThemeSelector component created
- [ ] Theme switching works
- [ ] Light/dark mode toggle (if implemented)

### Notes

- Update this section after completing each phase
- Mark phases as complete when all checklist items are done and tested
- Add any blockers or issues encountered

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

