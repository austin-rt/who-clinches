# Rename Project: sec-tiebreaker → who-clinches

**Status**: Planning  
**Complexity**: Moderate (30-60 minutes)  
**Risk**: Low  
**Breaking Changes**: Vercel URLs will change

## Overview

This document outlines the process for renaming the project from `sec-tiebreaker` to `who-clinches` while preserving git history and updating all references.

## Rationale

**Reasons to rename:**
- Better reflects the product's purpose (determining who clinches playoff spots)
- More scalable if expanding beyond SEC
- Cleaner brand identity

**Reasons to keep current name:**
- Avoids URL changes during active development
- Less disruption if close to launch
- Current name is functional

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

### Phase 1: Code Updates (Before Git/Vercel Changes)

1. **Update package.json**
   ```json
   "name": "who-clinches"
   ```

2. **Update User-Agent strings**
   - File: `lib/cfb/espn-client.ts`
   - Replace: `'SEC-Tiebreaker/1.0'` → `'Who-Clinches/1.0'`
   - 4 instances total

3. **Update MongoDB app name defaults**
   - File: `scripts/drop-database.js`
   - Replace: `'SEC-Tiebreaker'` → `'Who-Clinches'`

4. **Update documentation**
   - `README.md`: Update project structure, URLs, MONGODB_APP_NAME example
   - `docs/tests/espn-data-pipeline-quick-ref.md`: Update deployment URLs
   - `docs/plans/frontend/phase3.md`: Update localStorage key references
   - `scripts/test-api-pipeline.sh`: Update MONGODB_APP_NAME references
   - `scripts/extract-sec-rules.py`: Update output filename if needed

5. **Update environment variable examples**
   - `README.md`: `MONGODB_APP_NAME=Who-Clinches`
   - All documentation references

### Phase 2: Git Repository Rename

1. **Rename on GitHub**
   - Go to repository Settings → General
   - Scroll to "Repository name"
   - Change from `sec-tiebreaker` to `who-clinches`
   - Click "Rename"

2. **Update local remote URL**
   ```bash
   git remote set-url origin https://github.com/austinrts/who-clinches.git
   # Or if using SSH:
   git remote set-url origin git@github.com:austinrts/who-clinches.git
   ```

3. **Verify connection**
   ```bash
   git remote -v
   git fetch
   ```

### Phase 3: Vercel Configuration

1. **Rename project in Vercel**
   - Go to Vercel dashboard
   - Project Settings → General
   - Update project name to `who-clinches`

2. **Update environment variables**
   - Go to Project Settings → Environment Variables
   - Update `MONGODB_APP_NAME` from `SEC-Tiebreaker` to `Who-Clinches`
   - Apply to all environments (Development, Preview, Production)

3. **Verify deployments**
   - New URLs will be:
     - Develop: `who-clinches-git-develop-austinrts-projects.vercel.app`
     - Production: `who-clinches-git-main-austinrts-projects.vercel.app`
   - Test both deployments

4. **Update local environment**
   - Update `.env.local`: `MONGODB_APP_NAME=Who-Clinches`

### Phase 3.5: MongoDB Configuration

**Important Notes:**
- **No MongoDB Atlas project changes needed** - The `MONGODB_APP_NAME` is only metadata in the connection string (used for logging/monitoring)
- **Database names stay the same** - They're environment-based (`test`, `preview`, `production`) and don't need renaming
- **Connection string format**: `mongodb+srv://user:pass@host/db?appName=Who-Clinches`
- The `appName` parameter is just for identifying connections in MongoDB Atlas monitoring/logs

**What changes:**
- Only the `appName` parameter in connection strings (already covered in Phase 3 environment variables)
- No MongoDB Atlas project settings need updating
- No database names need changing

### Phase 4: localStorage Migration (If Needed)

If localStorage keys are already in use:

1. **Create migration helper** (optional)
   ```typescript
   // app/utils/migrate-storage.ts
   export function migrateStorageKeys() {
     const oldKey = 'sec-tiebreaker-overrides-2025';
     const newKey = 'who-clinches-overrides-2025';
     // ... migration logic
   }
   ```

2. **Update localStorage key references**
   - `docs/plans/frontend/phase3.md`: Update key format
   - Any implementation files using the old key

## Checklist

### Code Updates
- [ ] Update `package.json` name field
- [ ] Update User-Agent strings in `lib/cfb/espn-client.ts` (4 instances)
- [ ] Update MongoDB app name default in `scripts/drop-database.js`
- [ ] Update `README.md` (project structure, URLs, env vars)
- [ ] Update `docs/tests/espn-data-pipeline-quick-ref.md` (deployment URLs)
- [ ] Update `docs/plans/frontend/phase3.md` (localStorage keys)
- [ ] Update `scripts/test-api-pipeline.sh` (MONGODB_APP_NAME)
- [ ] Update `scripts/extract-sec-rules.py` (if output filename references old name)

### Git Repository
- [ ] Rename repository on GitHub
- [ ] Update local remote URL
- [ ] Verify git connection works

### Vercel
- [ ] Rename project in Vercel dashboard
- [ ] Update `MONGODB_APP_NAME` environment variable in Vercel (all environments)
- [ ] Verify develop branch deployment works
- [ ] Verify main branch deployment works
- [ ] Update local `.env.local` file

### Testing
- [ ] Run `npm run build` (should pass)
- [ ] Run `npm run lint` (should pass)
- [ ] Run `npm run test:all` (should pass)
- [ ] Test API endpoints on new Vercel URLs
- [ ] Verify MongoDB connections work with new app name

### Documentation
- [ ] Update all deployment URLs in documentation
- [ ] Update memory/notes about deployment URLs
- [ ] Update any external references (if applicable)

## Files to Update

### Code Files
- `package.json`
- `lib/cfb/espn-client.ts`
- `scripts/drop-database.js`
- `scripts/test-api-pipeline.sh`
- `scripts/extract-sec-rules.py` (if needed)

### Documentation Files
- `README.md`
- `docs/tests/espn-data-pipeline-quick-ref.md`
- `docs/plans/frontend/phase3.md`
- `docs/guides/api-reference.md` (if MONGODB_APP_NAME mentioned)

## Breaking Changes

1. **Vercel URLs will change**
   - Old: `sec-tiebreaker-git-develop-...vercel.app`
   - New: `who-clinches-git-develop-...vercel.app`
   - Impact: Any bookmarks, external links, or integrations using old URLs will break
   - Mitigation: Can set up redirects if needed, or use custom domain

2. **localStorage keys** (if implemented)
   - Old: `sec-tiebreaker-overrides-{season}`
   - New: `who-clinches-overrides-{season}`
   - Impact: Users lose saved overrides (one-time)
   - Mitigation: Migration helper can preserve data

## Rollback Plan

If issues arise:

1. **Revert code changes**
   ```bash
   git revert <commit-hash>
   ```

2. **Revert GitHub rename**
   - Settings → General → Rename back to `sec-tiebreaker`

3. **Revert Vercel changes**
   - Rename project back
   - Revert environment variables

## Notes

- **GitHub**: Git history is preserved automatically when renaming repository
- **Vercel**: Automatically updates deployments after rename, URLs will change
- **MongoDB**: 
  - `MONGODB_APP_NAME` is just metadata in connection string (used for logging/monitoring in MongoDB Atlas)
  - No MongoDB Atlas project settings need changing
  - Database names stay the same (environment-based: `test`, `preview`, `production`)
  - Only the `appName` query parameter in connection strings changes
- User-Agent string is informational only
- Consider setting up custom domain to avoid future URL changes

## Decision

**Status**: Pending user decision

**Recommendation**: 
- ✅ **Proceed** if expanding beyond SEC or want better branding
- ⚠️ **Defer** if close to launch or want to avoid URL disruption

