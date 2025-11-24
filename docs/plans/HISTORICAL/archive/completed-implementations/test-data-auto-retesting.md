# Test Data Auto-Retesting

After `/api/cron/update-test-data` successfully updates test data snapshots, automatically run tests to verify reshape functions still work with the new API format.

## Problem

When ESPN API format changes, reshape functions may break. Test data snapshots capture real API responses daily, but we need immediate notification if reshape functions need updates.

## Solution Options

### Option 1: GitHub Actions Workflow (Recommended for Pro)
**How it works:** Cron job calls webhook → triggers GitHub Actions → runs tests → reports results

**Pros:** Isolated CI environment, PR comments/status checks, doesn't consume Vercel time  
**Cons:** Requires GitHub Actions setup, slight delay

### Option 2: Vercel Function Test Endpoint (Implemented)
**How it works:** Cron job calls internal test endpoint → runs reshape tests → logs results

**Pros:** Simple, fast, no external dependencies, can log to database  
**Cons:** Consumes Vercel execution time, limited by timeout (10s Hobby, 60s Pro)

### Option 3: Vercel Deployment Hook
**How it works:** Cron job triggers deployment → tests run in build → fail build if broken

**Pros:** Tests run on every deployment, can block deployments  
**Cons:** Creates unnecessary deployments, slower, may hit limits

### Option 4: External Monitoring Service
**How it works:** Service calls test endpoint after cron window → alerts if tests fail

**Pros:** Independent, can send alerts, monitor multiple endpoints  
**Cons:** Requires external service, additional cost, slight delay

---

## Recommended Approach: Vercel Function (Implemented)

**Decision:** Vercel function called internally from `update-test-data` endpoint

**Why:**
- ✅ FREE - No additional cost
- ✅ No additional cron needed - Called internally (fits Hobby's 2-cron limit)
- ✅ All in Vercel - Matches deployment platform preference
- ✅ Immediate - Runs right after data update
- ✅ Non-blocking - Fire-and-forget, doesn't slow down data update
- ✅ Hobby compatible - Runs only reshape tests (~5-10s, well under 10s limit)
- ✅ Pro ready - Can expand to more tests with 60s limit

**Implementation:**
- Created `/api/cron/run-reshape-tests` endpoint
- `update-test-data` calls it internally after successful update
- Tests run in background (non-blocking)
- Results logged to ErrorLog database for monitoring
- Failures don't block deployment but require immediate attention

---

## Implementation Plan

### Phase 1: Basic Test Endpoint (Hobby) ✅
1. Create `/api/cron/run-reshape-tests` endpoint
2. Update `/api/cron/update-test-data` to call test endpoint on success
3. Log test results to database
4. Add error logging for test failures

### Phase 2: GitHub Actions (Pro - Future)
1. Create `.github/workflows/test-after-data-update.yml`
2. Add webhook endpoint with authentication
3. Update cron job to call webhook
4. Configure GitHub Actions to run on webhook trigger
5. Add status checks and PR comments

---

## Test Endpoint Design

**Endpoint:** `/api/cron/run-reshape-tests`

**Flow:**
1. Verify cron secret
2. Load test data from database
3. Run reshape functions against test data
4. Check for errors/exceptions
5. Log results to database
6. Return success/failure status

---

## Monitoring

- Log test results to `ErrorLog` collection
- Include timestamp, test type, pass/fail status
- Alert if tests fail (via existing error monitoring)
- Track test execution time

---

## Next Steps

1. ✅ Implement basic test endpoint (Option 2)
2. ✅ Integrate with update-test-data cron job
3. Monitor for 1 week
4. Evaluate need for GitHub Actions (Option 1) if on Pro plan
