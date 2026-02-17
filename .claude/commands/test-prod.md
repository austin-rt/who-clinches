# test-prod

**⚠️ CAUTION: This tests production and WILL modify production data.**

## Prerequisites

- ✅ Preview environment tests completed successfully
- ✅ All preview tests passed with 100% accuracy
- ✅ User explicitly approved production testing

## Testing Guide

**Important:**

- Start conservative with single team/week tests before full data loads
- Use the provided **Response Type Verification** commands in the guide to confirm responses match `lib/api-types.ts` type definitions (especially `TeamMetadata` which includes `color` and `alternateColor` fields, and `StandingEntry` which includes `color` field)

## Environment Configuration

**Branch**: `main` (auto-deploys to production)

**Environment Variables:**

```bash
BASE_URL="https://sec-tiebreaker-git-main-austinrts-projects.vercel.app"
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
curl "https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/api/games?season=2025&conferenceId=8&x-vercel-protection-bypass=${BYPASS_TOKEN}" | jq .
```

**Test POST /api/simulate:**
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl -X POST "https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}' | jq .
```


**Verify TeamMetadata structure:**
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl -s "https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/api/games?season=2025&conferenceId=8&x-vercel-protection-bypass=${BYPASS_TOKEN}" | jq -r 'if .teams[0] | has("color") and has("alternateColor") and has("id") and has("abbrev") and has("displayName") and has("logo") then "✅ TeamMetadata: All 6 required fields present" else "❌ TeamMetadata: Missing required fields" end'
```

**Verify StandingEntry structure:**
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl -s -X POST "https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/api/simulate?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}' | jq -r 'if .standings[0] | has("color") and has("rank") and has("teamId") and has("abbrev") and has("displayName") and has("logo") and has("record") and has("confRecord") and has("explainPosition") then "✅ StandingEntry: All 9 required fields present" else "❌ StandingEntry: Missing required fields" end'
```

## Notes

- `BYPASS_TOKEN` required for protected Vercel deployment
- All credentials read from `.env.local`
- **⚠️ Production testing - use with caution**

