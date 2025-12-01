# Rename Project: sec-tiebreaker → who-clinches

**Status**: Planning  
**Complexity**: Moderate (30-60 minutes)  
**Risk**: Low  
**Breaking Changes**: Vercel URLs will change

## Overview

This document outlines the process for renaming the project from `sec-tiebreaker` to `who-clinches` while preserving git history and updating all references.

## Rationale

Better reflects product purpose (determining who clinches playoff spots), more scalable beyond SEC, cleaner brand identity. Trade-off: Vercel URLs will change.

## Complexity Assessment

### What Needs to Change

1. **Git Repository** (keeps history)
   - Rename on GitHub: Settings → General → Repository name
   - Update local remote URL
   - History is preserved automatically

2. **Code References** (24 matches found)
   - `package.json`: name field
   - `lib/cfb/espn-client.ts`: 4 User-Agent strings
   - `lib/mongodb.ts` & `lib/mongodb-test.ts`: MONGODB_APP_NAME usage
   - `scripts/drop-database.js`: MONGODB_APP_NAME default
   - Documentation files: README, various docs with URLs

3. **Vercel Configuration**
   - Project name in Vercel dashboard
   - URLs will change:
     - Old: `sec-tiebreaker-git-develop-...vercel.app`
     - New: `who-clinches-git-develop-...vercel.app`
   - Environment variables: update `MONGODB_APP_NAME` in Vercel
   - Can set up custom domain later

4. **Environment Variables**
   - Update `MONGODB_APP_NAME` in `.env.local` and Vercel

5. **Documentation**
   - README.md (URLs, project structure)
   - Various docs with deployment URLs
   - AI guide already says "Who Clinches" in title

6. **Potential Data Migration**
   - localStorage keys: docs mention `"sec-tiebreaker-overrides-{season}"` but may not be implemented yet
   - If implemented, users would lose saved overrides (one-time impact)

## Step-by-Step Process

### Phase 1: Code Updates

Update `package.json` name, `lib/cfb/espn-client.ts` User-Agent strings (4 instances: `'SEC-Tiebreaker/1.0'` → `'Who-Clinches/1.0'`), `scripts/drop-database.js` default, documentation files (README, deployment URLs), environment variable examples.

### Phase 2: Git Repository

Rename on GitHub (Settings → General → Repository name), update local remote URL (`git remote set-url origin ...`), verify connection (`git remote -v`, `git fetch`).

### Phase 3: Vercel

Rename project in dashboard, update `MONGODB_APP_NAME` env var (all environments), verify deployments (new URLs: `who-clinches-git-develop-...vercel.app`, `who-clinches-git-main-...vercel.app`), update `.env.local`.

**MongoDB**: `MONGODB_APP_NAME` is metadata only (connection string `appName` parameter). No Atlas project or database name changes needed.

## Checklist

**Code**: `package.json` name, `lib/cfb/espn-client.ts` User-Agent (4 instances), `scripts/drop-database.js` default, `README.md`, docs with URLs, `scripts/test-api-pipeline.sh`, `scripts/extract-sec-rules.py` (if needed)

**Git**: Rename on GitHub, update local remote URL, verify connection

**Vercel**: Rename project, update `MONGODB_APP_NAME` env var (all environments), verify deployments, update `.env.local`

**Testing**: `npm run build`, `npm run lint`, `npm run test:all`, test API endpoints, verify MongoDB connections

**Documentation**: Update deployment URLs in all docs

## Breaking Changes

**Vercel URLs**: `sec-tiebreaker-git-develop-...vercel.app` → `who-clinches-git-develop-...vercel.app`. Bookmarks/external links will break. Mitigation: redirects or custom domain.

## Rollback

Revert code changes (`git revert`), rename GitHub repo back, revert Vercel project name and env vars.

## Notes

Git history preserved automatically. Vercel auto-updates deployments. MongoDB `appName` is metadata only. Consider custom domain to avoid future URL changes.

## Decision

**Status**: Pending user decision

**Recommendation**: 
- ✅ **Proceed** if expanding beyond SEC or want better branding
- ⚠️ **Defer** if close to launch or want to avoid URL disruption

