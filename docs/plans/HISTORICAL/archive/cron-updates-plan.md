# Cron Job Updates: Spreads & Predicted Scores

> **⚠️ HISTORICAL PLANNING DOCUMENT - DO NOT USE FOR CURRENT IMPLEMENTATION**
> 
> This document was created during planning phase. For actual implementation details, refer to:
> - Actual code in `/app/api/cron/` endpoints
> - `/docs/guides/api-reference-cron.md` for current API documentation
> - `/lib/constants.ts` for actual constant definitions

## Historical Context

This document planned the enhancement of cron jobs to update game spreads and calculate `predictedScore` fields for all games. The implementation addressed:

1. **Vercel Plan Constraints**: Hobby plan (2 crons max, daily) vs Pro plan (unlimited frequency)
2. **Spread Updates**: Daily updates from ESPN scoreboard data
3. **Predicted Score Calculation**: Use real scores if available, otherwise calculate from spread + team averages
4. **Implementation Strategy**: Separate config files for Hobby vs Pro (`vercel.json` vs `vercel.pro.json`)

## Key Design Decisions

- **Hobby Mode**: Daily batch updates via `update-all` endpoint
- **Pro Mode**: Granular cron jobs (`update-games`, `update-spreads`, `update-rankings`, `update-team-averages`)
- **Predicted Score**: Calculated during reshape if odds available, otherwise from team averages + home field advantage
- **Zero Code Changes**: Upgrade path from Hobby to Pro requires only config file swap

## Implementation Status

✅ **Completed** - All planned features implemented. See current codebase and API documentation for details.

---

**Note**: This document is preserved for historical reference only. Do not use for current development.
