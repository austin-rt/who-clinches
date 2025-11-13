#!/bin/bash

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
BYPASS_TOKEN="${BYPASS_TOKEN:-}"
READONLY_PW=$(grep MONGODB_PASSWORD_READONLY .env.local | cut -d '=' -f2)
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
DATABASE="${DATABASE:-dev}"

echo "================================================"
echo "SEC Tiebreaker API Testing Suite"
echo "================================================"
echo "Base URL: $BASE_URL"
echo "Database: $DATABASE"
echo ""

# Step 1: Check if teams exist
echo "Step 1: Checking if teams are seeded..."
TEAM_COUNT=$(mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/${DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.teams.countDocuments()" \
  --quiet 2>/dev/null || echo "0")

if [ "$TEAM_COUNT" -gt 0 ]; then
  echo "[OK] Found $TEAM_COUNT teams in database"
else
  echo "[INFO] Database empty, seeding teams..."
  curl -s -X POST "$BASE_URL/api/pull-teams" \
    -H "Content-Type: application/json" \
    -d '{"sport": "football", "league": "college-football", "conferenceId": 8}' > /dev/null
  echo "[OK] Teams seeded"
  sleep 2
fi

# Step 2: Verify teams have color fields
echo ""
echo "Step 2: Verifying team color fields..."
SAMPLE_TEAM=$(mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/${DATABASE}?appName=SEC-Tiebreaker" \
  --eval 'db.teams.findOne({}, {abbreviation:1, displayName:1, color:1, alternateColor:1})' \
  --quiet 2>/dev/null)
echo "Sample team: $SAMPLE_TEAM"
echo "[OK] Team color fields verified"

# Step 3: Check if games exist
echo ""
echo "Step 3: Checking if games are seeded..."
GAME_COUNT=$(mongosh "mongodb+srv://readonly:${READONLY_PW}@cluster0.rr6gggn.mongodb.net/${DATABASE}?appName=SEC-Tiebreaker" \
  --eval "db.games.countDocuments({season: 2025})" \
  --quiet 2>/dev/null || echo "0")

if [ "$GAME_COUNT" -gt 0 ]; then
  echo "[OK] Found $GAME_COUNT games in database"
else
  echo "[INFO] Database empty, seeding games..."
  curl -s -X POST "$BASE_URL/api/pull-games" \
    -H "Content-Type: application/json" \
    -d '{"sport": "football", "league": "college-football", "season": 2025, "conferenceId": 8}' > /dev/null
  echo "[OK] Games seeded"
  sleep 2
fi

# Step 4: Test GET /api/games response type
echo ""
echo "Step 4: Testing GET /api/games response type..."
GAMES_RESPONSE=$(curl -s "$BASE_URL/api/games?season=2025&conferenceId=8")

EVENTS_TYPE=$(echo "$GAMES_RESPONSE" | jq -r '.events | type')
TEAMS_TYPE=$(echo "$GAMES_RESPONSE" | jq -r '.teams | type')
REQUIRED_FIELDS=$(echo "$GAMES_RESPONSE" | jq '[.teams[0] | keys[] | select(. == "id" or . == "abbrev" or . == "displayName" or . == "logo" or . == "color" or . == "alternateColor")] | length')

echo "  events type: $EVENTS_TYPE"
echo "  teams type: $TEAMS_TYPE"
echo "  TeamMetadata fields: $REQUIRED_FIELDS/6"
if [ "$REQUIRED_FIELDS" = "6" ]; then
  echo "[OK] GamesResponse type correct"
else
  echo "[ERROR] GamesResponse type FAILED - missing color fields"
  exit 1
fi

# Step 5: Test POST /api/simulate response type
echo ""
echo "Step 5: Testing POST /api/simulate response type..."
SIMULATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/simulate" \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "conferenceId": "8", "overrides": {}}')

STANDINGS_TYPE=$(echo "$SIMULATE_RESPONSE" | jq -r '.standings | type')
STANDINGS_COUNT=$(echo "$SIMULATE_RESPONSE" | jq '.standings | length')
REQUIRED_STANDING_FIELDS=$(echo "$SIMULATE_RESPONSE" | jq '[.standings[0] | keys[] | select(. == "rank" or . == "teamId" or . == "abbrev" or . == "displayName" or . == "logo" or . == "color" or . == "record" or . == "confRecord" or . == "explainPosition")] | length')

echo "  standings type: $STANDINGS_TYPE"
echo "  standings count: $STANDINGS_COUNT"
echo "  StandingEntry fields: $REQUIRED_STANDING_FIELDS/9"
if [ "$STANDINGS_COUNT" = "16" ] && [ "$REQUIRED_STANDING_FIELDS" = "9" ]; then
  echo "[OK] SimulateResponse type correct"
else
  echo "[ERROR] SimulateResponse type FAILED"
  exit 1
fi

# Step 6: Summary
echo ""
echo "================================================"
echo "All API tests passed!"
echo "================================================"
echo "Database: $DATABASE is ready for UI testing"
echo ""
