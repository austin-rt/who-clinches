# audit-docs

## Quick Start

```bash
node scripts/audit-docs.js
```

## What it checks

- Broken markdown links in `docs/`
- Filename conventions (kebab-case, except README/CHANGELOG)
- Orphaned files not referenced by other docs
- Tier 1 token load (ai-guide.md + external-analytics doc)
- Duplicate headings within files

## Philosophy

The doc surface is intentionally minimal — two files plus read-only tiebreaker rules. Audit confirms nothing drifted structurally, not that implementation details are documented.

**Read-only:** `docs/tiebreaker-rules/` — NEVER edit. Extracted from official conference PDFs.

## Manual verification

If the script misses something, check:

- `grep -rn '\]\([^)]*\.md' docs/` for link patterns
- `find docs -name '*.md'` for the full file list
- Whether any new doc files were accidentally created (there should only be 2 editable ones)

## Expected output

Report in your response text (not a file):

1. Broken links — list or confirm none
2. Filename conventions — violations or confirm clean
3. Orphaned files — list with recommendation, or confirm none
4. Tier 1 token load — breakdown by file, total, status
5. Duplicate headings — list or confirm none
6. Summary — total files, issue count, overall health
