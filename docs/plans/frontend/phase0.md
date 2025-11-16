# Phase 0: Config & Setup

**Scope:** Install DaisyUI, configure Tailwind, create TypeScript types, set up team color themes

**Dependencies:** None (first phase)

---

## ⚠️ CRITICAL: API Fixes Required Before Implementation

**Status:** Phase 0 plan has been updated to match actual API specification. Two critical backend fixes are REQUIRED before starting Phase 0 implementation.

**Related Documentation:**
- [API Reference](../../guides/api-reference.md) - Current API endpoint documentation

### Fix #1: Update `TeamMetadata` Type (lib/api-types.ts)

**Current State:** `TeamMetadata` interface is missing `color` and `alternateColor` fields
**Required Action:** Add these two fields to the interface (they exist in database, just not exposed in API)
**Impact:** Blocks Phases 2, 3, 4, and 5 if not fixed

### Fix #2: Update `/api/games` Endpoint (app/api/games/route.ts)

**Current State:** API query doesn't select or return `color`/`alternateColor`
**Required Action:** Update line 125 query and lines 143-151 mapping (detailed in Implementation section)
**Impact:** Frontend can't get team colors even if type is fixed

**Why Both Fixes Required:**

- Database ✅ has colors
- Mongoose schema ✅ includes colors
- API type definition ❌ doesn't expose colors
- API endpoint ❌ doesn't return colors
- Result: Colors can't reach frontend

**Status After Planning:**
These fixes are now documented in the Implementation Checklist below (marked as CRITICAL).

---

**Files to Create/Modify:**

- `package.json` (downgrade Tailwind to 3.x, add DaisyUI)
- `tailwind.config.js` (new - required for DaisyUI)
- `postcss.config.mjs` (update for Tailwind 3)
- `app/globals.css` (add SEC default theme only - team themes in Phase 5)
- `types/frontend.ts` (new - frontend type definitions)
- `app/config/theme-config.ts` (new - conference-to-theme mapping for multi-conference support)
- `app/layout.tsx` (update to initialize SEC theme from localStorage)
- `lib/api-types.ts` (CRITICAL FIX: add `color` and `alternateColor` to `TeamMetadata`)
- `app/api/games/route.ts` (CRITICAL FIX: update query and mapping to include colors)

**Configuration Steps:**

```bash
npm install daisyui@latest
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

**Conference Theme Configuration (Future-Proofing):**

Create a configuration file that maps conference IDs to their default themes. This enables multi-conference support without code changes later:

```typescript
// app/config/theme-config.ts
export const conferenceThemes: Record<
  string,
  {
    defaultTheme: string;
    name: string;
  }
> = {
  '8': {
    defaultTheme: 'sec',
    name: 'SEC',
  },
  // Add more conferences as they're implemented
  // '25': { defaultTheme: 'acc', name: 'ACC' },
  // '12': { defaultTheme: 'big12', name: 'Big 12' },
};
```

**Type Definitions:**

- Create `types/frontend.ts` with all frontend types (see README Type System section)
- Re-export relevant types from `lib/api-types.ts`

**Critical API Fixes (BLOCKING - Must Complete):**

1. **Fix `TeamMetadata` interface in `lib/api-types.ts`:**

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

   - These fields are already in the database schema
   - Phases 2-5 depend on these being available in API response

2. **Fix `/api/games` endpoint in `app/api/games/route.ts`:**
   - **Line 125:** Change `.select("_id abbreviation displayName logo")` to `.select("_id abbreviation displayName logo color alternateColor")`
   - **Lines 143-151:** Update the `TeamMetadata` mapping to include the new fields:
     ```typescript
     const teamMap: Record<string, TeamMetadata> = {};
     for (const team of teams) {
       teamMap[team._id] = {
         id: team._id,
         abbrev: team.abbreviation,
         displayName: team.displayName,
         logo: team.logo,
         color: team.color, // ADD THIS
         alternateColor: team.alternateColor, // ADD THIS
       };
     }
     ```
   - **Note:** Database already has all color data - no reseed required

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

**STEP 1: CRITICAL BACKEND FIXES (COMPLETE - API TESTED & VERIFIED):**

- [x] **CRITICAL:** Update `lib/api-types.ts` - Add `color` and `alternateColor` to `TeamMetadata` interface
  - Completed: Both fields added to interface
  - Tested: 16 teams seeded, API returns all color data
- [x] **CRITICAL:** Update `app/api/games/route.ts` line 125 - Add color/alternateColor to select query
  - Completed: Query updated to include color fields
  - Tested: `/api/games` endpoint returns colors
- [x] **CRITICAL:** Update `app/api/games/route.ts` lines 143-151 - Include colors in TeamMetadata mapping
  - Completed: TeamMetadata mapping includes color fields
  - Tested: Response structure matches TeamMetadata type definition
- [x] **Verify:** Test `/api/games` endpoint includes colors in response
  - Verified: Color fields present and match database values
  - Verified: StandingEntry type also includes color field in simulate endpoint

**STEP 2: Frontend Configuration & Setup (COMPLETE):**

- [x] Downgrade Tailwind to 3.x and install DaisyUI
  - Completed: Tailwind 3.4.18, DaisyUI 5.5.0 installed
  - Verified: Build compiles successfully with DaisyUI components
- [x] Create `tailwind.config.mjs` with DaisyUI plugin
  - Completed: ES module configuration with DaisyUI themes
- [x] Update `postcss.config.mjs`
  - Completed: Updated to use tailwindcss plugin
- [x] Updated `app/globals.css`
  - Completed: Added @tailwind directives for Tailwind 3

**STEP 3: Type System & Frontend (COMPLETE):**

- [x] Create `types/frontend.ts` with frontend types
  - Completed: GameFromResponse, UserOverrides, SECTeam, ThemeConfig, ConferenceThemes types
- [x] Create `app/config/theme-config.ts` with conference theme mapping
  - Completed: SEC conference mapped to 'light' theme, extensible for future conferences
- [x] Update `app/layout.tsx` to initialize theme
  - Completed: Added ThemeInitializer component, metadata updated, data-theme attribute set

**STEP 4: Verification & Testing (COMPLETE):**

- [x] Build verification
  - Completed: `npm run build` successful with DaisyUI components
- [x] Theme initialization component working
  - Completed: ThemeInitializer properly reads/sets data-theme attribute
- [x] DaisyUI components render correctly
  - Verified: Cards, buttons, alerts displaying correctly on page.tsx

**Manual Testing:**

1. Run `npm run dev`
2. Check browser console for errors
3. **Test CRITICAL FIX - Colors in API response:**

   ```bash
   curl http://localhost:3000/api/games?season=2025&conferenceId=8 | jq '.teams[0]'
   ```

   - ✅ Response should include `color` and `alternateColor` fields
   - ✅ Example: `{ "id": "333", "abbrev": "ALA", "displayName": "Alabama Crimson Tide", "logo": "...", "color": "ba0c2f", "alternateColor": "ffffff" }`
   - ❌ If missing, the critical fixes were not applied correctly

4. Inspect `<html>` element in DevTools:
   - Should have `data-theme="sec"`
   - Should have `data-mode="light"`
5. Verify SEC theme colors are applied:
   - Primary color: SEC Blue (`#004B8D`)
   - Secondary color: SEC Gold (`#FFD046`)
6. Check localStorage (DevTools → Application → Storage → Local Storage):
   - Key `sec-tiebreaker-theme` should have value `"sec"`
   - Key `sec-tiebreaker-mode` should have value `"light"`
7. Refresh page - SEC theme and mode should persist
8. ✅ Phase 0 complete when all tests pass

**Known Gotchas & Important Notes:**

_API/Database:_

- Database already has all color data - verified: all 16 teams have both `color` and `alternateColor` stored
- **ESPN color format is hex WITHOUT `#` prefix** (e.g., `"ba0c2f"` not `"#ba0c2f"`) - add `#` prefix when using in CSS
- Current Team schema: Uses `color` and `alternateColor` fields (NO UNDERSCORE)
- Mongoose team query returns fields as: `color` and `alternateColor` (not prefixed)

_Frontend/CSS:_

- Tailwind 3 requires `tailwind.config.js` (not CSS-based like Tailwind 4)
- DaisyUI themes must be defined in both `tailwind.config.js` and CSS
- Theme switching requires `data-theme` on `<html>` element
- localStorage may be unavailable in SSR - handle gracefully

_Phase Scope:_

- **Phase 0 Goal:** Static SEC theme only. Do NOT implement dynamic team themes in Phase 0
- **Phase 0 API:** Only adds colors to existing `/api/games` response
- **Phase 0:** Does NOT create `/api/teams` endpoint (that's Phase 5)
- **Phase 5:** Will implement dynamic team themes from database using `/api/teams`

_What Phase 2 Needs:_

- Phase 2 (Games List) depends on colors being in `/api/games` response
- Once Phase 0 fixes are complete, Phase 2 can fetch and use colors automatically

_Multi-Conference Support:_

- **Phase 0 creates the foundation:** `app/config/theme-config.ts` with conference mapping
- **Phase 0 only implements SEC:** Default theme hardcoded to 'sec'
- **Future (when routing added):** Will read conferenceId from URL and use `conferenceThemes` map to set default
- **localStorage persists user preference:** If user selects Alabama theme in SEC section, then visits ACC section, their Alabama choice is saved (independent of conference default)
- **No code changes needed later:** Just add new conferences to `theme-config.ts` and implement route parameter reading
