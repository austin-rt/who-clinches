#!/usr/bin/env bash
set -euo pipefail

CREDS="${HOME}/.cursor/upstash-mcp.env"
mkdir -p "$(dirname "$CREDS")"

if [[ -f "$CREDS" ]]; then
  read -r -p "Overwrite existing ${CREDS}? [y/N] " ans
  if [[ "${ans,,}" != "y" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

read -r -p "Upstash account email: " email
read -r -s -p "Upstash account API key (Console → Account → API keys): " apikey
echo

umask 077
printf 'UPSTASH_MCP_EMAIL=%s\nUPSTASH_MCP_API_KEY=%s\n' "$email" "$apikey" >"$CREDS"
chmod 600 "$CREDS"

LAUNCH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/upstash-mcp-launch.sh"
echo "Wrote ${CREDS} (mode 600)."
echo "Set ~/.cursor/mcp.json upstash entry to:"
echo "  \"command\": \"${LAUNCH}\","
echo "  \"args\": []"
