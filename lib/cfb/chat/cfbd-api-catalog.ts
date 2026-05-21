export const BLOCKED_PATHS = new Set(['/info']);

export const CFBD_API_CATALOG = `CFBD API — you may call ANY GET endpoint via cfbd_lookup.
Full docs: https://apinext.collegefootballdata.com/swagger/v1/swagger.json

Common endpoints (* = required, ? = optional):

/games — year?, week?, seasonType?, team?, conference?, home?, away?, classification?, id?
/games/teams — year?, week?, team?, conference?, classification?, seasonType?, id?
/games/players — year?, week?, team?, conference?, classification?, seasonType?, category?, id?
/records — year?, team?, conference?
/scoreboard — classification?, conference?
/game/box/advanced — id*
/calendar — year*
/games/media — year*, seasonType?, week?, team?, conference?, mediaType?, classification?
/games/weather — year?, seasonType?, week?, team?, conference?, classification?, gameId?
/rankings — year*, seasonType?, week?
/ratings/sp — year?, team?
/ratings/srs — year?, team?, conference?
/ratings/elo — year?, week?, seasonType?, team?, conference?
/ratings/fpi — year?, team?, conference?
/ratings/sp/conferences — year?, conference?
/stats/season — year?, team?, conference?, startWeek?, endWeek?
/stats/season/advanced — year?, team?, excludeGarbageTime?, startWeek?, endWeek?
/stats/game/advanced — year?, team?, week?, opponent?, excludeGarbageTime?, seasonType?
/stats/player/season — year*, conference?, team?, startWeek?, endWeek?, seasonType?, category?
/teams — conference?, year?
/teams/fbs — year?
/teams/matchup — team1*, team2*, minYear?, maxYear?
/roster — team?, year?, classification?
/talent — year*
/player/search — searchTerm*, year?, team?, position?
/player/portal — year*
/player/returning — year?, team?, conference?
/player/usage — year*, conference?, position?, team?, playerId?, excludeGarbageTime?
/recruiting/players — year?, team?, position?, state?, classification?
/recruiting/teams — year?, team?
/coaches — firstName?, lastName?, team?, year?, minYear?, maxYear?
/lines — gameId?, year?, seasonType?, week?, team?, home?, away?, conference?, provider?
/drives — year*, seasonType?, week?, team?, offense?, defense?, conference?
/draft/picks — year?, team?, school?, conference?, position?
/ppa/teams — year?, team?, conference?, excludeGarbageTime?
/wepa/team/season — year?, team?, conference?

This is not exhaustive — you can call any CFBD GET endpoint not listed here.

Notes:
- "team" accepts school names (e.g., "Alabama", "Ohio State", "Texas A&M").
- "conference" accepts: SEC, ACC, B1G, Big 12, Pac-12, AAC, CUSA, MAC, MWC, SBC, Ind.
- Most endpoints default to the current season if year is omitted.
- seasonType values: "regular", "postseason", "both".
- Be judicious — only look up data not already in your context.`;
