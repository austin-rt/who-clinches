# Generated Types Workflow Quick Reference

Quick reference for testing the automated GitHub Actions workflow that generates ESPN types and creates PRs.

**Related:** [Full Testing Guide](./generated-types-workflow-testing.md)

---

## Quick Test

```bash
# 1. Manually change a type in snapshot
# Edit lib/espn/used-types-snapshot.json (e.g., change Competitor.score: "string" to "number")

# 2. Commit and push
git add lib/espn/used-types-snapshot.json
git commit --no-verify -m "test: simulate ESPN type change"
git push origin develop

# 3. Trigger workflow
gh workflow run update-espn-types.yml --ref develop

# 4. Monitor
RUN_ID=$(gh run list --workflow=update-espn-types.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch $RUN_ID
```

---

## Expected Results

- Workflow detects type change
- PR created with generated types and updated snapshot
- PR title: `🤖 Auto: Update ESPN API Types (ESPN Type Changes Detected)`

---

## Common Issues

**Workflow fails to start:**
- Use `--ref develop` flag when triggering manually
- Verify `gh auth status` shows authenticated

**PR not created:**
- Check repository settings: Actions → General → Workflow permissions → "Read and write permissions"
- Verify workflow logs show `changed=true`

**PR has linting errors:**
- Run `npx tsx scripts/extract-espn-types.ts` locally to test
- Check workflow logs for specific errors

---

## Cleanup

After testing, revert the manual change:

```bash
git revert HEAD --no-edit
git push origin develop
```

