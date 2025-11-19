# API Foundation Architecture

> **⚠️ PLANNING DOCUMENT - HISTORICAL REFERENCE**
> Implementation complete. For current API docs, see [API Reference](../guides/api-reference.md)

---

## Core Architecture

**Status:** ✅ Foundation Complete

**Stack:** Next.js 16 (App Router), TypeScript, MongoDB (Mongoose), ESPN API

---

## Key Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /api/games` | Query game data | ✅ Active |
| `POST /api/pull-games` | Ingest ESPN game data | ✅ Active |
| `POST /api/pull-teams` | Ingest ESPN team data | ✅ Active |
| `POST /api/simulate` | Calculate standings | ✅ Active |

**Cron Jobs:** See [API Reference - Cron Jobs](../guides/api-reference-cron.md)

---

## Data Models

- **`lib/models/Game.ts`** - Game schema (ESPN ID as primary key)
- **`lib/models/Team.ts`** - Team schema (rich ESPN data)
- **`lib/models/Error.ts`** - Error logging

**Database Environments:** `/dev`, `/test`, `/prod`

---

## ESPN Integration

- **`lib/espn-client.ts`** - Multi-sport ESPN API client
- **`lib/reshape-games.ts`** - Game data transformation
- **`lib/reshape-teams.ts`** - Team data transformation

**Conference ID:** `8` (SEC) for scoreboard API

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **ESPN IDs as primary keys** | Eliminates ID mapping complexity |
| **Store rich ESPN data** | Don't calculate what ESPN provides |
| **Multi-sport ready** | Client supports football/basketball/etc |
| **Null semantics** | `null` = "no data", `undefined` = "not fetched" |
| **Separate updates** | Games + teams updated independently |

---

**For current implementation details, see [API Reference](../guides/api-reference.md).**
