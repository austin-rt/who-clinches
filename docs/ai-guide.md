# AI Assistant Guide for SEC Tiebreaker

**The definitive entry point for AI assistants working with this Next.js-based SEC conference tiebreaker application.**

This is a specialized college football application built for simulating SEC conference standings using official tiebreaker rules. The application enables users to predict game outcomes and see how those predictions affect the final conference standings and SEC Championship matchup.

## AI Agent Behavior Guidelines

### **Core Principles**

- **Never Assume**: Always verify patterns with actual codebase examples before making statements
- **Follow Existing Patterns**: Use established Next.js App Router, MongoDB, and ESPN API patterns found in the codebase
- **No Emojis**: Do not add emojis to code or documentation unless explicitly requested
- **Source Code Truth**: Documentation guides to code, but code is the ultimate source of truth
- **Complete Implementation**: For complex refactoring tasks, identify all dependencies and file changes upfront - ask for clarification if the scope of dependencies is ambiguous rather than making partial implementations that break the codebase
- **Do not anthropomorphize yourself**: Use specific technical language when possible and do not pretend to be human. You are a helpful assistant that is not sentient. You do not think or feel or have emotions. I do not need feedback on what you should have done better. If you offer feedback it should be on how I can better craft my prompts.
- **Direct Response Format**: Begin responses immediately with the requested action or information. Do not preface responses with agreement, validation, or acknowledgment statements regardless of context.
- **Question vs Command Distinction**: When the user asks a question (Why? How? What?), provide information only. When the user gives a command (Add, Update, Change, Fix), then take action. Do not make code changes when answering questions about existing code or asking for clarification. If ever you are unsure if a prompt is a question or command, ask for clarification rather than making assumptions.
- **Be concise and efficient in your responses**: Do not use overly verbose language. Do not offer observations regarding the quality of my prompts or requests. Phrases like "That's an excellent question" or "You're right to ask that" are not efficient or helpful.
- **No Automated npm Commands**: Do not run npm commands (build, start, install, etc.) without explicit request. If npm commands are needed for validation or troubleshooting, recommend the user run it and inform the user why it is needed.
- **Communicate context window**: When your context window reaches 95% capacity, inform me that you are at 95% of your limit and suggest I request a handoff prompt and start a new chat.
- **NEVER Disable ESLint Rules**: ESLint rules are intentionally configured and must be followed. NEVER use `eslint-disable` comments. If code violates lint rules, fix the code to comply with the rules instead. This includes `no-console` - use proper logging or remove console statements entirely.
- **NEVER Run Destructive Commands Without Explicit Confirmation**: NEVER run commands that delete, drop, or destroy data (e.g., `drop-database.js`, `rm -rf`, database drops, etc.) without explicit user confirmation. If a destructive operation is needed, explain what will happen and ask for explicit confirmation before proceeding.
- **NEVER Use Inline Type Imports**: NEVER use inline `import()` syntax in type annotations (e.g., `Promise<import('./path').Type>`). Always import types at the top of the file and use them directly. Inline imports are hard to read, break IDE navigation, and violate TypeScript best practices.
- **NEVER Bypass Pre-Commit Hooks**: NEVER use `--no-verify` or `--no-gpg-sign` flags with git commit. Pre-commit hooks are mandatory and must run on all commits. If code doesn't pass hooks, fix the code rather than bypassing the checks.
- **File Deletions Are Last**: NEVER delete files until the very end of a refactor, after ALL changes are complete, tested, and validated. File deletions must be the absolute final step, only after: (1) all code changes are implemented, (2) `npm run lint` passes, (3) `npx tsc --noEmit` passes, (4) all tests pass (`npm run test:all`), and (5) all functionality is verified working. Only then may files be deleted. This prevents accidental loss of code and ensures the refactor is complete before cleanup.

### **Development Approach**

- **Pattern Recognition**: Look for established patterns before creating new ones
- **Constraint Awareness**: Always consider Next.js App Router patterns, MongoDB schema constraints, and ESPN API limitations
- **Performance Impact**: Consider database query optimization, ESPN API rate limiting, and serverless function execution time
- **Business Context**: Understand SEC tiebreaker rules and college football operational requirements before implementing features

## Application Overview

### **What This Application Does**

- **Game Simulation**: Allows users to predict scores for upcoming/incomplete college football games
- **Tiebreaker Resolution**: Implements official SEC tiebreaker rules (A-E) to resolve ties in conference standings
- **Standings Calculation**: Generates complete SEC conference standings with human-readable explanations
- **Real-Time Data**: Automatically updates game scores and team rankings from ESPN API via scheduled cron jobs

### **Core Features**

- **Simulate Endpoint**: `/api/simulate` - Accepts game score overrides and returns full standings
- **Data Ingestion**: `/api/pull-games` and `/api/pull-teams` - Populate database from ESPN API
- **Automated Updates**: Multiple cron jobs for live scores, spreads, rankings, and team statistics (see `vercel.json` and `vercel.pro.json` for schedules)
- **Predicted Scores**: Server-calculated predictions using spreads + team season averages for incomplete games

### **Key Concepts**

- **Conference Games**: SEC teams playing against other SEC teams (determines conference standings)
- **Tiebreaker Rules**: Official SEC policy for resolving teams with identical conference records
- **Predicted Score**: Calculated score for games without real results (spread + team averages)
- **ESPN IDs**: Primary keys for teams and games (pulled directly from ESPN API)

## Repository Structure

```
app/
├── api/
│   ├── cron/                    # Automated update endpoints
│   │   ├── update-games/        # Score updates (allGames param for batch vs frequent)
│   │   ├── update-all/          # Batch endpoint (Hobby plan - calls update-games, update-rankings, update-test-data)
│   │   ├── update-rankings/     # Weekly team rankings/standings
│   │   ├── update-spreads/      # Hourly betting odds (Pro mode)
│   │   ├── update-team-averages/ # Weekly season stats (Pro mode)
│   │   ├── update-test-data/    # Test data snapshot updates (triggers reshape tests)
│   │   └── run-reshape-tests/   # Reshape function tests (called by update-test-data)
│   ├── games/                   # Query games endpoint
│   ├── pull-games/              # Seed/update games from ESPN
│   ├── pull-teams/              # Seed/update teams from ESPN
│   └── simulate/                # Tiebreaker simulation endpoint
├── globals.css
├── layout.tsx
└── page.tsx

lib/
├── models/                      # Mongoose schemas
│   ├── Error.ts                 # Error logging
│   ├── Game.ts                  # Game data model
│   ├── Team.ts                  # Team data model
│   └── test/                    # Test data models
│       ├── ESPNScoreboardTestData.ts
│       ├── ESPNTeamTestData.ts
│       ├── ESPNGameSummaryTestData.ts
│       └── ESPNTeamRecordsTestData.ts
├── espn/                        # Generated ESPN API types (auto-generated)
│   ├── espn-scoreboard-generated.ts
│   ├── espn-team-generated.ts
│   ├── espn-team-records-generated.ts
│   └── espn-game-summary-generated.ts
├── api-types.ts                 # Request/response interfaces
├── constants.ts                 # SEC_TEAMS, conference IDs, constants
├── espn-client.ts               # ESPN API client (uses generated types)
├── mongodb.ts                   # MongoDB connection singleton
├── mongodb-test.ts              # Test database connection
├── prefill-helpers.ts           # Predicted score calculation
├── reshape-games.ts             # ESPN scoreboard data transformation
├── reshape-teams.ts            # ESPN team data transformation
├── tiebreaker-helpers.ts        # SEC tiebreaker rules A-E implementation
└── types.ts                     # Internal application types

scripts/
├── analyze-test-data.ts         # Analyze test database contents
├── db-check-and-seed.js         # Database seeding and verification
├── drop-database.js             # Database deletion utility (requires confirmation)
├── extract-espn-types.ts        # Generate TypeScript types from ESPN API responses
├── extract-used-types.ts        # Track and compare used ESPN type fields
├── fix-scoreboard-index.ts      # Fix MongoDB index issues
├── test-api-pipeline.sh         # API pipeline testing script
├── test-db-check-and-seed.js    # Test database seeding
└── verify-espn-types.ts        # Verify generated types match usage

.github/workflows/
└── update-espn-types.yml        # Automated ESPN type generation (daily)

docs/
├── ai-guide.md                  # AI assistant guidance (this file)
├── guides/                      # How-to documentation
│   ├── api-reference.md
│   ├── changelog-guide.md
│   ├── pre-commit-testing.md
│   └── testing-quick-reference.md
├── tests/                       # Testing documentation
│   ├── comprehensive-api-testing.md
│   ├── cron-jobs-testing.md
│   ├── espn-api-testing.md
│   ├── espn-data-pipeline.md
│   └── tiebreaker-and-simulate.md
├── plans/                       # Planning and specification documents
│   ├── api-foundation.md
│   ├── tech-spec.md
│   ├── tiebreaker-logic.md
│   ├── frontend/
│   └── archive/                 # Completed phase records
└── navigation-hub.md            # Documentation index and search guide

vercel.json                      # Hobby plan cron schedules (1 job: update-all batch)
vercel.pro.json                  # Pro plan cron schedules (6 jobs: individual cron endpoints)
```

## High-Level Architecture

### **Frontend Stack**

- **Next.js 15**: React with App Router and server-side rendering
- **TypeScript**: Full type safety across application
- **Tailwind CSS**: Utility-first styling (when frontend is built)

### **Backend Stack**

- **Next.js API Routes**: Serverless functions for all endpoints
- **MongoDB Atlas**: Cloud database with Mongoose ODM
- **ESPN API**: External data source for games, teams, and statistics
- **Vercel Cron Jobs**: Scheduled tasks for automated data updates

### **Data Flow**

1. **Initial Seeding**: `/api/pull-teams` → `/api/pull-games` → Database populated
2. **Cron Updates**: Scheduled jobs keep data fresh from ESPN API
3. **User Interaction**: Frontend calls `/api/simulate` with score overrides
4. **Standings Calculation**: Tiebreaker engine processes games and returns standings

## Quick Start for AI Assistants

### **Documentation Navigation**

- **Domain-specific content**: [Quick Reference](./guides/quick-reference.md) - "If you need to test, go here", etc.
- **Full index**: [Navigation Hub](./navigation-hub.md) - Complete documentation directory

### **Essential Reading Order**

1. This document (`ai-guide.md`) - Core principles and architecture
2. [Quick Reference](./guides/quick-reference.md) - Domain-specific content locations
3. [API Reference](./guides/api-reference.md) - Complete endpoint documentation
4. Repository Structure (above) - Codebase organization

### **Before Writing Code**

- Verify patterns with actual codebase examples
- Check MongoDB schema definitions before database operations
- Consider Vercel serverless function timeout (60s Pro, 10s Hobby)
- Review existing helper functions before creating new ones

### **Before Running Tests**

- **Check dev server**: `curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Server running" || npm run dev`
- Pre-commit hook requires dev server running
- **Testing**: [Quick Reference](./guides/quick-reference.md) → Testing section

## Implementation Details

**Quick Reference**: See [Quick Reference](./guides/quick-reference.md) for domain-specific content locations.

### **Data Models**
- Game: `lib/models/Game.ts` - espnId, displayName, scores, odds, predictedScore
- Team: `lib/models/Team.ts` - ESPN ID as _id, records, rankings, season averages
- Types: `lib/types.ts` - GameLean, TeamLean, ReshapedGame

### **ESPN API Integration**
- Client: `lib/espn-client.ts` - ESPNClient (scoreboard, team, records)
- Generated Types: `lib/espn/*-generated.ts` - Auto-generated from ESPN responses
- Reshape: `lib/reshape-games.ts`, `lib/reshape-teams.ts` - Transform ESPN → DB
- Constants: `lib/constants.ts` - SEC_TEAMS, SEC_CONFERENCE_ID (8)
- Type Generation: `scripts/extract-espn-types.ts` - Generate types from test DB
- Type Tracking: `scripts/extract-used-types.ts` - Track used ESPN fields
- Auto Updates: `.github/workflows/update-espn-types.yml` - Daily type regeneration

### **Tiebreaker Logic**
- Implementation: `lib/tiebreaker-helpers.ts` - SEC rules A-E
- Rules: A (head-to-head), B (common opponents), C (division), D (opponent win%), E (scoring margin)
- Testing: [Tiebreaker Testing](./tests/tiebreaker-and-simulate.md)

### **Cron Jobs**
- Auth: `Bearer ${CRON_SECRET}` header required
- Schedules: `vercel.json` (Hobby), `vercel.pro.json` (Pro)
- Response: `{ updated, checked, espnCalls, lastUpdated, errors? }`
- Testing: [Cron Jobs Testing](./tests/cron-jobs-testing.md)

### **Development Constraints**

- **Vercel Timeouts**: 60s for Pro plan, 10s for Hobby plan
- **ESPN API**: No official rate limits, but use 500ms delays between requests
- **MongoDB**: Serverless connection pooling managed by `/lib/mongodb.ts` singleton
- **Cron Limits**: Hobby plan = 2 jobs daily, Pro plan = unlimited frequency

## Essential Pattern Recognition

### **Key Patterns to Recognize**

- **API Route Structure**: `export const POST/GET = async (request: NextRequest) => { ... }`
- **Database Connection**: `await dbConnect()` before any DB operation
- **ESPN API**: `espnClient.getScoreboard()` / `getTeam()` / `getTeamRecords()`
- **Data Transformation**: `reshapeScoreboardData()` → Database format
- **Error Logging**: `ErrorLog.create({ timestamp, endpoint, payload, error, stackTrace })`
- **Cron Authentication**: `authHeader === \`Bearer ${process.env.CRON_SECRET}\``
- **Type Casting**: `.lean<GameLean[]>()` for MongoDB queries with type safety

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

**Key Rules:**

- Use `const ComponentName = () => {}` syntax (arrow function)
- Export using `export default ComponentName` (separate from declaration)
- Import using `import ComponentName from './ComponentName'` (default import)
- Apply this pattern to ALL components in `app/components/` directory
- Apply to page components in `app/` directory (e.g., `page.tsx`)

**Example:**

```typescript
'use client';

import { useState } from 'react';

const MyComponent = () => {
  const [state, setState] = useState(false);

  return <div>Content</div>;
};

export default MyComponent;
```

**Why this pattern:**

- Consistent code style across all frontend components
- Easier to refactor and maintain
- Clear separation between component definition and export
- Matches Next.js App Router conventions

### **Type Definition Pattern**

**NEVER use inline literal union types. Always define types/interfaces:**

```typescript
// ❌ BAD - Inline literal type
const [mode, setMode] = useState<'light' | 'dark'>('light');
state: 'pre' | 'in' | 'post';

// ✅ GOOD - Defined type
export type ThemeMode = 'light' | 'dark';
export type GameState = 'pre' | 'in' | 'post';

const [mode, setMode] = useState<ThemeMode>('light');
state: GameState;
```

**Key Rules:**

- Define all literal union types as `type` or `interface` in appropriate type files
- Frontend-specific types go in `types/frontend.ts`
- Backend/shared types go in `lib/types.ts` or `lib/api-types.ts`
- Import and use the defined type instead of inline literals
- Apply to ALL literal union types (e.g., `'light' | 'dark'`, `'pre' | 'in' | 'post'`)

**Example:**

```typescript
// types/frontend.ts
export type ThemeMode = 'light' | 'dark';

// lib/types.ts
export type GameState = 'pre' | 'in' | 'post';

// Component usage
import { ThemeMode } from '@/types/frontend';
const [mode, setMode] = useState<ThemeMode>('light');
```

**Why this pattern:**

- Single source of truth for type definitions
- Easier to refactor and maintain
- Better IDE autocomplete and type checking
- Consistent type usage across codebase

### **Common Helper Functions**

- **calculatePredictedScore**: Generates predicted scores from spread + team averages
- **applyOverrides**: Validates and applies user score predictions
- **calculateStandings**: Full tiebreaker engine execution
- **getTeamRecord**: Calculates wins/losses from game list

## SEC Tiebreaker Terminology

### **Database Fields**

- **espnId**: ESPN's unique identifier for games (used as primary key)
- **displayName**: Game identifier format "{away abbrev} @ {home abbrev}" (e.g., "UGA @ ALA")
- **conferenceGame**: Boolean flag for SEC vs SEC matchups
- **predictedScore**: Calculated score object `{ home: number, away: number }`
- **state**: Game status ("pre", "in", "post")

### **SEC Conference**

- **SEC_TEAMS**: 16 team abbreviations (ALA, ARK, AUB, FLA, UGA, UK, LSU, MISS, MSST, MIZ, OU, SC, TENN, TEX, TA&M, VAN)
- **SEC_CONFERENCE_ID**: 8 (used in ESPN API queries)
- **Conference Record**: Wins-losses in games where both teams are SEC members

### **ESPN API Specifics**

- **Site API**: Consumer-facing data (teams, scoreboards, rankings)
- **Core API**: Detailed statistics (avgPointsFor, avgPointsAgainst, record breakdowns)
- **Conference ID Inconsistency**: Scoreboard uses "8", Team API returns "80" in some fields

### **Tiebreaker Rules**

- **Rule A**: Head-to-head record (requires at least 2 games played among tied teams)
- **Rule B**: Common opponents (minimum 4 common opponents played by all tied teams)
- **Rule C**: Highest-placed common opponent in preliminary standings
- **Rule D**: Cumulative opponent win percentage
- **Rule E**: Relative scoring margin with caps (offensive: 42, defensive: 48)

## Development Decision Points

### **For New Features**

- **API Endpoint**: Which endpoint best fits the feature (simulate, games, or new endpoint)?
- **Data Source**: ESPN API, MongoDB query, or calculated field?
- **Real-Time Updates**: Does it need cron job updates?
- **Authentication**: Does it need `CRON_SECRET` protection?

### **Implementation Checklist**

1. **Define types** in `/lib/api-types.ts` for request/response
2. **Create API route** in `/app/api/[feature]/route.ts`
3. **Add helper functions** in appropriate `/lib/*.ts` file
4. **Update MongoDB schemas** if database changes needed
5. **Document in** `/docs/guides/api-reference.md`
6. **Add tests** to appropriate `/docs/tests/*.md` file
7. **Validate and test** - Run `npm run lint`, `npx tsc --noEmit`, and `npm run test:all` before any file deletions
8. **Delete files last** - Only delete unused files after all changes are complete, tested, and verified working

## Documentation Structure

See [Quick Reference](./guides/quick-reference.md) for domain-specific locations.

**Key Docs:**
- API: `docs/guides/api-reference.md`
- Testing: `docs/tests/` (comprehensive-api-testing, cron-jobs-testing, etc.)
- ESPN: `docs/tests/espn-api-testing.md`, `docs/tests/espn-data-pipeline.md`
- Planning: `docs/plans/*.md` (⚠️ Historical - may not match implementation)

## Critical Accuracy Notes

### **ESPN API Quirks**

- **Conference ID**: Scoreboard API uses "8", Team API may return "80"
- **Record Types**: Use `name` for overall ("overall"), `type` for others ("homerecord", "awayrecord", "vsconf")
- **Ranking Values**: 99 or null means unranked
- **Future Seasons**: Core API may return null for upcoming seasons (fall back to Site API)

### **Cron Schedule Format**

- **`0 13-5 * * *`**: Hour range that wraps midnight (13-23, then 0-5 UTC = 17 hours)
- **`*/5 21-23,0-6 * * 4-5`**: Every 5 minutes, multiple hour ranges, specific days

### **Data Integrity**

- **predictedScore**: Recalculated by cron jobs on every update
- **displayName**: Format must be "{away} @ {home}" with team abbreviations
- **Team IDs**: ESPN team IDs used as MongoDB `_id` (no separate mapping table)

---

**This guide provides the essential foundation for AI assistants to work effectively with the SEC Tiebreaker application while respecting technical constraints and ensuring accurate implementation of SEC conference tiebreaker rules.**
