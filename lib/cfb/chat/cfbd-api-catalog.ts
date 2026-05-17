export const CFBD_API_CATALOG = `CFBD API Endpoints (* = required param, ? = optional):

## Teams
GET /teams — conference?, year?
GET /teams/fbs — year?
GET /teams/matchup — team1*, team2*, minYear?, maxYear?
GET /teams/ats — year*, conference?, team?
GET /roster — team?, year?, classification?
GET /talent — year*

## Conferences
GET /conferences

## Games
GET /games — year?, week?, seasonType?, classification?, team?, home?, away?, conference?, id?
GET /games/teams — year?, week?, team?, conference?, classification?, seasonType?, id?
GET /games/players — year?, week?, team?, conference?, classification?, seasonType?, category?, id?
GET /games/media — year*, seasonType?, week?, team?, conference?, mediaType?, classification?
GET /games/weather — year?, seasonType?, week?, team?, conference?, classification?, gameId?
GET /records — year?, team?, conference?
GET /calendar — year*
GET /scoreboard — classification?, conference?
GET /game/box/advanced — id*

## Stats
GET /stats/player/season — year*, conference?, team?, startWeek?, endWeek?, seasonType?, category?
GET /stats/season — year?, team?, conference?, startWeek?, endWeek?
GET /stats/categories
GET /stats/season/advanced — year?, team?, excludeGarbageTime?, startWeek?, endWeek?
GET /stats/game/advanced — year?, team?, week?, opponent?, excludeGarbageTime?, seasonType?
GET /stats/game/havoc — year?, team?, week?, opponent?, seasonType?

## Ratings
GET /ratings/sp — year?, team?
GET /ratings/sp/conferences — year?, conference?
GET /ratings/srs — year?, team?, conference?
GET /ratings/elo — year?, week?, seasonType?, team?, conference?
GET /ratings/fpi — year?, team?, conference?

## Rankings
GET /rankings — year*, seasonType?, week?

## Recruiting
GET /recruiting/players — year?, team?, position?, state?, classification?
GET /recruiting/teams — year?, team?
GET /recruiting/groups — team?, conference?, recruitType?, startYear?, endYear?

## Players
GET /player/search — searchTerm*, year?, team?, position?
GET /player/usage — year*, conference?, position?, team?, playerId?, excludeGarbageTime?
GET /player/returning — year?, team?, conference?
GET /player/portal — year*

## Betting
GET /lines — gameId?, year?, seasonType?, week?, team?, home?, away?, conference?, provider?

## AdjustedMetrics
GET /wepa/team/season — year?, team?, conference?
GET /wepa/players/passing — year?, team?, conference?, position?
GET /wepa/players/rushing — year?, team?, conference?, position?
GET /wepa/players/kicking — year?, team?, conference?

## Metrics
GET /ppa/predicted — down*, distance*
GET /ppa/teams — year?, team?, conference?, excludeGarbageTime?
GET /ppa/games — year*, week?, seasonType?, team?, conference?, excludeGarbageTime?
GET /ppa/players/games — year*, week?, seasonType?, team?, position?, playerId?, threshold?, excludeGarbageTime?
GET /ppa/players/season — year?, conference?, team?, position?, playerId?, threshold?, excludeGarbageTime?
GET /metrics/wp — gameId*
GET /metrics/wp/pregame — year?, week?, seasonType?, team?
GET /metrics/fg/ep

## Drives
GET /drives — year*, seasonType?, week?, team?, offense?, defense?, conference?, offenseConference?, defenseConference?, classification?

## Plays
GET /plays — year*, week*, team?, offense?, defense?, offenseConference?, defenseConference?, conference?, playType?, seasonType?, classification?
GET /plays/types
GET /plays/stats — year?, week?, team?, gameId?, athleteId?, statTypeId?, seasonType?, conference?
GET /live/plays — gameId*

## Draft
GET /draft/picks — year?, team?, school?, conference?, position?

## Coaches
GET /coaches — firstName?, lastName?, team?, year?, minYear?, maxYear?

Notes:
- The "team" param accepts school names (e.g., "Alabama", "Ohio State", "Texas A&M").
- The "conference" param accepts: SEC, ACC, B1G, Big 12, Pac-12, AAC, CUSA, MAC, MWC, SBC, Ind.
- Most endpoints default to the current season if year is omitted.
- seasonType values: "regular", "postseason", "both".
- Be judicious with API calls — only look up data not already in your context.`;
