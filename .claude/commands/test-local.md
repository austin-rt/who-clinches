# test-local

## Testing Guide

Follow all testing procedures in `docs/tests/comprehensive-api-testing.md`

**Important:** Use the provided **Response Type Verification** commands in the guide to confirm responses match `lib/api-types.ts` type definitions (especially `TeamMetadata` which includes `color` and `alternateColor` fields, and `StandingEntry` which includes `color` field).

## Environment Configuration

**Branch**: `develop`

**Environment Variables:**

```bash
BASE_URL="http://localhost:3000"
DATABASE="dev"
BYPASS_TOKEN=""  # Not required for local
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
```

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   Server should be running on http://localhost:3000

2. **Check database seeding:**
   ```bash
   npm run db:check
   ```
   This will auto-seed the `dev` database if needed.

## Quick Test Commands

**Test GET /api/games:**
```bash
curl "http://localhost:3000/api/games?season=2025&conferenceId=8" | jq .
```

**Test POST /api/simulate:**
```bash
curl -X POST "http://localhost:3000/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}' | jq .
```

**Test GET /api/cron/update-all:**
```bash
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
curl -X GET "http://localhost:3000/api/cron/update-all" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq .
```

**Verify TeamMetadata structure:**
```bash
curl -s "http://localhost:3000/api/games?season=2025&conferenceId=8" | jq -r 'if .teams[0] | has("color") and has("alternateColor") and has("id") and has("abbrev") and has("displayName") and has("logo") then "✅ TeamMetadata: All 6 required fields present" else "❌ TeamMetadata: Missing required fields" end'
```

**Verify StandingEntry structure:**
```bash
curl -s -X POST "http://localhost:3000/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}' | jq -r 'if .standings[0] | has("color") and has("rank") and has("teamId") and has("abbrev") and has("displayName") and has("logo") and has("record") and has("confRecord") and has("explainPosition") then "✅ StandingEntry: All 9 required fields present" else "❌ StandingEntry: Missing required fields" end'
```

## Notes

- Local server must be running on port 3000
- `BYPASS_TOKEN` can be empty or omitted (not required for localhost)
- All credentials read from `.env.local`
- Database name: `dev` (uses `.env.local` with `MONGODB_DB=dev`)
- Use `npm run db:check` to verify and auto-seed database before testing

