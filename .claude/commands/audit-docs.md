# Documentation Maintenance Check

Run a thorough audit of the documentation structure to catch drift, broken links, and orphaned docs.

## Tasks

1. **Check for broken links** in active docs (navigation-hub, ai-guide, all guides, quick-ref tests)
2. **Verify active docs don't reference HISTORICAL** (except in explicit warnings)
3. **Find orphaned docs** not referenced in navigation or manifests
4. **Identify completed work** that should move to HISTORICAL/
5. **Report total Tier 1 doc load** (line count and estimated tokens)
6. **Ensure all filenames are lowercase and kebab-case**, except README and CHANGELOG.

## Execution

- Use Grep to search for broken markdown links `\[.*\]\(\.\/.*\)`
- Use Grep to check for unintended HISTORICAL references
- Use Glob to find all markdown files in docs/
- Identify opportunity to reduce the amout of tokens used while maintaining the important information
- Execute your own recommendations

## Expected Output

- All link checks (broken, orphaned, unintended references)
- Any warnings or suggestions for cleanup
- Do not create any files, just execute your own recommendations.
- Summary of files changes and what changes were made in each.
