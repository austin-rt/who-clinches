# Quick Reference Guide

Domain-specific content locations for common tasks.

## Testing

- **Quick commands**: `docs/guides/testing-quick-reference.md`
- **API testing procedures**: `docs/tests/comprehensive-api-testing.md`
- **Cron job testing**: `docs/tests/cron-jobs-testing.md` (historical - cron endpoints removed)
- **ESPN API testing**: `docs/tests/espn-api-testing.md`
- **Tiebreaker testing**: `docs/tests/tiebreaker-and-simulate.md`
- **Pre-commit setup**: `docs/guides/pre-commit-testing.md`
- **Test data management**: Implemented - see `__tests__/helpers/test-data-loader.ts` and `app/api/cron/update-test-data/route.ts` (test data endpoint only)
- **Unit tests plan**: `docs/plans/unit-tests.md`

## API Development

- **Endpoint reference**: `docs/guides/api-reference.md`
- **API architecture**: `docs/plans/api-foundation.md` (historical reference)
- **Request/response types**: `lib/api-types.ts`

## ESPN Integration

- **API patterns**: `docs/tests/espn-api-testing.md`
- **Data pipeline**: `docs/tests/espn-data-pipeline.md`
- **Type generation workflow**: `docs/tests/generated-types-workflow-testing.md`
- **Client code**: `lib/cfb/espn-client.ts` (CFB-specific)
- **Reshape functions**: `lib/reshape-games.ts` (generic), `lib/reshape-teams.ts` (generic)

## Tiebreaker Logic

- **Official Rules (SINGULAR SOURCE OF TRUTH)**: `docs/tiebreaker-rules/*.txt` - NEVER edit these files. They are extracted from official Conference sources.
- **Implementation**: `lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts` - Must enforce rules exactly as specified in the rules files
- **Extraction Script**: `scripts/extract-sec-rules.py` - Example script that fetches latest PDF from conference sources and extracts text
- **Planning doc**: `docs/plans/tiebreaker-logic.md` (historical)
- **Testing**: `docs/tests/tiebreaker-and-simulate.md`
- **Simulate endpoint**: `app/api/simulate/[sport]/[conf]/route.ts` (e.g., `app/api/simulate/cfb/sec/route.ts`)

## Data Updates

- **Architecture**: On-demand API endpoints with frontend polling
- **API reference**: `docs/guides/api-reference.md` (Data Endpoints section)
- **Frontend polling**: `app/hooks/useGamesData.ts` - Conditional polling based on game states
- **Migration notes**: `docs/guides/api-reference-cron.md`

## Data Models

- **Game schema**: `lib/models/Game.ts`
- **Team schema**: `lib/models/Team.ts`
- **Type definitions**: `lib/types.ts`

## Frontend Development

- **Frontend documentation**: `docs/guides/frontend/` - Complete frontend patterns and architecture
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
| ESPN client | `lib/cfb/espn-client.ts` (CFB-specific) |
| Tiebreaker logic | `lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers.ts` (SEC-specific) |
| Tiebreaker rules (source of truth) | `docs/tiebreaker-rules/*.txt` |
| Constants | `lib/constants.ts` (sports and conference configuration) |
| Reshape games | `lib/reshape-games.ts` (generic) |
| Reshape teams | `lib/reshape-teams.ts` (generic) |
| Reshape teams from scoreboard | `lib/reshape-teams-from-scoreboard.ts` (generic) |
| Prefill helpers | `lib/cfb/helpers/prefill-helpers.ts` (CFB-specific) |
| Season check | `lib/cfb/helpers/season-check-espn.ts` (CFB-specific) |
| Types | `lib/types.ts`, `lib/api-types.ts` |
| Tests | `__tests__/` |
| Frontend polling | `app/hooks/useGamesData.ts` |

