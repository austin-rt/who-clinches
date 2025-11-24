# Phase 0: Config & Setup

**Scope:** Install DaisyUI, configure Tailwind, create TypeScript types, set up team color themes

**Dependencies:** None (first phase)

---

## Critical API Fixes (Completed)

Two backend fixes were required before implementation:

### Fix #1: Update `TeamMetadata` Type
**File:** `lib/api-types.ts`  
**Action:** Added `color` and `alternateColor` fields to `TeamMetadata` interface  
**Impact:** Required for Phases 2-5

### Fix #2: Update `/api/games` Endpoint
**File:** `app/api/games/route.ts`  
**Action:** Updated query to select color fields and included them in TeamMetadata mapping  
**Impact:** Frontend can access team colors from API

**Status:** ✅ Both fixes completed and verified

---

## Files Created/Modified

- `package.json` - Tailwind 3.x, DaisyUI
- `tailwind.config.mjs` - DaisyUI configuration
- `postcss.config.mjs` - Tailwind 3 setup
- `app/globals.css` - SEC default theme
- `types/frontend.ts` - Frontend type definitions
- `app/config/theme-config.ts` - Conference theme mapping
- `app/layout.tsx` - Theme initialization
- `lib/api-types.ts` - Added color fields to TeamMetadata
- `app/api/games/route.ts` - Added color fields to response

---

## Implementation Summary

**STEP 1: Critical Backend Fixes** ✅
- Updated `TeamMetadata` interface with color fields
- Updated `/api/games` endpoint to return colors
- Verified API response includes color data

**STEP 2: Frontend Configuration** ✅
- Installed Tailwind 3.4.18 and DaisyUI 5.5.0
- Created Tailwind and PostCSS configs
- Updated global CSS

**STEP 3: Type System** ✅
- Created `types/frontend.ts` with frontend types
- Created `app/config/theme-config.ts` for conference themes
- Updated layout with theme initialization

**STEP 4: Verification** ✅
- Build successful
- Theme initialization working
- DaisyUI components rendering correctly

---

## Theme Strategy

**Phase 0:** Hardcoded SEC default theme only  
**Phase 5:** Dynamic team themes from database

**Storage:** Two localStorage keys:
- `sec-tiebreaker-theme` - Team theme (default: 'sec')
- `sec-tiebreaker-mode` - Light/dark mode (default: 'light')

**Theme Attributes:**
- `data-theme` - Controls primary/secondary/accent (team colors)
- `data-mode` - Controls base-100/base-content (backgrounds/text)

---

## Important Notes

**ESPN Color Format:** Hex WITHOUT `#` prefix (e.g., `"ba0c2f"`). Add `#` when using in CSS.

**Database:** All 16 teams have `color` and `alternateColor` stored. No reseed required.

**Phase Scope:** Phase 0 implements static SEC theme only. Dynamic team themes deferred to Phase 5.

**Multi-Conference:** `theme-config.ts` provides foundation for future conference support.

---

## Verification

**API Test:**
```bash
curl http://localhost:3000/api/games?season=2025&conferenceId=8 | jq '.teams[0]'
```

**Expected:** Response includes `color` and `alternateColor` fields.

**Browser Check:**
- `<html>` element has `data-theme="sec"` and `data-mode="light"`
- localStorage contains theme preferences
- SEC theme colors applied (Primary: SEC Blue `#004B8D`, Secondary: SEC Gold `#FFD046`)

**Status:** ✅ Phase 0 complete
