# Quick Reference Guide

Domain-specific content locations for common tasks.

## Testing

- **Quick commands**: `docs/guides/testing-quick-reference.md`
- **Pre-commit setup**: `docs/guides/pre-commit-testing.md`

## API Development

- **Endpoint reference**: `docs/guides/api-reference.md`
- **Data endpoints**: `docs/guides/api-reference-data.md`
- **Stats endpoints**: `docs/guides/api-reference-stats.md`
- **Request/response types**: `lib/api-types.ts`

## CFBD Integration

- **REST API client**: `lib/cfb/cfbd-rest-client.ts`
- **GraphQL API client**: `lib/cfb/cfbd-graphql-client.ts`
- **Unified client**: `lib/cfb/cfbd-client.ts` (switches between REST/GraphQL based on season)
- **Redis-backed data access**: `lib/cfb/cfbd-cached.ts` (getTeams, getGames, getRankings, getSp, getFpi)
- **Redis primitive**: `lib/redis.ts` (shared `fetch<T>` cache-aside pattern, production and preview when `UPSTASH_REDIS_*` are set)
- **Rate limiting**: `middleware.ts` (per-IP via `@upstash/ratelimit`, production and preview)
- **Reshape functions**: `lib/reshape-games.ts` (generic), `lib/reshape-teams-from-cfbd.ts` (generic)

## Tiebreaker Logic

- **Official Rules (SINGULAR SOURCE OF TRUTH)**: `docs/tiebreaker-rules/*.txt` - NEVER edit these files. They are extracted from official Conference sources.
- **Implementation**: Modular system with common rules (`lib/cfb/tiebreaker-rules/common/`), core engine (`lib/cfb/tiebreaker-rules/core/`), and conference configs (`lib/cfb/tiebreaker-rules/{conf}/config.ts`) - Must enforce rules exactly as specified in the rules files
- **Extraction Script**: `scripts/extract-sec-rules.py` - Example script that fetches latest PDF from conference sources and extracts text
- **External Analytics**: `docs/guides/external-analytics-by-conference.md` - What each conference requires vs. what CFBD provides
- **Simulate endpoint**: `app/api/simulate/[sport]/[conf]/route.ts` (dynamic endpoint supporting multiple conferences)

## Database

- **Prisma client**: `lib/db/client.ts` (singleton pattern)
- **Schema**: `prisma/schema.prisma` (PostgreSQL via Neon)
- **Migrations**: `prisma/migrations/`
- **Models**: `SimulationSnapshot` (shareable simulation results with hash dedup), `RuntimeConfig` (admin dashboard toggle state, singleton row)
- **Commands**: `npm run db:migrate:dev` (local), `npm run db:migrate:deploy` (prod), `npm run db:check` (validate)

## Admin Dashboard

- **Page**: `app/admin/page.tsx` (runtime config toggles, CFBD status, Redis inspector)
- **Layout**: `app/admin/layout.tsx` (minimal layout without main site nav)
- **Runtime config**: `lib/admin/runtime-config.ts` (getRuntimeConfig/updateRuntimeConfig with 5s cache, production short-circuit)
- **Environment gating**: `lib/admin/is-admin-allowed.ts`, `middleware.ts` (404 in production)
- **Fixture years**: `lib/admin/fixture-years.ts` (available fixture year list)
- **API routes**: `/api/admin/config` (GET/PATCH), `/api/admin/flush-redis` (POST), `/api/admin/clear-db` (POST), `/api/admin/cfbd-status` (GET), `/api/admin/redis-keys` (GET/DELETE)
- **Toggle cascades**: Fixture year ON → Redis OFF + Rate Limiting OFF; Redis toggle → flush cache; In-Season toggle → flush cache; GraphQL ON (outside season) → In-Season Override ON

## Data Models

- **API types**: `lib/api-types.ts`
- **Internal types**: `lib/types.ts`
- **CFBD types**: Imported from `cfbd` package

## Frontend Development

- **Frontend documentation**: `docs/guides/frontend/` - Complete frontend patterns and architecture
- **Components**: `app/components/`
- **Store**: `app/store/`

## Project Setup

- **AI guide**: `docs/ai-guide.md`
- **AI loading manifest**: `docs/ai-loading-manifest.md`
- **Changelog guide**: `docs/guides/changelog-guide.md`
- **Pre-commit testing**: `docs/guides/pre-commit-testing.md`

## Common Commands

```bash
# Testing
npm run test                  # All tests

# Development
npm run dev                   # Start dev server
npm run lint                  # Run ESLint

# Database
npm run db:migrate:dev        # Create/apply migrations locally
npm run db:migrate:deploy     # Apply migrations in prod
npm run db:check              # Validate schema

# Cache Flush
npm run flush:redis:dev       # Flush dev Redis cache
npm run flush:redis:prod      # Flush prod Redis cache
npm run flush:redis:all       # Flush all Redis caches
npm run flush:next            # Flush Next.js cache
npm run flush:cache           # Flush both Redis (dev) and Next.js cache

# Build
npm run build                 # prisma generate && next build
```

## File Locations

| Need                               | Location                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API endpoints                      | `app/api/`                                                                                                                                                                     |
| Redis cache primitive              | `lib/redis.ts`                                                                                                                                                                 |
| CFBD cached data access            | `lib/cfb/cfbd-cached.ts`                                                                                                                                                       |
| CFBD REST client                   | `lib/cfb/cfbd-rest-client.ts`                                                                                                                                                  |
| CFBD GraphQL client                | `lib/cfb/cfbd-graphql-client.ts`                                                                                                                                               |
| CFBD unified client                | `lib/cfb/cfbd-client.ts`                                                                                                                                                       |
| Rate limiting                      | `middleware.ts`                                                                                                                                                                |
| Admin dashboard                    | `app/admin/page.tsx`, `lib/admin/runtime-config.ts`, `app/api/admin/`                                                                                                          |
| Tiebreaker logic                   | Modular system: `lib/cfb/tiebreaker-rules/common/` (common rules), `lib/cfb/tiebreaker-rules/core/` (engine), `lib/cfb/tiebreaker-rules/{conf}/config.ts` (conference configs) |
| Tiebreaker rules (source of truth) | `docs/tiebreaker-rules/*.txt`                                                                                                                                                  |
| Constants                          | `lib/constants.ts` (sports and conference configuration)                                                                                                                       |
| Reshape games                      | `lib/reshape-games.ts`                                                                                                                                                         |
| Reshape teams from CFBD            | `lib/reshape-teams-from-cfbd.ts`                                                                                                                                               |
| Prefill helpers                    | `lib/cfb/helpers/prefill-helpers.ts`                                                                                                                                           |
| Season check                       | `lib/cfb/helpers/season-check-cfbd.ts`                                                                                                                                         |
| Types                              | `lib/types.ts`, `lib/api-types.ts`                                                                                                                                             |
| Database client                    | `lib/db/client.ts`                                                                                                                                                             |
| Prisma schema                      | `prisma/schema.prisma`                                                                                                                                                         |
| Share API                          | `app/api/share/[sport]/[conf]/route.ts`                                                                                                                                        |
| Results page                       | `app/results/[id]/page.tsx`                                                                                                                                                    |
| OG image generation                | `app/results/[id]/opengraph-image.tsx`                                                                                                                                         |
| Tests                              | `__tests__/`                                                                                                                                                                   |
| Frontend data loading              | `app/hooks/useGamesData.ts`                                                                                                                                                    |
