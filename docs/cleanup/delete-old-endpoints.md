# Delete Old Endpoints - Post-Testing Checklist

**Status**: ⏳ Waiting for testing completion

**Purpose**: After confirming the new on-demand API architecture works correctly, delete all old endpoints and related code. No deprecation - only deletion.

## Files to Delete

### 1. Cron Endpoints (Entire Directory)
- `app/api/cron/` - **DELETE ENTIRE DIRECTORY**
  - `app/api/cron/[sport]/[conf]/update-games/route.ts`
  - `app/api/cron/[sport]/[conf]/update-rankings/route.ts`
  - `app/api/cron/[sport]/[conf]/update-spreads/route.ts`
  - `app/api/cron/[sport]/[conf]/update-team-averages/route.ts`
  - `app/api/cron/update-all/route.ts`
  - `app/api/cron/update-test-data/route.ts`
  - `app/api/cron/run-reshape-tests/route.ts`

### 2. Pull Endpoints
- `app/api/pull-games/[sport]/[conf]/route.ts` - **DELETE**
- `app/api/pull-teams/[sport]/[conf]/route.ts` - **DELETE**

### 2b. Teams Endpoint (Not Used)
- `app/api/teams/[sport]/[conf]/route.ts` - **DELETE**
  - **Reason**: Rankings come from games endpoint (`game.home.rank`, `game.away.rank`)
  - **Note**: Frontend doesn't use this endpoint - rankings are already in game data

### 3. Test Files to Delete
- `__tests__/api/cron.test.ts` - **DELETE** (already skipped, but delete completely)
- `__tests__/api/cfb/teams.test.ts` - **DELETE** (teams endpoint being removed)

### 4. Test Files to Rename ✅ COMPLETED
- ✅ `__tests__/api/cfb/pull-games.test.ts` → `__tests__/api/cfb/games.test.ts`
  - ✅ Updated describe block: `'GET /api/games/cfb/%s'` → `'POST /api/games/cfb/%s'`
- ✅ `__tests__/api/cfb/pull-teams.test.ts` → `__tests__/api/cfb/teams.test.ts`
  - ✅ Updated describe block: `'GET /api/teams/cfb/%s'` → `'POST /api/teams/cfb/%s'`

### 5. Configuration Files
- Check `vercel.pro.json` if it exists - remove `crons` array if present
- `vercel.json` is already clean (empty `{}`)

### 6. Environment Variables (Optional Cleanup)
- `CRON_SECRET` - Can be removed from environment (no longer needed)
- Note: Keep in secrets for now in case of rollback, but can be removed after deletion

## Code References to Remove

### Internal References (in remaining code)
- Any imports of cron endpoint functions
- Any references to `pull-games` or `pull-teams` endpoints
- Any references to `/api/teams` endpoint
- Error messages mentioning old endpoints
- `TeamsResponse` interface in `lib/api-types.ts` (if not used elsewhere - check for other usages)

### Documentation References
- Update any docs that reference old endpoints
- Update API reference docs

## Verification Steps

Before deletion:
- [ ] All new endpoints tested and working
- [ ] Frontend polling working correctly
- [ ] No errors in production logs
- [ ] All tests passing

After deletion:
- [ ] Build passes
- [ ] All tests pass
- [ ] No broken imports
- [ ] No 404s in production logs

## Notes

- **No deprecation period** - delete immediately after testing confirms new architecture works
- **Test files**: The `pull-games.test.ts` and `pull-teams.test.ts` files actually test the NEW endpoints, just with misleading names. Rename them rather than deleting.
- **Error messages**: Some test helper files reference `/api/cron/update-test-data` in error messages - these are just informational notes and can stay (they're not actual endpoint calls)

