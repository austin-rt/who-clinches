import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { calculatePredictedScore } from '@/lib/cfb/helpers/prefill-helpers';
import { extractTeamsFromScoreboard } from '@/lib/reshape-teams-from-scoreboard';
import { MongoQuery, GameLean, TeamLean, GameState } from '@/lib/types';
import { GamesResponse, TeamMetadata, ApiErrorResponse } from '@/lib/api-types';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const queryGamesFromDatabase = async (
  sport: SportSlug,
  conf: ConferenceSlug,
  query: MongoQuery,
  from?: string,
  to?: string
): Promise<NextResponse<GamesResponse | ApiErrorResponse>> => {
  const { conferences, espnRoute } = sports[sport];
  const conferenceMeta = conferences[conf];

  if (!conferenceMeta) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: `Unsupported conference: ${conf} for sport: ${sport}`,
        code: 'INVALID_CONFERENCE',
      },
      { status: 400 }
    );
  }

  const [espnSport, espnLeague] = espnRoute.split('/');
  query.sport = espnSport;
  query.league = espnLeague;

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }

  query.conferenceGame = true;

  const conferenceTeams = await Team.find({
    conferenceId: conferenceMeta.espnId,
  })
    .lean()
    .exec();

  const conferenceTeamIds = new Set(conferenceTeams.map((team) => team._id));

  const allConferenceGames = await Game.find(query).lean().sort({ date: 1, week: 1 }).exec();

  const gamesRaw = allConferenceGames.filter(
    (game) =>
      conferenceTeamIds.has(game.home.teamEspnId) && conferenceTeamIds.has(game.away.teamEspnId)
  );

  const games: GameLean[] = gamesRaw.map(
    (game): GameLean => ({
      _id: String(game._id),
      espnId: String(game.espnId),
      displayName: String(game.displayName),
      date: String(game.date),
      week: typeof game.week === 'number' ? game.week : null,
      season: Number(game.season),
      sport: String(game.sport),
      league: String(game.league),
      state: game.state as GameState,
      completed: Boolean(game.completed),
      conferenceGame: Boolean(game.conferenceGame),
      neutralSite: Boolean(game.neutralSite),
      venue: {
        fullName: String(game.venue?.fullName || ''),
        city: String(game.venue?.city || ''),
        state: String(game.venue?.state || ''),
        timezone: String(game.venue?.timezone || 'America/New_York'),
      },
      home: {
        teamEspnId: String(game.home?.teamEspnId || ''),
        abbrev: String(game.home?.abbrev || ''),
        score: typeof game.home?.score === 'number' ? game.home.score : null,
        rank: typeof game.home?.rank === 'number' ? game.home.rank : null,
      },
      away: {
        teamEspnId: String(game.away?.teamEspnId || ''),
        abbrev: String(game.away?.abbrev || ''),
        score: typeof game.away?.score === 'number' ? game.away.score : null,
        rank: typeof game.away?.rank === 'number' ? game.away.rank : null,
      },
      odds: {
        favoriteTeamEspnId: game.odds?.favoriteTeamEspnId
          ? String(game.odds.favoriteTeamEspnId)
          : null,
        spread: typeof game.odds?.spread === 'number' ? game.odds.spread : null,
        overUnder: typeof game.odds?.overUnder === 'number' ? game.odds.overUnder : null,
      },
      predictedScore: game.predictedScore
        ? {
            home: Number(game.predictedScore?.home || 0),
            away: Number(game.predictedScore?.away || 0),
          }
        : undefined,
    })
  );

  const teamIds = new Set<string>();
  for (const game of games) {
    teamIds.add(game.home.teamEspnId);
    teamIds.add(game.away.teamEspnId);
  }

  const teamsRaw = await Team.find({ _id: { $in: Array.from(teamIds) } })
    .lean()
    .select('_id name abbreviation displayName logo color alternateColor conferenceStanding record')
    .exec();

  const teams: Pick<
    TeamLean,
    | '_id'
    | 'name'
    | 'abbreviation'
    | 'displayName'
    | 'logo'
    | 'color'
    | 'alternateColor'
    | 'conferenceStanding'
  >[] = teamsRaw.map(
    (
      team
    ): Pick<
      TeamLean,
      | '_id'
      | 'name'
      | 'abbreviation'
      | 'displayName'
      | 'logo'
      | 'color'
      | 'alternateColor'
      | 'conferenceStanding'
    > => ({
      _id: String(team._id),
      name: String(team.name),
      abbreviation: String(team.abbreviation),
      displayName: String(team.displayName),
      logo: String(team.logo),
      color: String(team.color || '000000'),
      alternateColor: String(team.alternateColor || '000000'),
      conferenceStanding: team.conferenceStanding ? String(team.conferenceStanding) : undefined,
    })
  );

  const teamMap: Record<string, TeamMetadata> = {};
  for (const team of teams) {
    const teamRaw = teamsRaw.find((t) => String(t._id) === team._id);
    teamMap[team._id] = {
      id: team._id,
      abbrev: team.abbreviation,
      name: team.name,
      displayName: team.displayName,
      logo: team.logo,
      color: team.color,
      alternateColor:
        team.alternateColor && team.alternateColor !== 'undefined' ? team.alternateColor : '000000',
      conferenceStanding: team.conferenceStanding || 'Tied for 1st',
      conferenceRecord: teamRaw?.record?.conference || '0-0',
    };
  }

  const lastUpdated = new Date().toISOString();

  const hasLiveGames = games.some((game) => game.state === 'in');
  const cacheMaxAge = hasLiveGames ? 10 : 60;

  return NextResponse.json<GamesResponse>(
    {
      events: games,
      teams: Object.values(teamMap),
      lastUpdated,
    },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheMaxAge}`,
      },
    }
  );
};

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: SportSlug; conf: ConferenceSlug }> }
) => {
  try {
    await dbConnect();

    const { sport, conf } = await params;

    const { searchParams } = new URL(request.url);

    const query: MongoQuery = {};

    const season = searchParams.get('season');
    const week = searchParams.get('week');
    const state = searchParams.get('state');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (season) {
      query.season = parseInt(season, 10);
    }

    if (week) {
      query.week = parseInt(week, 10);
    }

    if (state && ['pre', 'in', 'post'].includes(state)) {
      query.state = state;
    }

    return await queryGamesFromDatabase(sport, conf, query, from || undefined, to || undefined);
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DB_ERROR',
      },
      { status: 500 }
    );
  }
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: SportSlug; conf: ConferenceSlug }> }
) => {
  try {
    await dbConnect();

    const { sport, conf } = await params;

    const body = await request.json().catch(() => ({}));

    const query: MongoQuery = {};

    const season = body.season?.toString();
    const week = body.week?.toString();
    const state = body.state;
    const from = body.from;
    const to = body.to;
    const force = body.force === true;

    if (season) {
      query.season = parseInt(season, 10);
    }

    if (week) {
      query.week = parseInt(week, 10);
    }

    if (state && ['pre', 'in', 'post'].includes(state)) {
      query.state = state;
    }

    const { conferences, espnRoute } = sports[sport];
    const conferenceMeta = conferences[conf];

    if (!conferenceMeta) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: `Unsupported conference: ${conf} for sport: ${sport}`,
          code: 'INVALID_CONFERENCE',
        },
        { status: 400 }
      );
    }

    // Fetch from ESPN and upsert to database (always, since POST implies mutation)
    const bypassSeasonCheck = force || process.env.NODE_ENV === 'test';
    const shouldFetchFromESPN = bypassSeasonCheck || (await isInSeasonFromESPN(sport, conf));

    if (shouldFetchFromESPN) {
      try {
        const client = createESPNClient(espnRoute);

        // Determine season year
        let seasonYear: number;
        try {
          const calendarResponse = await client.getScoreboard({
            groups: conferenceMeta.espnId,
          });
          seasonYear =
            calendarResponse.season?.year ||
            calendarResponse.leagues?.[0]?.season?.year ||
            (season ? parseInt(season, 10) : new Date().getFullYear());
        } catch {
          seasonYear = season ? parseInt(season, 10) : new Date().getFullYear();
        }

        let scoreboardResponse;
        if (week) {
          scoreboardResponse = await client.getScoreboard({
            groups: conferenceMeta.espnId,
            season: seasonYear,
            week: parseInt(week, 10),
          });
        } else {
          scoreboardResponse = await client.getScoreboard({
            groups: conferenceMeta.espnId,
            dates: seasonYear,
          });
        }

        // Extract teams from scoreboard and upsert them (always update to get latest data)
        const extractedTeams = extractTeamsFromScoreboard(scoreboardResponse, conferenceMeta);
        if (extractedTeams.length > 0) {
          for (const team of extractedTeams) {
            try {
              const existingTeam = await Team.findOne({ _id: team._id }).lean().exec();
              const existingStanding =
                existingTeam && !Array.isArray(existingTeam) && existingTeam.conferenceStanding
                  ? existingTeam.conferenceStanding
                  : undefined;
              const existingRecord =
                existingTeam &&
                !Array.isArray(existingTeam) &&
                existingTeam.record &&
                typeof existingTeam.record === 'object' &&
                'conference' in existingTeam.record
                  ? (existingTeam.record as { conference?: string }).conference
                  : undefined;

              const updateData: Record<string, unknown> = {
                ...team,
                lastUpdated: new Date(),
              };

              // Only set conferenceStanding if we have existing data, otherwise use default for new teams
              if (existingStanding) {
                updateData.conferenceStanding = existingStanding;
              } else {
                updateData.conferenceStanding = 'Tied for 1st';
              }

              // Only set record.conference if it exists - don't overwrite with default
              if (existingRecord) {
                updateData['record.conference'] = existingRecord;
              }
              // If no existing record, don't set it at all (let it remain undefined/null)

              await Team.findOneAndUpdate({ _id: team._id }, updateData, {
                upsert: true,
                new: true,
              });
            } catch (error) {
              await ErrorModel.create({
                timestamp: new Date(),
                endpoint: `/api/games/${sport}/${conf}`,
                payload: { teamId: team._id },
                error: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack || '' : '',
              });
            }
          }
        }

        // Reshape and upsert games
        const reshaped = reshapeScoreboardData(scoreboardResponse, espnRoute, seasonYear);
        const conferenceGamesOnly =
          reshaped.games?.filter((game) => game.conferenceGame === true) || [];

        if (conferenceGamesOnly.length > 0) {
          const teamIds = [
            ...new Set([
              ...conferenceGamesOnly.map((g) => g.home.teamEspnId),
              ...conferenceGamesOnly.map((g) => g.away.teamEspnId),
            ]),
          ];
          const teams = await Team.find({ _id: { $in: teamIds } }).lean();
          const teamMap = new Map(teams.map((t) => [String(t._id), t]));

          for (const game of conferenceGamesOnly) {
            try {
              const homeTeam = teamMap.get(game.home.teamEspnId) || {};
              const awayTeam = teamMap.get(game.away.teamEspnId) || {};

              const predictedScore = calculatePredictedScore(
                game,
                homeTeam as {
                  record?: {
                    stats?: {
                      avgPointsFor?: number;
                      avgPointsAgainst?: number;
                    };
                  };
                },
                awayTeam as {
                  record?: {
                    stats?: {
                      avgPointsFor?: number;
                      avgPointsAgainst?: number;
                    };
                  };
                }
              );

              await Game.findOneAndUpdate(
                { espnId: game.espnId },
                {
                  ...game,
                  season: seasonYear,
                  predictedScore,
                },
                { upsert: true, new: true }
              );
            } catch (error) {
              await ErrorModel.create({
                timestamp: new Date(),
                endpoint: `/api/games/${sport}/${conf}`,
                payload: { gameId: game.espnId },
                error: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack || '' : '',
              });
            }
          }
        }
      } catch (error) {
        // Log error but continue to return data from DB
        await ErrorModel.create({
          timestamp: new Date(),
          endpoint: `/api/games/${sport}/${conf}`,
          payload: { sport, conf },
          error: error instanceof Error ? error.message : 'Unknown error',
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
      }
    }

    return await queryGamesFromDatabase(sport, conf, query, from || undefined, to || undefined);
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'DB_ERROR',
      },
      { status: 500 }
    );
  }
};
