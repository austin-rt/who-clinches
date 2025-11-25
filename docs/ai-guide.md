# AI Assistant Guide for Conference Tiebreaker

**The definitive entry point for AI assistants working with this Next.js-based conference tiebreaker application.**

This is a specialized college football application built for simulating conference standings using official tiebreaker rules. The application enables users to predict game outcomes and see how those predictions affect the final conference standings and conference championship matchup.

## AI Agent Behavior Guidelines

### **Core Principles**

- **Question vs Command**: Questions (Why? How? What?) = information only. Commands (Add, Update, Change, Fix) = take action. Ask for clarification if unsure.
- **Build After Code Changes**: Always run `npm run build` after code changes to catch build errors
- **No Automated npm Commands**: Don't run npm commands without explicit request, except `npm run build` after code changes
- **NEVER Disable ESLint Rules**: ESLint rules are intentionally configured and must be followed. NEVER use `eslint-disable` comments. If code violates lint rules, fix the code to comply with the rules instead. This includes `no-console` - use proper logging or remove console statements entirely.
- **NEVER Run Destructive Commands Without Explicit Confirmation**: NEVER run commands that delete, drop, or destroy data (e.g., `drop-database.js`, `rm -rf`, database drops, etc.) without explicit user confirmation. If a destructive operation is needed, explain what will happen and ask for explicit confirmation before proceeding.
- **NEVER Use Inline Type Imports**: NEVER use inline `import()` syntax in type annotations (e.g., `Promise<import('./path').Type>`). Always import types at the top of the file and use them directly. Inline imports are hard to read, break IDE navigation, and violate TypeScript best practices.
- **Pre-Commit Hooks**: When using commit command, validation runs upfront. Use `--no-verify` flag after validation passes to skip redundant hook checks. If validation fails, fix errors before committing.
- **File Deletions Are Last**: NEVER delete files until the very end of a refactor, after ALL changes are complete, tested, and validated. File deletions must be the absolute final step, only after: (1) all code changes are implemented, (2) `npm run lint` passes, (3) `npx tsc --noEmit` passes, (4) all tests pass (`npm run test:all`), and (5) all functionality is verified working. Only then may files be deleted. This prevents accidental loss of code and ensures the refactor is complete before cleanup.
- **No Code Comments**: Do not add comments to code files, including JSDoc comments. Write self-documenting code instead. Existing comments should remain, but do not add new ones.
- **NEVER Edit Tiebreaker Rules Files**: The official conference tiebreaker rules are stored in `docs/tiebreaker-rules/*.txt`. These files are the SINGULAR SOURCE OF TRUTH for tiebreaker procedures. AI agents MUST NEVER edit, modify, or delete these files. The code in `lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts` must enforce these rules exactly as specified in the rules files. If tiebreaker logic needs to be updated, the rules files are updated by running extraction scripts (e.g., `scripts/extract-sec-rules.py`) to fetch the latest official PDFs from conference sources.

## Application Overview

- **Game Simulation**: Users predict scores for upcoming/incomplete games
- **Tiebreaker Resolution**: Implements official conference tiebreaker rules (A-E) to resolve ties. Rules are defined in `docs/tiebreaker-rules/*.txt` (the singular source of truth) and enforced by `lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts`
- **Standings Calculation**: Generates complete conference standings with explanations
- **Real-Time Data**: Automatically updates from ESPN API via scheduled cron jobs

**Key Endpoints:**
- `/api/simulate/[sport]/[conf]` - Accepts game score overrides and returns full standings (e.g., `/api/simulate/cfb/sec`)
- `/api/pull-games/[sport]/[conf]` and `/api/pull-teams/[sport]/[conf]` - Populate database from ESPN API (e.g., `/api/pull-games/cfb/sec`)
- `/api/games/[sport]/[conf]` - Query games endpoint (e.g., `/api/games/cfb/sec`)
- Cron jobs: `/api/cron/[sport]/[conf]/update-games`, `/api/cron/[sport]/[conf]/update-rankings`, `/api/cron/[sport]/[conf]/update-spreads`, `/api/cron/[sport]/[conf]/update-team-averages` (see `vercel.json`/`vercel.pro.json`)

## Repository Structure

**Key Directories:**
- `app/api/` - API routes with dynamic structure: `/api/[operation]/[sport]/[conf]` (e.g., `/api/games/[sport]/[conf]`, `/api/simulate/[sport]/[conf]`, `/api/pull-teams/[sport]/[conf]`, `/api/pull-games/[sport]/[conf]`, cron jobs in `/api/cron/[sport]/[conf]/`)
- `app/components/` - React components
- `app/store/` - Redux state management (uiSlice, gamePicksSlice, apiSlice)
- `lib/models/` - Mongoose schemas (Game, Team, Error)
- `lib/espn/` - Generated ESPN API types
- `lib/constants.ts` - Sports and conference configuration (single source of truth for sport/conference metadata)
- `lib/` - Core utilities (espn-client, reshape-*, tiebreaker-helpers)
- `scripts/` - Database and type generation scripts

**File Structure:** `app/api/` (routes), `app/components/` (React), `app/store/` (Redux), `lib/models/` (Mongoose), `lib/espn/` (types), `lib/` (utilities). See [Frontend Documentation](./guides/frontend/index.md) for details.

## Quick Start

- **Documentation**: See [AI Loading Manifest](./ai-loading-manifest.md) for efficient doc loading
- **After Code**: Run `npm run build` to catch build errors

## Key Files

- Models: `lib/models/Game.ts`, `lib/models/Team.ts`, `lib/types.ts`
- ESPN: `lib/cfb/espn-client.ts` (CFB-specific), `lib/reshape-games.ts` (generic), `lib/reshape-teams.ts` (generic), `lib/constants.ts` (sports and conference configuration)
- Tiebreaker: `lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts` - SEC tiebreaker rules A-E (must enforce rules from `docs/tiebreaker-rules/`)
- Frontend: `app/store/` - Redux (uiSlice, gamePicksSlice, apiSlice) with redux-persist
- Cron: Auth `Bearer ${CRON_SECRET}`, schedules in `vercel.json`/`vercel.pro.json`

**Tiebreaker Rules (SINGULAR SOURCE OF TRUTH):**
- Location: `docs/tiebreaker-rules/*.txt` - NEVER edit these files. They are extracted from official conference PDFs via `scripts/extract-sec-rules.py`
- Code must enforce rules exactly as specified in `lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts`

**Constraints:** Vercel timeouts (60s Pro, 10s Hobby), ESPN API (500ms delays), Cron limits (Hobby: 2 jobs daily, Pro: unlimited)

## Essential Pattern Recognition

**Key Patterns:**
- **API Route**: `export const POST/GET = async (request: NextRequest) => { ... }`
- **Database**: `await dbConnect()` before any DB operation
- **ESPN API**: `espnClient.getScoreboard()` / `getTeam()` / `getTeamRecords()`
- **Data Transformation**: 
  - `reshapeScoreboardData()` (from `lib/reshape-games.ts`) → Game format
  - `reshapeTeamData()` (from `lib/reshape-teams.ts`) → Team format
  - `extractTeamsFromScoreboard()` (from `lib/reshape-teams-from-scoreboard.ts`) → Extract teams from scoreboard
- **Error Logging**: `ErrorLog.create({ timestamp, endpoint, payload, error, stackTrace })`
- **Cron Auth**: `authHeader === \`Bearer ${process.env.CRON_SECRET}\``
- **Type Casting**: `.lean<GameLean[]>()` for MongoDB queries
- **Redux**: `useAppSelector()`, `useAppDispatch()` from `app/store/hooks.ts`
- **UI State**: `useUIState()` hook from `app/store/useUI.ts`
- **State Persistence**: redux-persist automatically persists ui and gamePicks slices to localStorage (keys: `persist:ui`, `persist:gamePicks`)
- **RTK Query**: 
  - `useGetGamesQuery({ sport, conf, season?, week?, state?, from?, to? })` - Dynamic route requires sport/conf
  - `useSimulateMutation()` - Requires `{ sport, conf, season, overrides }` in request body
  - Both hooks from `app/store/apiSlice.ts`

**Component Patterns:** Arrow function syntax with default export. Define types in `types/frontend.ts` or `lib/types.ts` (no inline literal union types).

## Critical Accuracy Notes

**ESPN API Quirks:**
- Conference ID: Scoreboard API uses "8", Team API may return "80"
- Record Types: Use `name` for overall ("overall"), `type` for others ("homerecord", "awayrecord", "vsconf")
- Ranking Values: 99 or null means unranked
- Future Seasons: Core API may return null for upcoming seasons (fall back to Site API)

**Cron Schedule Format:** `0 13-5 * * *` (hour range wrapping midnight), `*/5 21-23,0-6 * * 4-5` (every 5 min, multiple ranges, specific days)

**Data Integrity:**
- `predictedScore`: Calculated by `calculatePredictedScore()` from `lib/cfb/helpers/prefill-helpers.ts` using priority order:
  1. Real scores (if game completed or in progress with scores)
  2. ESPN odds (overUnder + spread + favorite) via `calculatePredictedScoreFromOdds()`
  3. Team averages + spread via `calculatePredictedScoreFromTeamAverages()`
  4. Ranking-based via `calculatePredictedScoreFromRanking()` (if no odds: higher ranked team uses season average, lower ranked team uses higher ranked score minus rank difference, or minus 17 if unranked)
  5. Home field advantage via `calculatePredictedScoreFromHomeFieldAdvantage()` (fallback: home team average, away team average - 3)
- `displayName`: Format must be "{away} @ {home}" with team abbreviations
- Team IDs: ESPN team IDs used as MongoDB `_id` (no separate mapping table)
- `favoriteTeamEspnId`: Determined from ESPN's `odds.awayTeamOdds.favorite` or `odds.homeTeamOdds.favorite` boolean fields

---

**This guide provides the essential foundation for AI assistants to work effectively with the Conference Tiebreaker application while respecting technical constraints and ensuring accurate implementation of conference tiebreaker rules.**
