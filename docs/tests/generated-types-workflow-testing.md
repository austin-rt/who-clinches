# Generated Types GitHub Workflow Testing

Tests the automated GitHub Actions workflow that generates ESPN types, compares snapshots, and creates PRs when ESPN API types change.

---

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- Access to repository with workflow permissions
- MongoDB test database accessible (for type generation)
- Current branch is `develop` (workflow checks out `develop` branch)

---

## Test Overview

This test simulates an ESPN API type change by manually modifying the type snapshot, then verifying that the workflow:

1. Detects the change
2. Generates new types
3. Creates a PR with the changes
4. Handles PR denial gracefully

---

## Test 1: Simulate ESPN Type Change

Manually change a type in the snapshot to simulate ESPN changing their API.

### Step 1: Make Manual Snapshot Change

Choose a field that exists in the snapshot and change its type. Edit the file directly:

**Example: Change `Competitor.score` from `"string"` to `"number"`**

Edit `lib/espn/used-types-snapshot.json` and change:

```json
"Competitor.score": "string",
```

to:

```json
"Competitor.score": "number",
```

This simulates ESPN changing the score field type from string to number.

### Step 2: Commit and Push Change

```bash
# Add and commit the manual change
git add lib/espn/used-types-snapshot.json
git commit -m "test: simulate ESPN type change (Competitor.score: string -> number)"
COMMIT_HASH=$(git rev-parse HEAD)
echo "Commit hash: $COMMIT_HASH"

# Push to remote
git push origin develop
```

### Step 3: Trigger Workflow Manually

```bash
# Trigger the workflow
gh workflow run update-espn-types.yml

# Get the workflow run ID
RUN_ID=$(gh run list --workflow=update-espn-types.yml --limit 1 --json databaseId --jq '.[0].databaseId')
echo "Workflow run ID: $RUN_ID"
```

### Step 4: Monitor Workflow Execution

```bash
# Watch the workflow run in real-time (recommended)
gh run watch $RUN_ID

# Or view logs after completion
gh run view $RUN_ID --log
```

### Expected Workflow Behavior

1. **Generate Types Step**: Should complete successfully
2. **Check Changes Step**: Should detect the type change
3. **Create PR Step**: Should create a pull request

### Checks

- [ ] Workflow starts successfully
- [ ] Type generation completes without errors
- [ ] Snapshot comparison detects the change
- [ ] Workflow output shows `changed=true`
- [ ] PR creation step executes

---

## Test 2: Verify PR Creation

Confirm that the workflow created a PR with the expected changes.

### Step 5: Check PR Details

```bash
# List recent PRs created by the workflow
gh pr list --author "github-actions[bot]" --limit 5

# Get the PR number (most recent)
PR_NUMBER=$(gh pr list --author "github-actions[bot]" --limit 1 --json number --jq '.[0].number')
echo "PR number: $PR_NUMBER"

# View PR details
gh pr view $PR_NUMBER

# View PR diff
gh pr diff $PR_NUMBER
```

### Expected PR Contents

- **Title**: Should match pattern: `🤖 Auto: Update ESPN API Types (ESPN Type Changes Detected)`
- **Body**: Should include the type change diff
- **Files Changed**: Should include:
  - `lib/espn/espn-scoreboard-generated.ts` (or relevant generated file)
  - `lib/espn/used-types-snapshot.json`
- **Diff**: Should show the type change (e.g., `Competitor.score: string → number`)

### Checks

- [ ] PR was created successfully
- [ ] PR title matches expected format
- [ ] PR body contains type change information
- [ ] Generated type files are included in PR
- [ ] Snapshot file is updated in PR
- [ ] PR diff shows the expected type change

---

## Test 3: Verify PR Contents

Examine the PR to ensure it contains the correct changes.

### Step 6: Review PR Changes

```bash
# View full PR diff
gh pr diff $PR_NUMBER

# Check specific file changes
gh pr diff $PR_NUMBER -- lib/espn/used-types-snapshot.json
gh pr diff $PR_NUMBER -- lib/espn/espn-scoreboard-generated.ts
```

### Expected Changes

**In `used-types-snapshot.json`:**

- Should revert the manual change back to the correct type
- Example: `"Competitor.score": "string"` (reverted from our manual `"number"`)

**In generated type files:**

- Should reflect the actual types from the database
- Should not have linting errors
- Should include `GameState` import only where needed
- Should include `Odd` interface if missing

### Checks

- [ ] Snapshot shows correct types (not our manual change)
- [ ] Generated types match database structure
- [ ] No linting errors in generated files
- [ ] `GameState` import present only in files with `StatusType`
- [ ] `Odd` interface present in scoreboard types

---

## Test 4: Close/Deny PR

Test that the workflow handles PR denial gracefully.

### Step 7: Close the PR

```bash
# Close the PR without merging
gh pr close $PR_NUMBER --comment "Test PR - closing without merge"

# Verify PR is closed
gh pr view $PR_NUMBER
```

### Expected Behavior

- PR should close successfully
- No errors in workflow
- Branch remains available for future runs

### Checks

- [ ] PR closes successfully
- [ ] PR status shows "closed"
- [ ] No workflow errors after closing

---

## Test 5: Revert Manual Change

Clean up by reverting the manual snapshot change.

### Step 8: Revert and Push

```bash
# Revert the manual change
git revert $COMMIT_HASH --no-edit

# Or manually restore the correct snapshot
# (if revert doesn't work cleanly)
git checkout HEAD~1 -- lib/espn/used-types-snapshot.json
git add lib/espn/used-types-snapshot.json
git commit -m "revert: remove manual type change test"

# Push the revert
git push origin develop
```

### Verify Revert

```bash
# Check that snapshot is back to correct state
cat lib/espn/used-types-snapshot.json | jq '.scoreboard["Competitor.score"]'
# Should show: "string"
```

### Checks

- [ ] Snapshot reverted to correct state
- [ ] Commit pushed successfully
- [ ] Snapshot matches expected types

---

## Test 6: Verify Workflow on Clean State

Run the workflow again to ensure it works correctly after revert.

### Step 9: Trigger Workflow Again

```bash
# Trigger workflow again
gh workflow run update-espn-types.yml

# Get new run ID
NEW_RUN_ID=$(gh run list --workflow=update-espn-types.yml --limit 1 --json databaseId --jq '.[0].databaseId')
echo "New workflow run ID: $NEW_RUN_ID"

# Watch the workflow
gh run watch $NEW_RUN_ID
```

### Expected Behavior

- Workflow should complete successfully
- No PR should be created (no type changes detected)
- Snapshot may update if usage changed, but no PR

### Checks

- [ ] Workflow completes successfully
- [ ] No PR created (no ESPN type changes)
- [ ] Workflow output shows `changed=false`
- [ ] Snapshot may be updated silently if usage changed

---

## Troubleshooting

### Workflow Fails to Start

**Cause**: Missing permissions or invalid workflow file

**Fix**:

1. Check workflow file syntax: `.github/workflows/update-espn-types.yml`
2. Verify GitHub Actions are enabled in repository settings
3. Check that `gh` CLI is authenticated: `gh auth status`

### Type Generation Fails

**Cause**: MongoDB connection issues or missing test data

**Fix**:

1. Verify MongoDB secrets are set in repository secrets
2. Check that test database has data: `npx tsx scripts/extract-espn-types.ts`
3. Verify environment variables in workflow file

### PR Not Created

**Cause**: Type change not detected or comparison logic issue

**Fix**:

1. Check workflow logs for `changed` output value
2. Verify snapshot comparison script: `npx tsx scripts/extract-used-types.ts compare`
3. Check that both old and new snapshots exist
4. Verify the field exists in both snapshots (only compares fields in both)

### PR Has Linting Errors

**Cause**: Generated types have issues (unused imports, etc.)

**Fix**:

1. Check workflow logs for linting errors
2. Verify `extract-espn-types.ts` script fixes (GameState import, Odd interface)
3. Manually test type generation: `npx tsx scripts/extract-espn-types.ts`
4. Run lint on generated files: `npm run lint -- lib/espn/`

### Workflow Creates PR for Usage Changes

**Cause**: Comparison logic incorrectly identifying usage changes as type changes

**Fix**:

1. Review `compareSnapshots` function in `extract-used-types.ts`
2. Verify it only compares fields that exist in BOTH old and new snapshots
3. Check that it distinguishes between type changes and usage changes

---

## Testing Checklist

### Manual Testing

- [ ] Test 1: Manual snapshot change committed and pushed
- [ ] Test 2: Workflow triggered and monitored
- [ ] Test 3: PR created with expected changes
- [ ] Test 4: PR contents verified (correct types, no errors)
- [ ] Test 5: PR closed successfully
- [ ] Test 6: Manual change reverted
- [ ] Test 7: Workflow run again on clean state

### Verification

- [ ] Workflow detects type changes correctly
- [ ] PR includes correct generated types
- [ ] PR includes updated snapshot
- [ ] No linting errors in PR
- [ ] Workflow handles PR denial gracefully
- [ ] Workflow doesn't create PR for usage-only changes

### Edge Cases

- [ ] Workflow handles first run (no previous snapshot)
- [ ] Workflow handles missing snapshot file
- [ ] Workflow handles multiple type changes
- [ ] Workflow handles type changes in multiple files

---

## Expected Workflow Output

### Successful Type Change Detection

```
=== ESPN Type Changes (triggers PR) ===
~ scoreboard.Competitor.score: string → number
```

### No Type Changes

```
No ESPN type changes in fields we currently use.
```

### Usage Changes Only

```
No ESPN type changes. 2 usage change(s) (tracking updated silently)
+ scoreboard.Competition.newField: string (newly tracked, no PR)
- scoreboard.Competition.oldField: string (no longer tracked, no PR)
```

---

## Next Steps

1. Complete manual workflow testing
2. Monitor workflow for 1 week in production
3. Verify PRs are created when ESPN actually changes types
4. Test PR merge process
5. Document any workflow improvements needed
