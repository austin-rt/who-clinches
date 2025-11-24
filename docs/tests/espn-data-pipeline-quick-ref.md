# ESPN Data Pipeline Quick Reference

Quick reference for testing ESPN data ingestion and transformation.

**Related:** [Full Testing Guide](./espn-data-pipeline.md) | [ESPN API Testing](./espn-api-testing.md)

---

## Environments

| Environment | URL | Database | Branch |
|------------|-----|----------|--------|
| Local | http://localhost:3000 | `dev` | `develop` |
| Preview | https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/ | `preview` | `develop` |
| Production | https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/ | `production` | `main` |

---

## Quick Commands

### Setup Database Variables
```bash
READONLY_USER=$(grep MONGODB_USER_READONLY .env.local | cut -d '=' -f2)
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
MONGODB_HOST=$(grep MONGODB_HOST .env.local | cut -d '=' -f2)
MONGODB_DB=$(grep MONGODB_DB .env.local | cut -d '=' -f2)
MONGODB_APP_NAME=$(grep MONGODB_APP_NAME .env.local | cut -d '=' -f2)
MONGODB_URI="mongodb+srv://${READONLY_USER}:${READONLY_PW}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}"
```

### Seed Teams
```bash
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)
curl -X POST "{BASE_URL}/api/pull-teams/cfb/sec?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" -d '{}'
```

### Seed Games (Full Season)
```bash
curl -X POST "{BASE_URL}/api/pull-games/cfb/sec?x-vercel-protection-bypass=${BYPASS_TOKEN}" \
  -H "Content-Type: application/json" -d '{"season": 2025}'
```

### Verify Data
```bash
# Teams count
mongosh "${MONGODB_URI}" --eval "db.teams.countDocuments()" --quiet

# Games count by week
mongosh "${MONGODB_URI}" --eval "db.games.aggregate([{\$group: {_id: '\$week', count: {\$sum: 1}}}, {\$sort: {_id: 1}}]).forEach(w => print('Week', w._id + ':', w.count))" --quiet
```

---

## Pre-Seeding Checks

**Teams**: Check count before seeding - skip if 16 teams exist  
**Games**: Check count for target season/week - skip if data exists

---

## Expected Results

- **Teams**: 16 teams in database
- **Games**: ~128 games for 2025 season (weeks 1-14)
- **Fields**: `displayName`, `predictedScore`, team display fields (logo, color) present
- **Conference records**: Not null

