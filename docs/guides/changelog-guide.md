# Changelog Management Guide

How to maintain `CHANGELOG.md` for the Conference Tiebreaker project.

---

## Overview

Follows **[Keep a Changelog](https://keepachangelog.com/)** standard: one file that grows over time, most recent at top, human-readable, grouped by type.

---

## Workflow

### 1. During Development (on `develop` branch)

Add changes to `[Unreleased]` section as you work. **Change Types**: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

### 2. Before Merging to `main` (Production Release)

1. Create version section: Move "Unreleased" content to new version section, add version number and date, leave "Unreleased" empty
2. Commit: `git add CHANGELOG.md && git commit -m "chore: prepare v0.1.0 release"`
3. Merge to main: `git checkout main && git merge develop && git push origin main`

---

## Versioning Strategy

We use **[Semantic Versioning](https://semver.org/)**: `MAJOR.MINOR.PATCH`

**When to Increment**: MAJOR (1.0.0) - Breaking changes, MINOR (0.1.0) - New features (backward-compatible), PATCH (0.0.1) - Bug fixes only

**Examples**: PATCH - Fixed typo/bug, updated docs. MINOR - New endpoint, new field, new cron job. MAJOR - API format change, removed endpoints, schema redesign

---

## Pre-1.0.0 Versioning

Before 1.0.0: Use `0.x.x` versions, breaking changes OK in MINOR versions (0.1.0 → 0.2.0), first production-ready release should be `1.0.0`. **Current Status:** Pre-release (0.x.x)

---

## Example Entry

```markdown
## [0.2.0] - 2025-11-15
### Added
- Frontend UI: Initial standings page
- WebSocket Support: Real-time score updates
### Changed
- API Response Format: `simulate` returns `standingsV2`
- Cron Schedule: Live games update every 3 minutes (was 5)
### Fixed
- Rule E Calculation: Fixed scoring margin bug
## [0.1.0] - 2025-11-12
### Added
- Initial API: Teams, games, simulate endpoints
- Tiebreaker Logic: Rules A-E implementation
```

---

## Tips

**Daily Development**: Update `[Unreleased]` as you code, don't worry about version numbers, group related changes

**Before Production Deploy**: Review unreleased changes, choose version number, move to versioned section, add date

**After Production Deploy**: Tag commit (`git tag v0.1.0`), push tag (`git push origin v0.1.0`), GitHub Releases can auto-populate

---

## Long-Term Management

**File Size**: One file fine for years (even 1000+ lines), most projects never split, if needed create `CHANGELOG-ARCHIVE.md`

**Search/Navigation**: Use Markdown anchors (`[0.1.0](#010---2025-11-12)`), GitHub auto-generates TOC, use Cmd+F to search

**Automation (Future)**: Tools like `semantic-release` can auto-generate from commits, use conventional commits (`feat:`, `fix:`, `docs:`), manual updates for now

---

## Quick Reference

```bash
# View current version
head -20 CHANGELOG.md

# Check unreleased changes
sed -n '/## \[Unreleased\]/,/## \[/p' CHANGELOG.md | head -n -1

# Create new version: Edit CHANGELOG.md, commit, tag, push
git add CHANGELOG.md && git commit -m "chore: release v0.1.0"
git tag -a v0.1.0 -m "Release v0.1.0" && git push origin main --tags
```

---

## Resources

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [Conventional Commits](https://www.conventionalcommits.org/) (optional, for automation)
