# API Reference: Cron Jobs

**Status**: ⚠️ Mostly Obsolete - Data cron jobs removed, type generation remains

All scheduled data update cron jobs have been replaced with on-demand API endpoints with frontend polling.

**Remaining Scheduled Workflow:**
- **GitHub Actions**: `.github/workflows/update-espn-types.yml` - ESPN type generation (runs daily at 02:15 UTC / 10:15 PM ET)

**Current Data Architecture:**
- **POST /api/games/[sport]/[conf]** - On-demand game data fetching
- **POST /api/games/[sport]/[conf]/live** - Live game updates
- **POST /api/games/[sport]/[conf]/spreads** - Spread/odds updates
- Frontend polling drives all data updates using RTK Query

**See:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)
