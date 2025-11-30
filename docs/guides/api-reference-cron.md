# API Reference: Cron Jobs

**Related:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)

---

## Migration to On-Demand Architecture

All scheduled cron jobs have been replaced with on-demand API endpoints:

- **POST /api/games/[sport]/[conf]** - Fetches from ESPN, upserts games, returns data (replaces update-games cron)
- **POST /api/games/[sport]/[conf]/live** - Lightweight live game updates (scores/status only)
- **POST /api/games/[sport]/[conf]/spreads** - Spread/odds updates only
- Frontend polling drives all updates using RTK Query with conditional polling (every 5 min when games are active)

**Remaining Scheduled Workflow:**
- **GitHub Actions**: `.github/workflows/update-espn-types.yml` - Type generation (runs daily at 10 PM ET)

---

**See also:** [Main API Reference](./api-reference.md) | [Data Endpoints](./api-reference-data.md)
