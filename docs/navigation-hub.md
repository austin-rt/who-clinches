# Documentation Navigation Hub

This is your guide to finding documentation in the sec-tiebreaker project. Use this hub to quickly locate the information you need.

## Quick Navigation

- **Getting Started?** → [README.md](../README.md)
- **Need to test something?** → [Testing Quick Reference](./guides/testing-quick-reference.md)
- **Setting up pre-commit hooks?** → [Pre-Commit Testing Guide](./guides/pre-commit-testing.md)
- **Building an API endpoint?** → [API Reference](./guides/api-reference.md)
- **Understanding ESPN API patterns?** → [ESPN API Testing](./tests/espn-api-testing.md)
- **Need AI development guidance?** → [AI Development Guide](./ai-guide.md)

---

## Documentation Structure

### Root Level (Project Essentials)

```
/
├── README.md              - Project overview, setup, quick start
└── CHANGELOG.md           - Version history and release notes
```

### Reference Documentation (`/docs`)

Essential documentation for active development:

```
docs/
└── ai-guide.md                         - AI assistant development guide
```

**When to use:**

- AI Guide → Writing code with AI assistance, prompt engineering

---

### Workflow Guides (`/docs/guides`)

How-to documentation and API reference for common development tasks:

```
docs/guides/
├── api-reference.md                    - Complete API endpoint documentation
├── changelog-guide.md                  - How to maintain the changelog
├── pre-commit-testing.md               - Git hook setup, pre-commit workflow
└── testing-quick-reference.md          - Testing commands, coverage checks
```

**When to use:**

- API Reference → Building endpoints, understanding request/response types
- Changelog Guide → Maintaining version history and releases
- Pre-Commit Testing → Setting up or troubleshooting git hooks
- Testing Quick Reference → Running tests, checking coverage, debugging

---

### Test Documentation (`/docs/tests`)

Testing procedures and verification guides:

```
docs/tests/
├── comprehensive-api-testing.md        - API endpoint testing procedures
├── cron-jobs-testing.md                - Cron job verification guide
├── espn-api-testing.md                 - ESPN API field verification patterns
├── espn-data-pipeline.md               - ESPN data transformation testing
└── tiebreaker-and-simulate.md          - Tiebreaker logic and simulation tests
```

**When to use:**

- Comprehensive API Testing → Writing new API tests
- Cron Jobs Testing → Testing background job endpoints
- ESPN API Testing → Verifying ESPN data transformations
- ESPN Data Pipeline → Verifying data transformation quality
- Tiebreaker & Simulate → Understanding ranking and prediction logic tests

---

### Planning Documents (`/docs/plans`)

Planning documents, technical specifications, and completed phase records:

```
docs/plans/
├── tech-spec.md                        - Technical specification (historical)
├── api-foundation.md                   - API architecture and endpoints
├── cron-jobs.md                        - Background job design
├── cron-updates.md                     - Cron job update patterns
├── tiebreaker-logic.md                 - SEC tiebreaker implementation
├── unit-tests.md                       - Testing strategy and coverage
├── frontend/                           - Frontend phase planning
│   ├── phase0.md                       - Phase 0: Foundation setup
│   ├── phase1.md                       - Phase 1: Teams and Rankings
│   ├── phase2.md                       - Phase 2: Games and Predictions
│   ├── phase3.md                       - Phase 3: Interactive features
│   ├── phase4.md                       - Phase 4: Advanced features
│   └── phase5.md                       - Phase 5: Optimization
└── archive/                            - Completed work records
    ├── comprehensive-test-suite.md     - 240-test suite completion
    ├── fixes-applied-2025-11-12.md    - ESLint/type fixes applied
    ├── test-delivery-summary.md       - Testing infrastructure summary
    ├── testing-implementation-complete.md - Testing Phase 1 completion
    ├── testing-phase2-complete.md     - Testing Phase 2 completion
    └── unit-tests-ready-for-review.md - Unit test review status
```

**When to use:**

- Tech Spec → Understanding overall architecture and design
- API Foundation → Understanding API architecture decisions
- Tiebreaker Logic → Understanding ranking algorithm design
- Frontend Plans → Understanding UI/UX phase planning
- Archive → Reviewing completed work and historical context

---

## Documentation by Use Case

### I want to...

#### **Understand the Project**

1. Start with [README.md](../README.md) - Project overview
2. Read [tech-spec.md](./plans/tech-spec.md) - Technical details
3. Review [api-reference.md](./guides/api-reference.md) - Available endpoints

#### **Add a New API Endpoint**

1. Check [api-reference.md](./guides/api-reference.md) - See existing patterns
2. Review [plans/api-foundation.md](./plans/api-foundation.md) - Architecture
3. Follow [tests/comprehensive-api-testing.md](./tests/comprehensive-api-testing.md) - Write tests

#### **Test My Code Changes**

1. Use [guides/testing-quick-reference.md](./guides/testing-quick-reference.md) - Quick commands
2. Review relevant test docs in [tests/](./tests/) - Specific testing procedures

#### **Set Up Pre-Commit Hooks**

1. Follow [guides/pre-commit-testing.md](./guides/pre-commit-testing.md) - Step by step
2. Reference [guides/changelog-guide.md](./guides/changelog-guide.md) - Commit message format

#### **Understand ESPN Data Integration**

1. Read [tests/espn-api-testing.md](./tests/espn-api-testing.md) - Field verification
2. Review [tests/espn-data-pipeline.md](./tests/espn-data-pipeline.md) - Testing procedures
3. Check [plans/cron-updates.md](./plans/cron-updates.md) - Update patterns

#### **Implement Tiebreaker Logic**

1. Review [plans/tiebreaker-logic.md](./plans/tiebreaker-logic.md) - Design
2. Check [tests/tiebreaker-and-simulate.md](./tests/tiebreaker-and-simulate.md) - Testing
3. Read [guides/api-reference.md](./guides/api-reference.md) - Simulation endpoint

#### **Set Up Development with AI**

1. Start with [ai-guide.md](./ai-guide.md) - Development guidelines
2. Review [guides/api-reference.md](./guides/api-reference.md) - Code structure reference
3. Check relevant plan docs - Implementation patterns

---

## File Location Reference

| Document          | Location                                  | Purpose                       |
| ----------------- | ----------------------------------------- | ----------------------------- |
| API Endpoints     | `docs/guides/api-reference.md`            | Current API documentation     |
| ESPN Patterns     | `docs/tests/espn-api-testing.md`          | Data transformation reference |
| AI Development    | `docs/ai-guide.md`                        | Using AI for coding           |
| API Testing       | `docs/tests/comprehensive-api-testing.md` | API test procedures           |
| Changelog Guide   | `docs/guides/changelog-guide.md`          | Maintaining version history   |
| ESPN Pipeline     | `docs/tests/espn-data-pipeline.md`        | Data import testing           |
| Pre-Commit Setup  | `docs/guides/pre-commit-testing.md`       | Git hook configuration        |
| Test Commands     | `docs/guides/testing-quick-reference.md`  | Quick test reference          |
| Tech Spec         | `docs/plans/tech-spec.md`                 | Technical specification       |
| API Design        | `docs/plans/api-foundation.md`            | Architecture decisions        |
| Tiebreaker Design | `docs/plans/tiebreaker-logic.md`          | Ranking algorithm             |
| Frontend Plans    | `docs/plans/frontend/`                    | UI/UX phase planning          |
| Phase History     | `docs/plans/archive/`                     | Completed work records        |

---

## Search Guide

If you're looking for something specific:

### By Topic

- **API** → See `guides/api-reference.md` and `plans/api-foundation.md`
- **Testing** → See `guides/testing-quick-reference.md` and `tests/*`
- **ESPN Integration** → See `tests/espn-api-testing.md` and `tests/espn-data-pipeline.md`
- **Tiebreaker** → See `plans/tiebreaker-logic.md` and `tests/tiebreaker-and-simulate.md`
- **Frontend** → See `plans/frontend/*`
- **Cron Jobs** → See `plans/cron-jobs.md` and `tests/cron-jobs-testing.md`

### By Problem

- **Commit failing?** → `guides/pre-commit-testing.md`
- **Tests failing?** → `guides/testing-quick-reference.md` then relevant test doc
- **ESPN data wrong?** → `tests/espn-api-testing.md` then `tests/espn-data-pipeline.md`
- **Need endpoint details?** → `guides/api-reference.md`
- **Forgot a command?** → `guides/testing-quick-reference.md`

### By Timeline

- **Current** → See `/docs` reference docs and guides
- **Recent work** → See `/docs/plans/archive/` sorted by date
- **Original design** → See `/docs/plans/`

---

## Adding New Documentation

When creating new documentation:

1. **Is it a reference?** → Place in `/docs/` (e.g., `ai-guide.md`)
2. **Is it a how-to guide?** → Place in `/docs/guides/` (e.g., `setup-guide.md`)
3. **Is it testing guidance?** → Place in `/docs/tests/` (e.g., `new-feature-testing.md`)
4. **Is it a planning document?** → Place in `/docs/plans/` with clear phase/section name
5. **Is it a completed work record?** → Place in `/docs/plans/archive/` with date in filename
6. **Is it a local audit/assessment?** → Use pattern `*audit*.md` (will be added to .gitignore automatically)
7. **Is it project-level?** → Place in root (only `README.md`, `CHANGELOG.md`)

All documentation should:

- Have a clear purpose at the top
- Include a table of contents if longer than 1 page
- Link to related documentation
- Include examples where appropriate
- Stay up-to-date when code changes

---

## Maintenance

**Quarterly Review:**

- Check if planning documents still reflect current design
- Archive completed phase documents
- Update reference docs with latest patterns

**Before Major Releases:**

- Update `CHANGELOG.md` with all changes
- Review `guides/api-reference.md` for accuracy
- Verify test documentation reflects current test suite

**When Making Big Changes:**

- Update relevant reference docs immediately
- Create plan document if designing new feature
- Update archive if completing a phase

---

## Questions?

- **About structure?** → Review this file
- **Can't find something?** → Check "Documentation by Use Case" section
- **About specific topic?** → Check "Search Guide" section
- **Want to improve docs?** → Submit suggestions or create PR

---

**Last Updated:** November 13, 2025
**Documentation Version:** 1.0
