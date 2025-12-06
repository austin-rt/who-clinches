# AI Assistant Guide for Who Clinches

**The definitive entry point for AI assistants working with this Next.js-based conference tiebreaker application.**

This is a specialized college football application built for simulating conference standings using official tiebreaker rules. The application enables users to predict game outcomes and see how those predictions affect the final conference standings and conference championship matchup.

## AI Agent Behavior Guidelines

### **Core Principles**

- **Build After Code Changes**: Always run `npm run build` after code changes to catch build errors
- **No Automated npm Commands**: Don't run npm commands without explicit request, except `npm run build` after code changes
- **NEVER Disable ESLint Rules**: ESLint rules are intentionally configured and must be followed. NEVER use `eslint-disable` comments. If code violates lint rules, fix the code to comply with the rules instead. This includes `no-console` - use proper logging or remove console statements entirely.
- **NEVER Run Destructive Commands Without Explicit Confirmation**: NEVER run commands that delete, drop, or destroy data (e.g., `drop-database.js`, `rm -rf`, database drops, etc.) without explicit user confirmation. If a destructive operation is needed, explain what will happen and ask for explicit confirmation before proceeding.
- **NEVER Use Inline Type Imports**: NEVER use inline `import()` syntax in type annotations (e.g., `Promise<import('./path').Type>`). Always import types at the top of the file and use them directly. Inline imports are hard to read, break IDE navigation, and violate TypeScript best practices.
- **Pre-Commit Hooks**: Use `--no-verify` flag after validation passes to skip redundant hook checks.
- **File Deletions Are Last**: NEVER delete files until the very end of a refactor, after ALL changes are complete, tested, and validated. File deletions must be the absolute final step, only after: (1) all code changes are implemented, (2) `npm run lint` passes, (3) `npx tsc --noEmit` passes, (4) all tests pass (`npm run test:all`), and (5) all functionality is verified working. Only then may files be deleted. This prevents accidental loss of code and ensures the refactor is complete before cleanup.
- **No Code Comments**: Do not add comments to code files, including JSDoc comments. Write self-documenting code instead. Existing comments should remain, but do not add new ones.
- **NEVER Edit Tiebreaker Rules Files**: The official conference tiebreaker rules are stored in `docs/tiebreaker-rules/*.txt`. These files are the SINGULAR SOURCE OF TRUTH for tiebreaker procedures. AI agents MUST NEVER edit, modify, or delete these files. The modular tiebreaker system (`lib/cfb/tiebreaker-rules/common/`, `lib/cfb/tiebreaker-rules/core/`, `lib/cfb/tiebreaker-rules/{conf}/config.ts`) must enforce these rules exactly as specified in the rules files. If tiebreaker logic needs to be updated, the rules files are updated by running extraction scripts (e.g., `scripts/extract-sec-rules.py`) to fetch the latest official PDFs from conference sources.

## Application Overview

- **Game Simulation**: Users predict scores for upcoming/incomplete games
- **Tiebreaker Resolution**: Implements official conference tiebreaker rules (A-E) to resolve ties. Rules are defined in `docs/tiebreaker-rules/*.txt` (the singular source of truth) and enforced by a modular system: common rules in `lib/cfb/tiebreaker-rules/common/`, core engine in `lib/cfb/tiebreaker-rules/core/`, and conference-specific configs in `lib/cfb/tiebreaker-rules/{conf}/config.ts`
- **Standings Calculation**: Generates complete conference standings with explanations
- **Real-Time Data**: Automatically updates from CFBD API via frontend polling with conditional logic

## Repository Structure

**Key Directories:**
- `app/api/` - API routes with dynamic structure: `/api/[operation]/[sport]/[conf]` (e.g., `/api/games/[sport]/[conf]`, `/api/standings/[sport]/[conf]`, `/api/simulate/[sport]/[conf]`). Teams are automatically extracted from games endpoint responses.
- `app/components/` - React components
- `app/store/` - Redux state management (uiSlice, gamePicksSlice, apiSlice)
- `lib/constants.ts` - Sports and conference configuration (single source of truth for sport/conference metadata)
- `lib/cfb/` - CFBD API clients (cfbd-client, cfbd-rest-client, cfbd-graphql-client)
- `lib/` - Core utilities (reshape-*, tiebreaker-helpers)

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

**Tiebreaker Logic**: Modular system with common rules (`lib/cfb/tiebreaker-rules/common/`), core engine (`lib/cfb/tiebreaker-rules/core/breakTie.ts`, `calculateStandings.ts`), and SEC config (`lib/cfb/tiebreaker-rules/sec/config.ts`) - Must enforce rules from `docs/tiebreaker-rules/`

**Frontend State**: `app/store/` - Redux (uiSlice, gamePicksSlice, apiSlice) with redux-persist

**Frontend Data Hook**: `app/hooks/useGamesData.ts` - Conditional frontend polling with RTK Query

## Quick Start

1. **Read Documentation**: Start with [AI Loading Manifest](./ai-loading-manifest.md) for efficient doc loading
2. **After Code Changes**: Run `npm run build` to catch build errors
3. **Navigate**: Use the documentation structure above to find specific information

## Constraints

- **Vercel Timeouts**: 60s Pro, 10s Hobby
- **CFBD API**: Rate limits based on tier (Free: 1,000/month, Tier 2: $1/month, Tier 3+: higher limits for in-season)
- **Frontend Polling**: Conditional based on game states (see [Data Flow](./guides/frontend/data-flow.md) for details)
- **No Database**: All data is fetched directly from CFBD API on each request. No MongoDB/Mongoose persistence.

---

**For specific implementation details, see the documentation files referenced above.**
