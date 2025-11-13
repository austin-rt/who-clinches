# test-local-espn-pipeline

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

**Notes:**

- Local server must be running on port 3000
- `BYPASS_TOKEN` can be empty or omitted (not required for localhost)
- All credentials read from `.env.local`
