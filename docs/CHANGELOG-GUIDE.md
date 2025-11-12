# Changelog Management Guide

How to maintain `CHANGELOG.md` for the SEC Tiebreaker project.

---

## Overview

We follow the **[Keep a Changelog](https://keepachangelog.com/)** standard:
- One file (`CHANGELOG.md`) that grows over time
- Most recent changes at the top
- Human-readable format
- Changes grouped by type

---

## Workflow

### 1. During Development (on `develop` branch)

Add changes to the **`[Unreleased]`** section as you work:

```markdown
## [Unreleased]

### Added
- New feature X

### Fixed
- Bug Y
```

**Change Types:**
- `Added`: New features
- `Changed`: Changes to existing functionality
- `Deprecated`: Soon-to-be-removed features
- `Removed`: Removed features
- `Fixed`: Bug fixes
- `Security`: Security fixes

### 2. Before Merging to `main` (Production Release)

When ready to deploy to production:

1. **Create a version section**
   - Move all "Unreleased" content to a new version section
   - Add version number and date
   - Leave "Unreleased" section empty

```markdown
## [Unreleased]

## [0.1.0] - 2025-11-12

### Added
- New feature X

### Fixed
- Bug Y
```

2. **Commit the changelog update**
```bash
git add CHANGELOG.md
git commit -m "chore: prepare v0.1.0 release"
```

3. **Merge to main**
```bash
git checkout main
git merge develop
git push origin main
```

---

## Versioning Strategy

We use **[Semantic Versioning](https://semver.org/)**: `MAJOR.MINOR.PATCH`

### When to Increment:

- **MAJOR (1.0.0)**: Breaking changes (API changes, database schema changes)
- **MINOR (0.1.0)**: New features (backward-compatible)
- **PATCH (0.0.1)**: Bug fixes only

### Examples:

**PATCH (0.0.1 → 0.0.2):**
- Fixed typo in API response
- Fixed bug in tiebreaker logic
- Updated documentation

**MINOR (0.0.2 → 0.1.0):**
- Added new `/api/simulate` endpoint
- Added `predictedScore` field
- New cron job

**MAJOR (0.1.0 → 1.0.0):**
- Changed API response format (breaking)
- Removed deprecated endpoints
- Database schema redesign requiring migration

---

## Pre-1.0.0 Versioning

Before 1.0.0 (initial production release):
- Use `0.x.x` versions
- Breaking changes are OK in MINOR versions (0.1.0 → 0.2.0)
- First production-ready release should be `1.0.0`

**Current Status:** Pre-release (0.x.x)

---

## Example Changelog Entry

```markdown
## [0.2.0] - 2025-11-15

### Added
- **Frontend UI**: Initial standings page with team logos and rankings
- **WebSocket Support**: Real-time score updates during games
- **User Authentication**: OAuth login via Google

### Changed
- **API Response Format**: `simulate` endpoint now returns `standingsV2` format
  - Migration guide: See `docs/migrations/standings-v2.md`
- **Cron Schedule**: Live games now update every 3 minutes (was 5 minutes)

### Fixed
- **Rule E Calculation**: Fixed scoring margin bug for overtime games
- **MSST Logo**: Updated Mississippi State team logo URL

### Deprecated
- `standingsV1` format will be removed in v0.3.0

## [0.1.0] - 2025-11-12

### Added
- **Initial API**: Teams, games, simulate endpoints
- **Tiebreaker Logic**: SEC Rules A-E implementation
- **Cron Jobs**: Automated data updates (live games, rankings, spreads, averages)
- **Predicted Scores**: Server-side prefill logic for incomplete games

### Fixed
- **MSST Abbreviation**: Corrected from "MSU" to "MSST"
- **Duplicate Indexes**: Removed duplicate Mongoose indexes
```

---

## Tips

### Daily Development:
- Update `[Unreleased]` section as you code
- Don't worry about version numbers yet
- Group related changes together

### Before Production Deploy:
- Review all unreleased changes
- Choose appropriate version number
- Move changes to versioned section
- Add date

### After Production Deploy:
- Tag the commit: `git tag v0.1.0`
- Push tag: `git push origin v0.1.0`
- GitHub Releases can auto-populate from changelog

---

## Long-Term Management

### File Size:
- One file is fine for years (even 1000+ lines)
- Most projects never split it
- If needed (rare), create `CHANGELOG-ARCHIVE.md` for old versions

### Search/Navigation:
- Use Markdown anchors for linking: `[0.1.0](#010---2025-11-12)`
- GitHub auto-generates table of contents
- Use Cmd+F to search versions

### Automation (Future):
- Tools like `semantic-release` can auto-generate changelogs from commits
- Convention: Use conventional commits (`feat:`, `fix:`, `docs:`)
- For now, manual updates are fine

---

## Quick Reference Commands

```bash
# View current version
head -20 CHANGELOG.md

# Check unreleased changes
sed -n '/## \[Unreleased\]/,/## \[/p' CHANGELOG.md | head -n -1

# Create new version (example)
# 1. Edit CHANGELOG.md (move Unreleased to new version)
# 2. Commit
git add CHANGELOG.md
git commit -m "chore: release v0.1.0"

# 3. Tag
git tag -a v0.1.0 -m "Release v0.1.0"

# 4. Push
git push origin main --tags
```

---

## Resources

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [Conventional Commits](https://www.conventionalcommits.org/) (optional, for automation)

