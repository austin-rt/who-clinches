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
- **Reshape functions**: `lib/reshape-games.ts` (generic), `lib/reshape-teams-from-cfbd.ts` (generic)

## Tiebreaker Logic

- **Official Rules (SINGULAR SOURCE OF TRUTH)**: `docs/tiebreaker-rules/*.txt` - NEVER edit these files. They are extracted from official Conference sources.
- **Implementation**: Modular system with common rules (`lib/cfb/tiebreaker-rules/common/`), core engine (`lib/cfb/tiebreaker-rules/core/`), and conference configs (`lib/cfb/tiebreaker-rules/{conf}/config.ts`) - Must enforce rules exactly as specified in the rules files
- **Extraction Script**: `scripts/extract-sec-rules.py` - Example script that fetches latest PDF from conference sources and extracts text
- **External Analytics**: `docs/guides/external-analytics-by-conference.md` - What each conference requires vs. what CFBD provides
- **Simulate endpoint**: `app/api/simulate/[sport]/[conf]/route.ts` (dynamic endpoint supporting multiple conferences)

## Data Updates

- **Architecture**: Direct CFBD API fetching with GraphQL subscriptions for live updates
- **API reference**: `docs/guides/api-reference.md` (Data Endpoints section)
- **Frontend data loading**: `app/hooks/useGamesData.ts` - GraphQL subscriptions (Server-Sent Events) when in season, REST API when out of season

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
```

## File Locations

| Need | Location |
|------|----------|
| API endpoints | `app/api/` |
| CFBD REST client | `lib/cfb/cfbd-rest-client.ts` |
| CFBD GraphQL client | `lib/cfb/cfbd-graphql-client.ts` |
| CFBD unified client | `lib/cfb/cfbd-client.ts` |
| Tiebreaker logic | Modular system: `lib/cfb/tiebreaker-rules/common/` (common rules), `lib/cfb/tiebreaker-rules/core/` (engine), `lib/cfb/tiebreaker-rules/{conf}/config.ts` (conference configs) |
| Tiebreaker rules (source of truth) | `docs/tiebreaker-rules/*.txt` |
| Constants | `lib/constants.ts` (sports and conference configuration) |
| Reshape games | `lib/reshape-games.ts` |
| Reshape teams from CFBD | `lib/reshape-teams-from-cfbd.ts` |
| Prefill helpers | `lib/cfb/helpers/prefill-helpers.ts` |
| Season check | `lib/cfb/helpers/season-check-cfbd.ts` |
| Types | `lib/types.ts`, `lib/api-types.ts` |
| Tests | `__tests__/` |
| Frontend data loading | `app/hooks/useGamesData.ts` |

