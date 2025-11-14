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
│   └── Team.ts                  # Team data model
├── api-types.ts                 # Request/response interfaces
├── constants.ts                 # SEC_TEAMS, conference IDs, constants
├── espn-client.ts               # ESPN API client
├── mongodb.ts                   # MongoDB connection singleton
├── prefill-helpers.ts           # Predicted score calculation
├── reshape-games.ts             # ESPN scoreboard data transformation
├── reshape-teams.ts             # ESPN team data transformation
├── tiebreaker-helpers.ts        # SEC tiebreaker rules A-E implementation
└── types.ts                     # Internal application types

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

**Not sure where to find something?** Use the [Documentation Navigation Hub](./navigation-hub.md) to quickly locate any guide, reference, or historical document in this repository.

The navigation hub provides:

- Quick links to common tasks ("I want to...")
- Complete file location reference
- Search guide by topic or problem
- Guidance for adding new documentation

### **Essential Reading Order**

1. **Start Here**: `/docs/ai-guide.md` - This document for core principles and architecture
2. **Find What You Need**: `/docs/navigation-hub.md` - Documentation directory and search guide
3. **API Documentation**: `/docs/guides/api-reference.md` - Complete endpoint reference
4. **Code Organization**: See Repository Structure above for file purposes

### **First 5 Minutes**

- Review [Application Overview](#application-overview) for context
- Understand [Key Concepts](#key-concepts) - conference games, tiebreakers, predicted scores
- Check [Repository Structure](#repository-structure) for codebase organization
- Note [Development Constraints](#development-constraints) - ESPN API limitations, Vercel timeouts

### **Before Writing Code**

- Verify patterns with actual codebase examples
- Check MongoDB schema definitions before database operations
- Consider Vercel serverless function timeout (60s Pro, 10s Hobby)
- Review existing helper functions before creating new ones

### **Before Running Tests**

- **Check if dev server is running** (required for `npm run test:all` and `npm run db:check`):
  ```bash
  curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Server running" || npm run dev
  ```
- If server is not running, start it with `npm run dev` before running tests
- The pre-commit hook expects the dev server to be running - ensure it's started before committing

## Finding Implementation Details

### **Data Models**

- **Game Schema**: `/lib/models/Game.ts` - espnId, displayName, scores, odds, predictedScore
- **Team Schema**: `/lib/models/Team.ts` - ESPN ID as \_id, records, rankings, season averages
- **Type Definitions**: `/lib/types.ts` - GameLean, TeamLean, ReshapedGame interfaces

### **ESPN API Integration**

- **Client**: `/lib/espn-client.ts` - ESPNClient class with scoreboard, team, and records methods
- **Reshaping**: `/lib/reshape-games.ts` and `/lib/reshape-teams.ts` - Transform ESPN data to our schema
- **Constants**: `/lib/constants.ts` - SEC_TEAMS array, SEC_CONFERENCE_ID (8), record type constants

### **Tiebreaker Logic**

- **Implementation**: `/lib/tiebreaker-helpers.ts` - All SEC rules A-E
- **Rule A**: Head-to-head record
- **Rule B**: Record vs common conference opponents
- **Rule C**: Record within division (highest-placed common opponent)
- **Rule D**: Cumulative opponent win percentage
- **Rule E**: Relative scoring margin (capped)

### **Cron Jobs**

- **Authentication**: All require `Bearer ${CRON_SECRET}` header
- **Schedules**: Defined in `vercel.json` (Hobby) and `vercel.pro.json` (Pro)
- **Response Format**: Consistent `{ updated, checked, espnCalls, lastUpdated, errors? }`

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

## Documentation Structure

### **Reference Documentation**

- **`/docs/guides/api-reference.md`**: Complete API endpoint documentation
- **`/docs/guides/changelog-guide.md`**: How to maintain the changelog
- **`/docs/tests/espn-api-testing.md`**: ESPN API patterns and field mappings

### **Testing Documentation**

- **`/docs/tests/comprehensive-api-testing.md`**: API endpoint testing procedures
- **`/docs/tests/espn-data-pipeline.md`**: Data ingestion testing procedures
- **`/docs/tests/cron-jobs-testing.md`**: Cron job validation procedures
- **`/docs/tests/tiebreaker-and-simulate.md`**: Tiebreaker logic testing

### **Planning Documents** (Historical Reference)

- **`/docs/plans/*.md`**: Original planning documents - may not match current implementation
- **`/docs/plans/archive/*.md`**: Completed work records and phase summaries
- All planning docs now marked with **"⚠️ PLANNING DOCUMENT"** warnings

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
