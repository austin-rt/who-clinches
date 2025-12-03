import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { calculatePredictedScore } from '@/lib/cfb/helpers/prefill-helpers';
import { extractTeamsFromScoreboard } from '@/lib/reshape-teams-from-scoreboard';
import { calculateStandingsFromCompletedGames } from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
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
  to?: string,
  seasonFromESPN?: number
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
    query.date = {
      ...(from && { $gte: from }),
      ...(to && { $lte: to }),
    };
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
      espnId: game.espnId,
      displayName: game.displayName,
      date: game.date,
      week: game.week ?? null,
      season: game.season,
      sport: game.sport,
      league: game.league,
      state: game.state as GameState,
      completed: game.completed,
      conferenceGame: game.conferenceGame,
      neutralSite: game.neutralSite,
      venue: {
        fullName: game.venue.fullName,
        city: game.venue.city,
        state: game.venue.state,
        timezone: game.venue.timezone,
      },
      home: {
        teamEspnId: game.home.teamEspnId,
        abbrev: game.home.abbrev,
        displayName: game.home.displayName,
        shortDisplayName: game.home.shortDisplayName,
        logo: game.home.logo,
        color: game.home.color,
        alternateColor: game.home.alternateColor,
        score: game.home.score ?? null,
        rank: game.home.rank ?? null,
      },
      away: {
        teamEspnId: game.away.teamEspnId,
        abbrev: game.away.abbrev,
        displayName: game.away.displayName,
        shortDisplayName: game.away.shortDisplayName,
        logo: game.away.logo,
        color: game.away.color,
        alternateColor: game.away.alternateColor,
        score: game.away.score ?? null,
        rank: game.away.rank ?? null,
      },
      odds: {
        favoriteTeamEspnId: game.odds.favoriteTeamEspnId ?? null,
        spread: game.odds.spread ?? null,
        overUnder: game.odds.overUnder ?? null,
      },
      predictedScore: {
        home: game.predictedScore.home,
        away: game.predictedScore.away,
      },
      gameType: game.gameType && {
        name: game.gameType.name,
        abbreviation: game.gameType.abbreviation,
      },
    })
  );

  const teamIds = new Set<string>();
  for (const game of games) {
    teamIds.add(game.home.teamEspnId);
    teamIds.add(game.away.teamEspnId);
  }

  const teamsRaw = await Team.find({ _id: { $in: Array.from(teamIds) } })
    .lean()
    .select(
      '_id name abbreviation displayName shortDisplayName logo color alternateColor conferenceStanding record'
    )
    .exec();

  const teams: Pick<
    TeamLean,
    | '_id'
    | 'name'
    | 'abbreviation'
    | 'displayName'
    | 'shortDisplayName'
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
      | 'shortDisplayName'
      | 'logo'
      | 'color'
      | 'alternateColor'
      | 'conferenceStanding'
    > => ({
      _id: String(team._id),
      name: team.name,
      abbreviation: team.abbreviation,
      displayName: team.displayName,
      shortDisplayName: team.shortDisplayName,
      logo: team.logo,
      color: team.color,
      alternateColor: team.alternateColor,
      conferenceStanding: team.conferenceStanding ?? '',
    })
  );

  const completedConferenceGames = games.filter(
    (game) =>
      game.completed && game.conferenceGame && game.home.score !== null && game.away.score !== null
  );

  const allConferenceTeamIds = conferenceTeams.map((team) => String(team._id));
  const standingsMap = new Map<
    string,
    { rank: number; confRecord: { wins: number; losses: number } }
  >();

  if (completedConferenceGames.length > 0) {
    const { standings } = calculateStandingsFromCompletedGames(
      completedConferenceGames,
      allConferenceTeamIds
    );
    for (const standing of standings) {
      standingsMap.set(standing.teamId, {
        rank: standing.rank,
        confRecord: standing.confRecord,
      });
    }
  }

  const teamMap: Record<string, TeamMetadata> = {};
  for (const team of teams) {
    const standing = standingsMap.get(team._id);
    const conferenceStanding = team.conferenceStanding || 'Tied for 1st';
    teamMap[team._id] = {
      id: team._id,
      abbrev: team.abbreviation,
      name: team.name,
      displayName: team.displayName,
      shortDisplayName: team.shortDisplayName,
      logo: team.logo,
      color: team.color,
      alternateColor:
        team.alternateColor && team.alternateColor !== 'undefined' ? team.alternateColor : '000000',
      conferenceStanding,
      conferenceRecord: standing
        ? `${standing.confRecord.wins}-${standing.confRecord.losses}`
        : teamsRaw.find((t) => String(t._id) === team._id)?.record?.conference || '0-0',
      rank: standing ? standing.rank : null,
    };
  }

  const lastUpdated = new Date().toISOString();

  const hasLiveGames = games.some((game) => game.state === 'in');
  const cacheMaxAge = hasLiveGames ? 10 : 60;

  const needsSeeding = games.length === 0 && Object.values(teamMap).length === 0;

  const responseSeason =
    seasonFromESPN || query.season || (games.length > 0 ? games[0].season : undefined);

  return NextResponse.json<GamesResponse>(
    {
      events: games,
      teams: Object.values(teamMap),
      lastUpdated,
      needsSeeding,
      season: responseSeason,
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

    if (week && !season) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Season is required when week is provided',
          code: 'MISSING_SEASON',
        },
        { status: 400 }
      );
    }

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
        error: error instanceof Error ? error.message : 'Internal server error',
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

    if (!season) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: 'Season is required',
          code: 'MISSING_SEASON',
        },
        { status: 400 }
      );
    }

    query.season = parseInt(season, 10);

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

    const [espnSport, espnLeague] = espnRoute.split('/');
    query.sport = espnSport;
    query.league = espnLeague;

    const bypassSeasonCheck = force || process.env.NODE_ENV === 'test';
    const shouldFetchFromESPN = bypassSeasonCheck || (await isInSeasonFromESPN(sport, conf));

    const fetchFromESPN = async () => {
      try {
        const client = createESPNClient(espnRoute);

        let seasonYear: number;
        if (force && season) {
          // When force is true, use the season from the request body
          seasonYear = parseInt(season, 10);
        } else {
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
        }

        // Convert season to date range: Aug 1 of season year to Feb 1 of next year
        const startDate = new Date(seasonYear, 7, 1); // August 1 (month 7 = August, 0-indexed)
        const endDate = new Date(seasonYear + 1, 1, 1); // February 1 of next year (month 1 = February)
        const startStr = `${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}`;
        const endStr = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;
        const dateRange = `${startStr}-${endStr}`;

        let scoreboardResponse;
        if (week) {
          // For specific week, still use season parameter
          scoreboardResponse = await client.getScoreboard({
            groups: conferenceMeta.espnId,
            season: seasonYear,
            week: parseInt(week, 10),
          });
        } else {
          // Always use dates parameter for full season queries
          scoreboardResponse = await client.getScoreboard({
            groups: conferenceMeta.espnId,
            dates: dateRange,
          });
        }

        const extractedTeams = extractTeamsFromScoreboard(scoreboardResponse, conferenceMeta);
        const allConferenceTeams = await Team.find({
          conferenceId: conferenceMeta.espnId,
        })
          .lean()
          .exec();

        const existingTeamsMap = new Map<string, { conferenceStanding?: string }>();
        for (const dbTeam of allConferenceTeams) {
          const teamId = String(dbTeam._id);
          const existingStanding =
            dbTeam && !Array.isArray(dbTeam) && dbTeam.conferenceStanding
              ? dbTeam.conferenceStanding
              : undefined;
          if (existingStanding) {
            existingTeamsMap.set(teamId, { conferenceStanding: existingStanding });
          }
        }

        for (const extractedTeam of extractedTeams) {
          const teamId = extractedTeam._id;
          const existingTeam = existingTeamsMap.get(teamId);

          try {
            const updateData: Record<string, unknown> = {
              $set: {
                name: extractedTeam.name,
                displayName: extractedTeam.displayName,
                shortDisplayName: extractedTeam.shortDisplayName,
                abbreviation: extractedTeam.abbreviation,
                logo: extractedTeam.logo,
                color: extractedTeam.color,
                alternateColor: extractedTeam.alternateColor,
                conferenceId: extractedTeam.conferenceId,
                record: extractedTeam.record,
                lastUpdated: new Date(),
                conferenceStanding: existingTeam?.conferenceStanding || 'Tied for 1st',
              },
            };

            await Team.findOneAndUpdate({ _id: teamId }, updateData, {
              upsert: true,
              new: true,
            });
          } catch (error) {
            await ErrorModel.create({
              timestamp: new Date(),
              endpoint: `/api/games/${sport}/${conf}`,
              payload: { teamId },
              error: error instanceof Error ? error.message : 'Unknown error',
              stackTrace: error instanceof Error ? error.stack || '' : '',
            });
          }
        }

        const teamIdsFromScoreboard = new Set<string>();
        if (scoreboardResponse.events) {
          for (const event of scoreboardResponse.events) {
            const competition = event.competitions?.[0];
            if (competition?.competitors) {
              for (const competitor of competition.competitors) {
                if (competitor.team?.id) {
                  teamIdsFromScoreboard.add(competitor.team.id);
                }
              }
            }
          }
        }

        const teams = await Team.find({ _id: { $in: Array.from(teamIdsFromScoreboard) } })
          .lean()
          .exec();
        const teamMap = new Map<string, TeamLean>(
          teams.map((t) => {
            const team = t as unknown as TeamLean;
            return [
              String(t._id),
              {
                ...team,
                record: team.record || {
                  overall: '0-0',
                  conference: '0-0',
                  home: '0-0',
                  away: '0-0',
                  stats: {},
                },
                conferenceStanding: team.conferenceStanding || '',
                nationalRanking: team.nationalRanking ?? null,
                playoffSeed: team.playoffSeed ?? null,
                nextGameId: team.nextGameId ?? null,
              },
            ];
          })
        );

        const reshaped = reshapeScoreboardData(scoreboardResponse, espnRoute, seasonYear, teamMap);
        const conferenceGamesOnly = reshaped.games.filter((game) => game.conferenceGame === true);

        if (conferenceGamesOnly.length > 0) {
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

              const updateData: Record<string, unknown> = {
                ...game,
                season: seasonYear,
                predictedScore,
              };
              if (game.gameType) {
                updateData.gameType = game.gameType;
              }

              await Game.findOneAndUpdate(
                { espnId: game.espnId },
                { $set: updateData },
                { upsert: true, new: true, setDefaultsOnInsert: true }
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
        await ErrorModel.create({
          timestamp: new Date(),
          endpoint: `/api/games/${sport}/${conf}`,
          payload: { sport, conf },
          error: error instanceof Error ? error.message : 'Unknown error',
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
      }
    };

    let seasonYearFromESPN: number | undefined;
    if (shouldFetchFromESPN) {
      const client = createESPNClient(espnRoute);
      try {
        const calendarResponse = await client.getScoreboard({
          groups: conferenceMeta.espnId,
        });
        seasonYearFromESPN =
          calendarResponse.season?.year || calendarResponse.leagues?.[0]?.season?.year || undefined;
      } catch {
        seasonYearFromESPN = undefined;
      }
      await fetchFromESPN();
    }

    return await queryGamesFromDatabase(
      sport,
      conf,
      query,
      from || undefined,
      to || undefined,
      seasonYearFromESPN
    );
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'DB_ERROR',
      },
      { status: 500 }
    );
  }
};
