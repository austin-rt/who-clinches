# Documentation Navigation Hub

This is your guide to finding documentation in the sec-tiebreaker project. Use this hub to quickly locate the information you need.

## Quick Navigation

- **Domain-specific quick reference** → [Quick Reference](./guides/quick-reference.md) - "If you need to test, go here", etc.
- **Getting Started?** → [README.md](../README.md)
- **Need to test something?** → [Testing Quick Reference](./guides/testing-quick-reference.md)
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
├── quick-reference.md                   - Domain-specific content locations
├── api-reference.md                     - Complete API endpoint documentation
├── changelog-guide.md                   - How to maintain the changelog
├── pre-commit-testing.md                - Git hook setup, pre-commit workflow
└── testing-quick-reference.md           - Testing commands, coverage checks
```

**When to use:**

- Quick Reference → Finding domain-specific content ("if you need to test, go here")
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
├── generated-types-workflow-testing.md - Automated ESPN type generation workflow testing
└── tiebreaker-and-simulate.md          - Tiebreaker logic and simulation tests
```

**When to use:**

- Comprehensive API Testing → Writing new API tests
- Cron Jobs Testing → Testing background job endpoints
- ESPN API Testing → Verifying ESPN data transformations
- ESPN Data Pipeline → Verifying data transformation quality
- Generated Types Workflow Testing → Testing automated type generation and PR creation
- Tiebreaker & Simulate → Understanding ranking and prediction logic tests

---

### Planning Documents (`/docs/plans`)

Planning documents, technical specifications, and completed phase records:

```
docs/plans/
├── tech-spec.md                        - Technical specification (historical)
├── api-foundation.md                   - API architecture and endpoints
├── tiebreaker-logic.md                 - SEC tiebreaker implementation
├── unit-tests.md                       - Testing strategy and coverage
├── test-data-snapshots.md              - Test data snapshot planning
├── test-data-auto-retesting.md         - Auto-retesting strategy
├── frontend/                           - Frontend phase planning
│   ├── phase0.md                       - Phase 0: Foundation setup
│   ├── phase1.md                       - Phase 1: Teams and Rankings
│   ├── phase2.md                       - Phase 2: Games and Predictions
│   ├── phase3.md                       - Phase 3: Interactive features
│   ├── phase4.md                       - Phase 4: Advanced features
│   └── phase5.md                       - Phase 5: Optimization
└── archive/                            - HISTORICAL ONLY - Do not consult for current implementation
    ├── comprehensive-test-suite.md     - Historical test suite records
    ├── cron-jobs-plan.md              - Outdated cron job planning (superseded by current implementation)
    ├── cron-updates-plan.md           - Outdated cron update planning (superseded by current implementation)
    ├── fixes-applied-2025-11-12.md    - Historical fix records
    ├── test-delivery-summary.md       - Historical testing infrastructure
    ├── testing-implementation-complete.md - Historical testing phase records
    ├── testing-phase2-complete.md     - Historical testing phase records
    └── unit-tests-ready-for-review.md - Historical test review status
```

**IMPORTANT:** The `archive/` directory contains **historical planning documents only**. These documents reflect outdated designs and should **NOT** be consulted to understand the current application. For current implementation details, refer to:

- **Current code** in `/app/api/cron/` endpoints
- **Current API docs** in `/docs/guides/api-reference.md`
- **Current test procedures** in `/docs/tests/`
- **Active planning** in `/docs/plans/` (non-archive files)

**When to use:**

- Tech Spec → Understanding overall architecture and design
- API Foundation → Understanding API architecture decisions
- Tiebreaker Logic → Understanding ranking algorithm design
- Frontend Plans → Understanding UI/UX phase planning
- Archive → **Historical reference only** - Do not use for current implementation

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
3. Check [guides/api-reference.md](./guides/api-reference.md) - Current cron job patterns
4. Test type generation workflow → [tests/generated-types-workflow-testing.md](./tests/generated-types-workflow-testing.md)

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
| Quick Reference   | `docs/guides/quick-reference.md`          | Domain-specific content guide |
| API Endpoints     | `docs/guides/api-reference.md`            | Current API documentation     |
| ESPN Patterns     | `docs/tests/espn-api-testing.md`          | Data transformation reference |
| AI Development    | `docs/ai-guide.md`                        | Using AI for coding           |
| API Testing       | `docs/tests/comprehensive-api-testing.md` | API test procedures           |
| Changelog Guide   | `docs/guides/changelog-guide.md`          | Maintaining version history   |
| ESPN Pipeline     | `docs/tests/espn-data-pipeline.md`        | Data import testing           |
| Generated Types   | `docs/tests/generated-types-workflow-testing.md` | Type generation workflow testing |
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
- **ESPN Type Generation** → See `tests/generated-types-workflow-testing.md`
- **Tiebreaker** → See `plans/tiebreaker-logic.md` and `tests/tiebreaker-and-simulate.md`
- **Frontend** → See `plans/frontend/*`
- **Cron Jobs** → See `tests/cron-jobs-testing.md` and `guides/api-reference.md` (do not use archived plans)

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
