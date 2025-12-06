# test-preview

## Testing Guide

Follow all testing procedures in `docs/tests/comprehensive-api-testing.md`

**Important:** Use the provided **Response Type Verification** commands in the guide to confirm responses match `lib/api-types.ts` type definitions (especially `TeamMetadata` which includes `color` and `alternateColor` fields, and `StandingEntry` which includes `color` field).

## Environment Configuration

**Branch**: `develop` (auto-deploys to Vercel preview)

**Environment Variables:**

```bash
BASE_URL="https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app"
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
```

## Prerequisites

1. **Wait for deployment to finish:**
   ```bash
   echo "Waiting 2 minutes for deployment to finish..."
   sleep 120
   ```
   This gives the Vercel deployment time to complete before testing.


## Quick Test Commands

**Test GET /api/games:**
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl "https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/api/games/cfb/SEC?season=2025&x-vercel-protection-bypass=${BYPASS_TOKEN}" | jq .
```

**Test POST /api/simulate:**
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl -X POST "https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/api/simulate/cfb/SEC?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "overrides": {}}' | jq .
```


**Verify TeamMetadata structure:**
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl -s "https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/api/games/cfb/SEC?season=2025&x-vercel-protection-bypass=${BYPASS_TOKEN}" | jq -r 'if .teams[0] | has("color") and has("alternateColor") and has("id") and has("abbrev") and has("displayName") and has("logo") then "✅ TeamMetadata: All 6 required fields present" else "❌ TeamMetadata: Missing required fields" end'
```

**Verify StandingEntry structure:**
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl -s -X POST "https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/api/simulate/cfb/SEC?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "overrides": {}}' | jq -r 'if .standings[0] | has("color") and has("rank") and has("teamId") and has("abbrev") and has("displayName") and has("logo") and has("record") and has("confRecord") and has("explainPosition") then "✅ StandingEntry: All 9 required fields present" else "❌ StandingEntry: Missing required fields" end'
```

## Notes

- `BYPASS_TOKEN` required for protected Vercel deployment
- All credentials read from `.env.local`
- Preview environment auto-deploys from `develop` branch on push

