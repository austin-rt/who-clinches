# AI Assistant Guide for SEC Tiebreaker

**The definitive entry point for AI assistants working with this Next.js-based SEC conference tiebreaker application.**

This is a specialized college football application built for simulating SEC conference standings using official tiebreaker rules. The application enables users to predict game outcomes and see how those predictions affect the final conference standings and SEC Championship matchup.

## AI Agent Behavior Guidelines

### **Core Principles**

- **Question vs Command Distinction**: When the user asks a question (Why? How? What?), provide information only. When the user gives a command (Add, Update, Change, Fix), then take action. Do not make code changes when answering questions about existing code or asking for clarification. If ever you are unsure if a prompt is a question or command, ask for clarification rather than making assumptions.
- **Always Run Build After Code Changes**: After making code changes (especially CSS, TypeScript, or component changes), always run `npm run build` to catch build errors that may not appear in dev mode. This catches CSS parsing errors, TypeScript errors, and other build-time issues.
- **No Automated npm Commands**: Do not run npm commands (build, start, install, etc.) without explicit request, EXCEPT for `npm run build` after code changes as specified above. If other npm commands are needed for validation or troubleshooting, recommend the user run it and inform the user why it is needed.
- **Communicate context window**: When your context window reaches 95% capacity, inform me that you are at 95% of your limit and suggest I request a handoff prompt and start a new chat.
- **NEVER Disable ESLint Rules**: ESLint rules are intentionally configured and must be followed. NEVER use `eslint-disable` comments. If code violates lint rules, fix the code to comply with the rules instead. This includes `no-console` - use proper logging or remove console statements entirely.
- **NEVER Run Destructive Commands Without Explicit Confirmation**: NEVER run commands that delete, drop, or destroy data (e.g., `drop-database.js`, `rm -rf`, database drops, etc.) without explicit user confirmation. If a destructive operation is needed, explain what will happen and ask for explicit confirmation before proceeding.
- **NEVER Use Inline Type Imports**: NEVER use inline `import()` syntax in type annotations (e.g., `Promise<import('./path').Type>`). Always import types at the top of the file and use them directly. Inline imports are hard to read, break IDE navigation, and violate TypeScript best practices.
- **NEVER Bypass Pre-Commit Hooks**: NEVER use `--no-verify` or `--no-gpg-sign` flags with git commit. Pre-commit hooks are mandatory and must run on all commits. If code doesn't pass hooks, fix the code rather than bypassing the checks.
- **File Deletions Are Last**: NEVER delete files until the very end of a refactor, after ALL changes are complete, tested, and validated. File deletions must be the absolute final step, only after: (1) all code changes are implemented, (2) `npm run lint` passes, (3) `npx tsc --noEmit` passes, (4) all tests pass (`npm run test:all`), and (5) all functionality is verified working. Only then may files be deleted. This prevents accidental loss of code and ensures the refactor is complete before cleanup.
- **No Code Comments**: Do not add comments to code files, including JSDoc comments. Write self-documenting code instead. Existing comments should remain, but do not add new ones.

## Application Overview

- **Game Simulation**: Users predict scores for upcoming/incomplete games
- **Tiebreaker Resolution**: Implements official SEC tiebreaker rules (A-E) to resolve ties
- **Standings Calculation**: Generates complete SEC conference standings with explanations
- **Real-Time Data**: Automatically updates from ESPN API via scheduled cron jobs

**Key Endpoints:**
- `/api/simulate` - Accepts game score overrides and returns full standings
- `/api/pull-games` and `/api/pull-teams` - Populate database from ESPN API
- `/api/games` - Query games endpoint
- Cron jobs: `update-games`, `update-rankings`, `update-spreads`, `update-team-averages` (see `vercel.json`/`vercel.pro.json`)

## Repository Structure

**Key Directories:**
- `app/api/` - API routes (cron jobs, games, simulate, pull-teams, pull-games)
- `app/components/` - React components
- `app/store/` - Redux state management (uiSlice, gamePicksSlice, apiSlice)
- `lib/models/` - Mongoose schemas (Game, Team, Error)
- `lib/espn/` - Generated ESPN API types
- `lib/` - Core utilities (espn-client, reshape-*, tiebreaker-helpers, prefill-helpers)
- `scripts/` - Database and type generation scripts
- `docs/` - Documentation
- **Documentation Loading:** See [AI Loading Manifest](./ai-loading-manifest.md) - tells you which docs to load for token efficiency

## Quick Start

- **Documentation Loading**: See [AI Loading Manifest](./ai-loading-manifest.md) - Essential docs and task-specific loading strategies
- **Before Writing Code**: Verify patterns with codebase examples, check MongoDB schemas, consider Vercel timeouts (60s Pro, 10s Hobby)
- **After Code Changes**: Always run `npm run build` to catch build errors (CSS parsing, TypeScript, etc.) that may not appear in dev mode
- **Before Running Tests**: Check dev server: `curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Server running" || npm run dev`

## Implementation Details

**Key Files:**
- Models: `lib/models/Game.ts`, `lib/models/Team.ts`, `lib/types.ts`
- ESPN: `lib/espn-client.ts`, `lib/reshape-games.ts`, `lib/reshape-teams.ts`, `lib/constants.ts`
- Tiebreaker: `lib/tiebreaker-helpers.ts` - SEC rules A-E
- Frontend: `app/store/` - Redux (uiSlice, gamePicksSlice, apiSlice) with redux-persist
- Cron: Auth `Bearer ${CRON_SECRET}`, schedules in `vercel.json`/`vercel.pro.json`

**Constraints:**
- Vercel timeouts: 60s Pro, 10s Hobby
- ESPN API: 500ms delays between requests
- Cron limits: Hobby = 2 jobs daily, Pro = unlimited

## Essential Pattern Recognition

**Key Patterns:**
- **API Route**: `export const POST/GET = async (request: NextRequest) => { ... }`
- **Database**: `await dbConnect()` before any DB operation
- **ESPN API**: `espnClient.getScoreboard()` / `getTeam()` / `getTeamRecords()`
- **Data Transformation**: `reshapeScoreboardData()` → Database format
- **Error Logging**: `ErrorLog.create({ timestamp, endpoint, payload, error, stackTrace })`
- **Cron Auth**: `authHeader === \`Bearer ${process.env.CRON_SECRET}\``
- **Type Casting**: `.lean<GameLean[]>()` for MongoDB queries
- **Redux**: `useAppSelector()`, `useAppDispatch()` from `app/store/hooks.ts`
- **UI State**: `useUIState()` hook from `app/store/useUI.ts`
- **State Persistence**: redux-persist automatically persists ui and gamePicks slices to localStorage (keys: `persist:ui`, `persist:gamePicks`)
- **RTK Query**: `useGetGamesQuery()`, `useSimulateMutation()` from `app/store/apiSlice.ts`

### **Frontend Component Pattern**

**All React components MUST use arrow function syntax with default export:**

```typescript
const ComponentName = () => {
  // Component logic
  return (
    // JSX
  );
};

export default ComponentName;
```

### **Type Definition Pattern**

**NEVER use inline literal union types. Always define types/interfaces:**

```typescript
// ❌ BAD
const [mode, setMode] = useState<'light' | 'dark'>('light');

// ✅ GOOD
export type ThemeMode = 'light' | 'dark';
const [mode, setMode] = useState<ThemeMode>('light');
```

- Frontend types: `types/frontend.ts`
- Backend/shared types: `lib/types.ts` or `lib/api-types.ts`

## Critical Accuracy Notes

**ESPN API Quirks:**
- Conference ID: Scoreboard API uses "8", Team API may return "80"
- Record Types: Use `name` for overall ("overall"), `type` for others ("homerecord", "awayrecord", "vsconf")
- Ranking Values: 99 or null means unranked
- Future Seasons: Core API may return null for upcoming seasons (fall back to Site API)

**Cron Schedule Format:**
- `0 13-5 * * *`: Hour range that wraps midnight (13-23, then 0-5 UTC = 17 hours)
- `*/5 21-23,0-6 * * 4-5`: Every 5 minutes, multiple hour ranges, specific days

**Data Integrity:**
- `predictedScore`: Recalculated by cron jobs on every update
- `displayName`: Format must be "{away} @ {home}" with team abbreviations
- Team IDs: ESPN team IDs used as MongoDB `_id` (no separate mapping table)

---

**This guide provides the essential foundation for AI assistants to work effectively with the SEC Tiebreaker application while respecting technical constraints and ensuring accurate implementation of SEC conference tiebreaker rules.**
