# Test Data Auto-Retesting

After the `/api/cron/update-test-data` cron job successfully updates test data snapshots, we want to automatically run tests to verify reshape functions still work with the new API format.

## Problem

When ESPN API format changes, our reshape functions may break. The test data snapshot system captures real API responses daily, but we need to know immediately if reshape functions need updates.

## Solution Options

### Option 1: GitHub Actions Workflow (Recommended)

**How it works:**

1. Cron job calls a webhook endpoint after successful update
2. Webhook triggers GitHub Actions workflow
3. Workflow runs tests against updated test database
4. Results reported via GitHub status checks

**Implementation:**

1. Create `.github/workflows/test-after-data-update.yml`
2. Add webhook endpoint `/api/webhooks/test-data-updated`
3. Configure GitHub Actions secret for webhook authentication
4. Cron job calls webhook on success

**Pros:**

- ✅ Runs in isolated CI environment
- ✅ Can create PR comments or status checks
- ✅ Doesn't consume Vercel function execution time
- ✅ Can run full test suite

**Cons:**

- ❌ Requires GitHub Actions setup
- ❌ Slight delay (webhook → workflow trigger)

### Option 2: Vercel Function Test Endpoint

**How it works:**

1. Cron job calls internal test endpoint after successful update
2. Test endpoint runs reshape tests
3. Results logged to database or sent via webhook

**Implementation:**

1. Create `/api/cron/run-reshape-tests` endpoint
2. Cron job calls this endpoint after successful update
3. Tests run in same Vercel environment

**Pros:**

- ✅ Simple, no external dependencies
- ✅ Fast execution
- ✅ Can log results to database

**Cons:**

- ❌ Consumes Vercel function execution time
- ❌ Limited to Vercel timeout (10s Hobby, 60s Pro)
- ❌ May not run full test suite

### Option 3: Vercel Deployment Hook

**How it works:**

1. Cron job triggers a new deployment (empty commit or webhook)
2. Deployment runs tests as part of build process
3. Tests fail build if reshape functions broken

**Implementation:**

1. Add test step to `package.json` scripts
2. Configure Vercel to run tests on deployment
3. Cron job triggers deployment via GitHub API

**Pros:**

- ✅ Tests run on every deployment
- ✅ Can block deployments if tests fail

**Cons:**

- ❌ Creates unnecessary deployments
- ❌ Slower (full deployment cycle)
- ❌ May hit deployment limits

### Option 4: External Monitoring Service

**How it works:**

1. Use service like Better Uptime, Pingdom, or custom service
2. Service calls test endpoint after cron job time window
3. Alerts if tests fail

**Implementation:**

1. Set up monitoring service
2. Configure to call `/api/test/reshape-functions` endpoint
3. Schedule check 5-10 minutes after cron job runs

**Pros:**

- ✅ Independent of Vercel/GitHub
- ✅ Can send alerts (email, Slack, etc.)
- ✅ Can monitor multiple endpoints

**Cons:**

- ❌ Requires external service setup
- ❌ Additional cost (if paid service)
- ❌ Slight delay

## Recommended Approach: Vercel Function (Both Plans)

**Decision:** Vercel function called internally from `update-test-data` endpoint

**Why:**

- ✅ **FREE** - No additional cost
- ✅ **No additional cron needed** - Called internally (fits Hobby's 2-cron limit)
- ✅ **All in Vercel** - Matches deployment platform preference
- ✅ **Immediate** - Runs right after data update
- ✅ **Non-blocking** - Fire-and-forget, doesn't slow down data update
- ✅ **Hobby compatible** - Runs only reshape tests (~5-10s, well under 10s limit)
- ✅ **Pro ready** - Can expand to more tests with 60s limit

**Implementation:**

- Created `/api/cron/run-reshape-tests` endpoint
- `update-test-data` calls it internally after successful update
- Tests run in background (non-blocking)
- Results logged to ErrorLog database for monitoring
- Failures don't block deployment but require immediate attention

## Implementation Plan

### Phase 1: Basic Test Endpoint (Hobby)

1. Create `/api/cron/run-reshape-tests` endpoint
2. Update `/api/cron/update-test-data` to call test endpoint on success
3. Log test results to database
4. Add error logging for test failures

### Phase 2: GitHub Actions (Pro)

1. Create `.github/workflows/test-after-data-update.yml`
2. Add webhook endpoint with authentication
3. Update cron job to call webhook
4. Configure GitHub Actions to run on webhook trigger
5. Add status checks and PR comments

## Test Endpoint Design

```typescript
// app/api/cron/run-reshape-tests/route.ts
export const GET = async (request: NextRequest) => {
  // 1. Verify cron secret
  // 2. Load test data from database
  // 3. Run reshape functions against test data
  // 4. Check for errors/exceptions
  // 5. Log results to database
  // 6. Return success/failure status
};
```

## Monitoring

- Log test results to `ErrorLog` collection
- Include timestamp, test type, pass/fail status
- Alert if tests fail (via existing error monitoring)
- Track test execution time

## Next Steps

1. Implement basic test endpoint (Option 2)
2. Integrate with update-test-data cron job
3. Monitor for 1 week
4. Evaluate need for GitHub Actions (Option 1) if on Pro plan
