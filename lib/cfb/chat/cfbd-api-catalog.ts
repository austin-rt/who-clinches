export const BLOCKED_PATHS = new Set(['/info']);

export const NEVER_CACHE_PATHS = new Set(['/scoreboard', '/live/plays', '/lines']);

export const CFBD_API_CATALOG = `You have access to the full College Football Data API (CFBD).
Swagger docs: https://apinext.collegefootballdata.com/swagger/v1/swagger.json

You may call ANY GET endpoint. Use cfbd_lookup with the path and query params.
Examples: /teams, /ratings/sp, /games, /rankings, /recruiting/teams, /stats/season/advanced, /player/search, /lines, etc.

Param conventions:
- "team" accepts school names (e.g., "Alabama", "Ohio State", "Texas A&M").
- "conference" accepts: SEC, ACC, B1G, Big 12, Pac-12, AAC, CUSA, MAC, MWC, SBC, Ind.
- Most endpoints default to the current season if year is omitted.
- seasonType values: "regular", "postseason", "both".
- Be judicious with API calls — only look up data not already in your context.`;
