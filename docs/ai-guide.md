# AI Assistant Guide for Who Clinches

**The definitive entry point for AI assistants working with this Next.js-based conference tiebreaker application.**

This is a specialized college football application built for simulating conference standings using official tiebreaker rules. The application enables users to predict game outcomes and see how those predictions affect the final conference standings and conference championship matchup.

## AI Agent Behavior Guidelines

### **Core Principles**

- **NEVER Disable ESLint Rules**: Fix code to comply with rules. Never use `eslint-disable` comments. Remove console statements or use proper logging.
- **NEVER Run Destructive Commands Without Explicit Confirmation**: Never run destructive commands (delete, drop, destroy data) without explicit user confirmation.
- **NEVER Use Inline Type Imports**: Always import types at the top of the file. Never use `Promise<import('./path').Type>` syntax.
- **File Deletions Are Last**: Delete files only after all changes are complete, tested, and validated. Final step after: code changes, lint passes, type check passes, tests pass, functionality verified.
- **No Code Comments**: Write self-documenting code. Do not add new comments. Existing comments remain.
- **NEVER Edit Tiebreaker Rules Files**: `docs/tiebreaker-rules/*.txt` are the SINGULAR SOURCE OF TRUTH. Never edit, modify, or delete these files. Only extraction scripts update them.

## Application Overview

- **Game Simulation**: Users predict scores for upcoming/incomplete games
- **Tiebreaker Resolution**: Implements official conference tiebreaker rules (varies by conference, e.g., SEC Rules A-E, MWC team rating score) to resolve ties. Rules are defined in `docs/tiebreaker-rules/*.txt` (the singular source of truth) and enforced by a modular system: common rules in `lib/cfb/tiebreaker-rules/common/`, core engine in `lib/cfb/tiebreaker-rules/core/`, and conference-specific configs in `lib/cfb/tiebreaker-rules/{conf}/config.ts`. Some rules are async and fetch external data (SP+ and FPI ratings) on demand.
- **Standings Calculation**: Generates complete conference standings with explanations
- **Real-Time Data**: Automatically updates from CFBD API via frontend polling with conditional logic

## Repository Structure

**Key Directories:**
- `app/api/` - API routes with dynamic structure: `/api/[operation]/[sport]/[conf]` (e.g., `/api/games/[sport]/[conf]`, `/api/standings/[sport]/[conf]`, `/api/simulate/[sport]/[conf]`). Teams are automatically extracted from games endpoint responses.
- `app/components/` - React components
- `app/store/` - Redux state management (uiSlice, gamePicksSlice, apiSlice)
- `lib/constants.ts` - Sports and conference configuration (single source of truth for sport/conference metadata)
- `lib/cfb/` - CFBD API clients (cfbd-client, cfbd-rest-client, cfbd-graphql-client)
- `lib/` - Core utilities (reshape-*, tiebreaker-rules modular system)

## Documentation Navigation

**Start Here:**
- **[AI Loading Manifest](./ai-loading-manifest.md)** - Efficient doc loading strategy

**API Documentation:**
- **[API Reference](./guides/api-reference.md)** - Complete API endpoint reference
- **[API Data Endpoints](./guides/api-reference-data.md)** - Detailed data endpoint documentation
- **[CFBD API Monitoring](./guides/cfbd-api-monitoring.md)** - CFBD API monitoring and alerting

**Frontend Documentation:**
- **[Frontend Index](./guides/frontend/index.md)** - Frontend architecture overview
- **[Data Flow](./guides/frontend/data-flow.md)** - How data flows through the application
- **[State Management](./guides/frontend/state-management.md)** - Redux store and persistence

**Testing Documentation:**
- **[Testing Quick Reference](./guides/testing-quick-reference.md)** - Quick testing commands and procedures
- **[Comprehensive API Testing](./tests/comprehensive-api-testing.md)** - Complete API testing guide

**Tiebreaker Rules:**
- **Location**: `docs/tiebreaker-rules/*.txt` - NEVER edit these files. They are extracted from official conference PDFs via `scripts/extract-sec-rules.py`
- **Code**: Modular system with common rules (`lib/cfb/tiebreaker-rules/common/`), core engine (`lib/cfb/tiebreaker-rules/core/`), and conference configs (`lib/cfb/tiebreaker-rules/{conf}/config.ts`) - Must enforce rules exactly as specified

## Key Files Reference

**Types**: `lib/types.ts`

**CFBD Integration**: `lib/cfb/cfbd-client.ts` (unified client), `lib/cfb/cfbd-rest-client.ts`, `lib/cfb/cfbd-graphql-client.ts`, `lib/reshape-games.ts`, `lib/reshape-teams-from-cfbd.ts`, `lib/constants.ts` (sports and conference configuration)

**Team Enrichment**: Team metadata (`shortDisplayName`, `alternateColor`) is enriched at the reshape level (`lib/reshape-games.ts`) from CFBD API responses. All data is fetched directly from CFBD API on each request - no database persistence.

**Tiebreaker Logic**: Modular system with common rules (`lib/cfb/tiebreaker-rules/common/`), core engine (`lib/cfb/tiebreaker-rules/core/breakTie.ts`, `calculateStandings.ts`), and conference configs (`lib/cfb/tiebreaker-rules/{conf}/config.ts`) - Must enforce rules from `docs/tiebreaker-rules/`. Rules can be async and fetch external data on demand (e.g., SP+ and FPI ratings for MWC team rating score rule).

**Frontend State**: `app/store/` - Redux (uiSlice, gamePicksSlice, apiSlice) with redux-persist

**Frontend Data Hook**: `app/hooks/useGamesData.ts` - Conditional frontend polling with RTK Query

## Quick Start

Start with [AI Loading Manifest](./ai-loading-manifest.md) for efficient doc loading. Use the documentation structure above to find specific information.

## Constraints

- **Vercel Timeouts**: 60s Pro, 10s Hobby
- **CFBD API**: Rate limits based on tier (Free: 1,000/month, Tier 2: $1/month, Tier 3+: higher limits for in-season)
- **Frontend Polling**: Conditional based on game states (see [Data Flow](./guides/frontend/data-flow.md) for details)
- **No Database**: All data is fetched directly from CFBD API on each request. No MongoDB/Mongoose persistence.

---

**For specific implementation details, see the documentation files referenced above.**
