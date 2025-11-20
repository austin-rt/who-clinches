# Quick Reference Guide

Domain-specific content locations for common tasks.

## Testing

- **Quick commands**: `docs/guides/testing-quick-reference.md`
- **API testing procedures**: `docs/tests/comprehensive-api-testing.md`
- **Cron job testing**: `docs/tests/cron-jobs-testing.md`
- **ESPN API testing**: `docs/tests/espn-api-testing.md`
- **Tiebreaker testing**: `docs/tests/tiebreaker-and-simulate.md`
- **Pre-commit setup**: `docs/guides/pre-commit-testing.md`
- **Test data management**: `docs/plans/test-data-snapshots.md`, `docs/plans/test-data-auto-retesting.md`
- **Unit tests plan**: `docs/plans/unit-tests.md`

## API Development

- **Endpoint reference**: `docs/guides/api-reference.md`
- **API architecture**: `docs/plans/api-foundation.md` (historical reference)
- **Request/response types**: `lib/api-types.ts`

## ESPN Integration

- **API patterns**: `docs/tests/espn-api-testing.md`
- **Data pipeline**: `docs/tests/espn-data-pipeline.md`
- **Type generation workflow**: `docs/tests/generated-types-workflow-testing.md`
- **Client code**: `lib/espn-client.ts`
- **Reshape functions**: `lib/reshape-games.ts`, `lib/reshape-teams.ts`

## Tiebreaker Logic

- **Implementation**: `lib/tiebreaker-helpers.ts`
- **Planning doc**: `docs/plans/tiebreaker-logic.md` (historical)
- **Testing**: `docs/tests/tiebreaker-and-simulate.md`
- **Simulate endpoint**: `app/api/simulate/route.ts`

## Cron Jobs

- **Testing**: `docs/tests/cron-jobs-testing.md`
- **API reference**: `docs/guides/api-reference.md` (Cron Jobs section)
- **Schedules**: `vercel.json` (Hobby), `vercel.pro.json` (Pro)

## Data Models

- **Game schema**: `lib/models/Game.ts`
- **Team schema**: `lib/models/Team.ts`
- **Type definitions**: `lib/types.ts`

## Frontend Development

- **Phase plans**: `docs/plans/frontend/`
- **Components**: `app/components/`
- **Store**: `app/store/`

## Project Setup

- **AI guide**: `docs/ai-guide.md`
- **AI loading manifest**: `docs/ai-loading-manifest.md`
- **Changelog guide**: `docs/guides/changelog-guide.md`
- **Pre-commit testing**: `docs/guides/pre-commit-testing.md`
- **Tech spec**: `docs/plans/tech-spec.md` (historical)

## Common Commands

```bash
# Testing
npm run test:all              # All tests
npm run test:api              # API tests only
npm run db:check              # Check/seed main DB

# Development
npm run dev                   # Start dev server
npm run lint                  # Run ESLint

# Database
npm run db:check              # Check/seed database
npm run test:db:check         # Check/seed test DB
```

## File Locations

| Need | Location |
|------|----------|
| API endpoints | `app/api/` |
| Data models | `lib/models/` |
| ESPN client | `lib/espn-client.ts` |
| Tiebreaker logic | `lib/tiebreaker-helpers.ts` |
| Constants | `lib/constants.ts` |
| Types | `lib/types.ts`, `lib/api-types.ts` |
| Tests | `__tests__/` |
| Cron schedules | `vercel.json`, `vercel.pro.json` |

