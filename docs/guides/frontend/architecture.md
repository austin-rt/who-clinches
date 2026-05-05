# Frontend Architecture

Tech stack and project structure for the frontend application.

**Related Documentation:**

- [Frontend Index](./index.md) - Frontend documentation overview
- [AI Guide](../../ai-guide.md) - Development patterns and principles

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + DaisyUI components
- **State Management**: Redux Toolkit (RTK) + RTK Query
- **Icons**: React Icons

---

## File Structure

- `app/[sport]/[conf]/page.tsx` - Conference simulation page (main interactive view)
- `app/results/[id]/page.tsx` - Shareable results page (read-only snapshot)
- `app/results/[id]/opengraph-image.tsx` - OG image generation for share links
- `app/page.tsx` - Home/landing page
- `app/components/` - All React components (shared between main app and results page)
- `app/store/` - Redux store (uiSlice, appSlice, gamePicksSlice, apiSlice)
- `app/hooks/` - Custom hooks (`useGamesData`, `useInSeason`)
- `app/api/` - API route handlers

For detailed file locations, see [Quick Reference](../quick-reference.md) - File Locations table.

---

**Last Updated**: May 2026
