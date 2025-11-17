#!/bin/bash

# Script to run cron jobs for different environments
# Usage: bash scripts/run-cron.sh <endpoint> [queryParams] [environment]
# Example: bash scripts/run-cron.sh update-games "" dev
# Example: bash scripts/run-cron.sh update-games "allGames=true" preview
# Example: npm run cron:games -- production

ENDPOINT=$1
ARG2=$2
ARG3=$3

# Determine query params and environment
# If $2 is dev/preview/production, it's the environment (no query params)
# Otherwise, $2 is query params and $3 is environment (or defaults to dev)
if [[ "$ARG2" == "dev" || "$ARG2" == "preview" || "$ARG2" == "production" ]]; then
  QUERY_PARAMS=""
  ENV=$ARG2
elif [[ -n "$ARG3" ]]; then
  # $3 is explicitly provided - validate it
  if [[ "$ARG3" != "dev" && "$ARG3" != "preview" && "$ARG3" != "production" ]]; then
    echo "Error: Invalid environment '$ARG3'. Use: dev, preview, or production"
    exit 1
  fi
  QUERY_PARAMS=$ARG2
  ENV=$ARG3
elif [[ -n "$ARG2" && "$ARG2" != *"="* ]]; then
  # $2 is provided, doesn't contain "=" (so not query params), and isn't a valid environment
  # This looks like someone tried to pass an invalid environment name
  echo "Error: Invalid environment '$ARG2'. Use: dev, preview, or production"
  echo "Note: If you meant to pass query params, they must contain '=' (e.g., 'allGames=true')"
  exit 1
else
  # No environment specified, default to dev
  # $2 might be query params (contains "=") or empty
  QUERY_PARAMS=$ARG2
  ENV="dev"
fi

# Get secrets from .env.local
CRON_SECRET=$(grep CRON_SECRET .env.local | cut -d '=' -f2)
BYPASS_TOKEN=$(grep VERCEL_AUTOMATION_BYPASS_SECRET .env.local | cut -d '=' -f2)

# Set base URL and build full URL based on environment
case $ENV in
  dev)
    BASE_URL="http://localhost:3000"
    BYPASS_PARAM=""
    ;;
  preview)
    BASE_URL="https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app"
    BYPASS_PARAM="x-vercel-protection-bypass=${BYPASS_TOKEN}"
    ;;
  production)
    BASE_URL="https://sec-tiebreaker-git-main-austinrts-projects.vercel.app"
    BYPASS_PARAM="x-vercel-protection-bypass=${BYPASS_TOKEN}"
    ;;
  *)
    echo "Error: Invalid environment. Use: dev, preview, or production"
    exit 1
    ;;
esac

# Build query string
QUERY_STRING=""
if [ -n "$QUERY_PARAMS" ]; then
  QUERY_STRING="?${QUERY_PARAMS}"
fi

if [ -n "$BYPASS_PARAM" ]; then
  if [ -n "$QUERY_STRING" ]; then
    QUERY_STRING="${QUERY_STRING}&${BYPASS_PARAM}"
  else
    QUERY_STRING="?${BYPASS_PARAM}"
  fi
fi

# Build full URL
FULL_URL="${BASE_URL}/api/cron/${ENDPOINT}${QUERY_STRING}"

# Make the request
echo "Running cron job: ${ENDPOINT} on ${ENV}..."
curl -X GET "${FULL_URL}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  | jq .

