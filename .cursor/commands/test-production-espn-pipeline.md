# test-production-espn-pipeline

**⚠️ CAUTION: This tests production and WILL modify production data.**

## Prerequisites

- ✅ Preview environment tests completed successfully
- ✅ All preview tests passed with 100% accuracy
- ✅ User explicitly approved production testing

## Testing Guide

Follow all testing procedures in `docs/tests/comprehensive-api-testing.md`

**Important:** Start conservative with single team/week tests before full data loads.

## Environment Configuration

**Branch**: `main` (auto-deploys to production)

**Environment Variables:**
```bash
BASE_URL="https://sec-tiebreaker-git-main-austinrts-projects.vercel.app"
DATABASE="production"
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
```

**Notes:**
- `BYPASS_TOKEN` required for protected Vercel deployment
- Check Vercel logs for database connection: `[MongoDB] Connecting to database: production`
- **Monitor Vercel logs for 5-10 minutes after tests complete**
- All credentials read from `.env.local`

