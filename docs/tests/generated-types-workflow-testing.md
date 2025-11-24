# Generated Types GitHub Workflow Testing

Complete testing guide for the automated GitHub Actions workflow that generates ESPN types and creates PRs.

**Related:** [Quick Reference](./generated-types-workflow-quick-ref.md) | [ESPN API Testing](./espn-api-testing.md)

**Workflow File:** `.github/workflows/update-espn-types.yml`

---

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- Access to repository with workflow permissions
- MongoDB test database accessible (for type generation)
- Current branch is `develop` (workflow checks out `develop` branch)

---

## Testing Procedure

1. **Simulate type change**: Edit `lib/espn/used-types-snapshot.json` (e.g., change `"Competitor.score": "string"` → `"number"`)
2. **Commit and push**:
```bash
git add lib/espn/used-types-snapshot.json
git commit --no-verify -m "test: simulate ESPN type change"
COMMIT_HASH=$(git rev-parse HEAD)
git push origin develop
```
3. **Trigger workflow**:
```bash
gh workflow run update-espn-types.yml --ref develop
RUN_ID=$(gh run list --workflow=update-espn-types.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch $RUN_ID
```
4. **Verify PR creation**:
```bash
PR_NUMBER=$(gh pr list --author "github-actions[bot]" --limit 1 --json number --jq '.[0].number')
gh pr view $PR_NUMBER
gh pr diff $PR_NUMBER
```
**Expected**: PR title `🤖 Auto: Update ESPN API Types (ESPN Type Changes Detected)`, includes generated type files and snapshot, diff shows type change. Snapshot reverts manual change to correct type.

5. **Close PR**: `gh pr close $PR_NUMBER --comment "Test PR - closing without merge"`
6. **Revert change**: `git revert --no-verify $COMMIT_HASH --no-edit && git push origin develop`
7. **Verify clean state**: Run workflow again - should complete without creating PR (output shows `changed=false`)

---

## Troubleshooting

**Workflow fails to start**: Use `--ref develop` flag, verify `gh auth status`, check workflow file syntax

**Type generation fails**: Verify MongoDB secrets in repository, test locally with `npx tsx scripts/extract-espn-types.ts`

**PR not created**: Check workflow logs for `changed` output, verify repository permissions (Settings → Actions → General → "Read and write permissions"), test comparison script locally

**PR creation fails (pre-commit hooks)**: Workflow includes step to disable git hooks. Verify step exists in workflow file.

**PR has linting errors**: Test type generation locally, check workflow logs, run `npm run lint -- lib/espn/`

**Workflow creates PR for usage changes**: Review `compareSnapshots` function - should only compare fields in both snapshots and distinguish type vs usage changes

---

## Testing Checklist

- [ ] Manual snapshot change committed and pushed
- [ ] Workflow triggered and PR created
- [ ] PR contents verified (correct types, no errors)
- [ ] PR closed successfully
- [ ] Manual change reverted
- [ ] Workflow run again on clean state (no PR created)

---

## Testing Results

**Status**: ✅ All tests completed successfully (November 16, 2025)

**Key Learnings**:
- Must use `--ref develop` when manually triggering workflow
- Repository must have "Read and write permissions" enabled for GitHub Actions
- Pre-commit hooks must be disabled for automated PR creation
- Branch `auto/update-espn-types` is deleted and recreated for each PR (safe pattern)
