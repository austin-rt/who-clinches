import { NextRequest, NextResponse } from 'next/server';
import { getGames, getTeams, getRankings, getSp, getFpi } from '@/lib/cfb/cfbd-cached';
import { reshapeCfbdGames } from '@/lib/reshape-games';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { GameLean, TeamLean } from '@/lib/types';
import { GamesResponse, TeamMetadata, ApiErrorResponse } from '@/app/store/api';
import type { Conference, PollWeek } from 'cfbd';
import {
  getConferenceMetadata,
  isValidSport,
  isValidConference,
  CFBD_SEASON_TYPE,
  CFB_CONFERENCE_CONFIGS,
  type SportSlug,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';
import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { calculateDivisionalStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateDivisionalStandings';
import { describeRequiredCfbdRatingFeeds } from '@/lib/cfb/tiebreaker-cfbd-requirements';
import { getDefaultSeasonFromCfbd } from '@/lib/cfb/helpers/get-default-season-cfbd';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const normalizeTeamName = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^the\s+/i, '');

const CFP_POLL_NAMES = ['playoff', 'cfp', 'college football playoff'];
const AP_POLL_NAMES = ['ap top 25'];

const buildRankMapFromPoll = (
  polls: PollWeek['polls'],
  pollNames: string[]
): Map<string, number> | null => {
  const poll = polls?.find((p) => pollNames.some((name) => p.poll?.toLowerCase().includes(name)));
  if (!poll?.ranks?.length) return null;

  const map = new Map<string, number>();
  for (const r of poll.ranks) {
    if (r.rank === null || r.rank === undefined) continue;
    if (r.teamId !== null && r.teamId !== undefined) map.set(String(r.teamId), r.rank);
    if (r.school) map.set(normalizeTeamName(r.school), r.rank);
  }
  return map.size > 0 ? map : null;
};

const resolveWeeklyRanks = (pollWeeks: PollWeek[] | null): Map<number, Map<string, number>> => {
  const weekMap = new Map<number, Map<string, number>>();
  if (!pollWeeks) return weekMap;

  for (const pw of pollWeeks) {
    if (pw.week === null || pw.week === undefined) continue;
    const resolved =
      buildRankMapFromPoll(pw.polls, CFP_POLL_NAMES) ??
      buildRankMapFromPoll(pw.polls, AP_POLL_NAMES);
    if (resolved) weekMap.set(pw.week, resolved);
  }
  return weekMap;
};

const getLatestRanks = (weekMap: Map<number, Map<string, number>>): Map<string, number> => {
  if (weekMap.size === 0) return new Map();
  const maxWeek = Math.max(...weekMap.keys());
  return weekMap.get(maxWeek)!;
};

const lookupRank = (
  teamId: string,
  teamName: string,
  week: number | null,
  weekMap: Map<number, Map<string, number>>
): number | null => {
  if (week === null || week === undefined) return null;
  const rankMap = weekMap.get(week);
  if (!rankMap) return null;
  return rankMap.get(teamId) ?? rankMap.get(normalizeTeamName(teamName)) ?? null;
};

const attachRanksToGames = (
  games: GameLean[],
  weekMap: Map<number, Map<string, number>>
): GameLean[] =>
  games.map((game) => ({
    ...game,
    home: {
      ...game.home,
      rank: lookupRank(game.home.teamId, game.home.displayName, game.week, weekMap),
    },
    away: {
      ...game.away,
      rank: lookupRank(game.away.teamId, game.away.displayName, game.week, weekMap),
    },
  }));

const fetchGamesFromCfbd = async (
  sport: SportSlug,
  conf: NonNullable<Conference['abbreviation']>,
  season: number,
  week?: number
): Promise<NextResponse<GamesResponse | ApiErrorResponse>> => {
  const conferenceMeta = getConferenceMetadata(conf);

  if (!conferenceMeta) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: `Unsupported conference: ${conf} for sport: ${sport}`,
        code: 'INVALID_CONFERENCE',
      },
      { status: 400 }
    );
  }

  try {
    const cfbdGames = await getGames({
      year: season,
      conference: conferenceMeta.cfbdId,
      seasonType: CFBD_SEASON_TYPE.REGULAR,
      week,
    });

    const conferenceGamesOnly = cfbdGames.filter(
      (game) => game.conferenceGame === true && !game.notes?.toLowerCase().includes('championship')
    );

    const teamsByConference = await getTeams(season);
    const cfbdTeams = teamsByConference[conferenceMeta.cfbdId] ?? [];

    const teams = extractTeamsFromCfbd(cfbdTeams, conferenceMeta.cfbdId);
    const teamMap = new Map<string, TeamLean>(
      teams.map((team) => [
        team._id,
        {
          ...team,
          conferenceId: team.conference,
        } as TeamLean,
      ])
    );

    const reshaped = reshapeCfbdGames(conferenceGamesOnly, teamMap);
    const allGames: GameLean[] = reshaped.games.map((game) => ({
      _id: game.id,
      ...game,
    }));

    const { filterRegularSeasonGames } = await import(
      '@/lib/cfb/tiebreaker-rules/common/core-helpers'
    );
    const filteredGames = filterRegularSeasonGames(allGames);

    const teamLeanArray: TeamLean[] = teams.map((team) => ({
      _id: team._id,
      name: team.name,
      displayName: team.displayName,
      shortDisplayName: team.shortDisplayName,
      abbreviation: team.abbreviation,
      logo: team.logo,
      color: team.color,
      alternateColor: team.alternateColor,
      conferenceId: team.conference,
      division: team.division,
      record: team.record,
      conferenceStanding: team.conferenceStanding,
    }));

    const config = CFB_CONFERENCE_CONFIGS[conferenceMeta.cfbdId];
    const ratingReqs = config ? describeRequiredCfbdRatingFeeds(config) : null;

    const [rankingsResponse, spRatingsResponse, fpiRatingsResponse] = await Promise.all([
      getRankings({ year: season }),
      ratingReqs?.needsRatings ? getSp({ year: season }) : Promise.resolve(null),
      ratingReqs?.needsRatings ? getFpi({ year: season }) : Promise.resolve(null),
    ] as const);

    let teamsEnriched = teamLeanArray;

    if (ratingReqs?.needsRatings) {
      const { attachSpPlusToTeams } = await import('@/lib/cfb/helpers/attach-sp-plus');
      const { attachSorToTeams } = await import('@/lib/cfb/helpers/attach-sor');
      teamsEnriched = attachSpPlusToTeams(teamsEnriched, spRatingsResponse!);
      teamsEnriched = attachSorToTeams(teamsEnriched, fpiRatingsResponse!);
    }

    const weeklyRanks = resolveWeeklyRanks(rankingsResponse);
    const gamesWithRanks = attachRanksToGames(filteredGames, weeklyRanks);
    const latestRanks = getLatestRanks(weeklyRanks);

    if (ratingReqs?.needsRatings) {
      teamsEnriched = teamsEnriched.map((t) => ({
        ...t,
        nationalRank:
          latestRanks.get(t._id) ?? latestRanks.get(normalizeTeamName(t.displayName)) ?? null,
      }));
    }

    const completedConferenceGames = gamesWithRanks.filter(
      (game) =>
        game.completed &&
        game.conferenceGame &&
        game.home.score !== null &&
        game.away.score !== null
    );

    const standingsMap = new Map<
      string,
      { rank: number; confRecord: { wins: number; losses: number }; division?: string | null }
    >();

    if (completedConferenceGames.length > 0 && config) {
      const hasDivisions = teamsEnriched.some(
        (team) => team.division !== null && team.division !== undefined
      );

      const { standings } = hasDivisions
        ? await calculateDivisionalStandings(completedConferenceGames, teamsEnriched, config)
        : await calculateStandings(
            completedConferenceGames,
            teams.map((team) => team._id),
            config,
            teamsEnriched
          );

      for (const standing of standings) {
        standingsMap.set(standing.teamId, {
          rank: standing.rank,
          confRecord: standing.confRecord,
          division: standing.division ?? null,
        });
      }
    }

    const enrichedMap = new Map(teamsEnriched.map((t) => [t._id, t]));
    const teamMetadata: Record<string, TeamMetadata> = {};
    for (const team of teams) {
      const standing = standingsMap.get(team._id);
      const enriched = enrichedMap.get(team._id);
      const conferenceStanding = team.conferenceStanding || 'Tied for 1st';
      const nationalRank =
        latestRanks.get(team._id) ?? latestRanks.get(normalizeTeamName(team.displayName)) ?? null;
      teamMetadata[team._id] = {
        id: team._id,
        abbrev: team.abbreviation,
        name: team.name,
        displayName: team.displayName,
        shortDisplayName: team.shortDisplayName,
        logo: team.logo,
        color: team.color,
        alternateColor:
          team.alternateColor && team.alternateColor !== 'undefined'
            ? team.alternateColor
            : '000000',
        conferenceId: team.conference,
        conferenceStanding,
        conferenceRecord: standing
          ? `${standing.confRecord.wins}-${standing.confRecord.losses}`
          : team.record?.conference || '0-0',
        record: team.record,
        rank: standing ? standing.rank : null,
        division: standing?.division ?? team.division ?? null,
        nationalRank,
        spPlusRating: enriched?.spPlusRating ?? null,
        sor: enriched?.sor ?? null,
      };
    }

    const hasLiveGames = gamesWithRanks.some((game) => game.state === 'in');
    const cacheMaxAge = hasLiveGames ? 10 : 60;

    return NextResponse.json<GamesResponse>(
      {
        events: gamesWithRanks,
        teams: Object.values(teamMetadata),
        season,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${cacheMaxAge}`,
        },
      }
    );
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/games/[sport]/[conf]',
      action: 'fetch-games',
    });
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'API_ERROR',
      },
      { status: 500 }
    );
  }
};

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; conf: string }> }
) => {
  try {
    const { sport: sportParam, conf: confParam } = await params;

    if (!isValidSport(sportParam)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Unsupported sport: ${sportParam}`,
          code: 'INVALID_SPORT',
        },
        { status: 400 }
      );
    }

    if (!isValidConference(confParam)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Unsupported conference: ${confParam}`,
          code: 'INVALID_CONFERENCE',
        },
        { status: 400 }
      );
    }

    const sport = sportParam as SportSlug;
    const conf = confParam as CFBConferenceAbbreviation;
    const { searchParams } = new URL(request.url);

    const season = searchParams.get('season');
    const week = searchParams.get('week');

    const seasonYear = season ? parseInt(season, 10) : await getDefaultSeasonFromCfbd();

    if (week && !season) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Season is required when week is provided',
          code: 'MISSING_SEASON',
        },
        { status: 400 }
      );
    }

    return await fetchGamesFromCfbd(sport, conf, seasonYear, week ? parseInt(week, 10) : undefined);
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/games/[sport]/[conf]',
      action: 'get-games',
    });
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'API_ERROR',
      },
      { status: 500 }
    );
  }
};
