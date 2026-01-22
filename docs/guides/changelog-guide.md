# Changelog Management Guide

How to maintain `CHANGELOG.md` for the Conference Tiebreaker project.

---

## Overview

Follows **[Keep a Changelog](https://keepachangelog.com/)** standard: one file that grows over time, most recent at top, human-readable, grouped by type.

---

## Workflow

Add changes to `[Unreleased]` section as you work. **Change Types**: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

Before production release: Move "Unreleased" content to new version section, add version number and date, leave "Unreleased" empty.

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
- Frontend Polling: Live games poll every 60 seconds (was 2 minutes)
### Fixed
- Rule E Calculation: Fixed scoring margin bug

## [0.1.0] - 2025-11-12
### Added
- Initial API: Teams, games, simulate endpoints
- Tiebreaker Logic: Conference-specific tiebreaker rules implementation (e.g., SEC Rules A-E, MWC team rating score)
```

---

## Quick Reference

```bash
# View current version
head -20 CHANGELOG.md

# Check unreleased changes
sed -n '/## \[Unreleased\]/,/## \[/p' CHANGELOG.md | head -n -1
```

## Resources

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
