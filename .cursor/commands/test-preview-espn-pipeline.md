# test-preview-espn-pipeline

## Testing Guide

Follow all testing procedures in `docs/tests/comprehensive-api-testing.md`

## Environment Configuration

**Branch**: `develop` (auto-deploys to Vercel preview)

**Environment Variables:**
```bash
BASE_URL="https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app"
DATABASE="preview"
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
```

**Notes:**
- `BYPASS_TOKEN` required for protected Vercel deployment
- Check Vercel logs for database connection: `[MongoDB] Connecting to database: preview`
- All credentials read from `.env.local`
