import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { GamesResponse, TeamMetadata, ApiErrorResponse } from '@/lib/api-types';
import { GameLean, TeamLean } from '@/lib/types';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';
import { calculatePredictedScore } from '@/lib/cfb/helpers/prefill-helpers';

const parseRankFromStanding = (standing: string): number | null => {
  const match = standing.match(/^(\d+)(?:st|nd|rd|th)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  if (standing.toLowerCase().includes('tied for 1st')) {
    return 1;
  }
  return null;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: SportSlug; conf: ConferenceSlug }> }
) => {
  const { sport, conf } = await params;

  try {
    await dbConnect();
    const body = await request.json().catch(() => ({}));

    const force = body.force === true;

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

    const bypassSeasonCheck = force || process.env.NODE_ENV === 'test';
    const shouldFetchFromESPN = bypassSeasonCheck || (await isInSeasonFromESPN(sport, conf));

    let seasonYear: number | undefined;
    if (shouldFetchFromESPN) {
      try {
        const client = createESPNClient(espnRoute);

        const scoreboardResponse = await client.getScoreboard({
          groups: conferenceMeta.espnId,
        });

        seasonYear =
          scoreboardResponse.season?.year ||
          scoreboardResponse.leagues?.[0]?.season?.year ||
          new Date().getFullYear();

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
                lastUpdated: new Date(),
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
                endpoint: `/api/games/${sport}/${conf}/live`,
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
          endpoint: `/api/games/${sport}/${conf}/live`,
          payload: { sport, conf },
          error: error instanceof Error ? error.message : 'Unknown error',
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
      }
    }

    const [espnSport, espnLeague] = espnRoute.split('/');
    const query: Record<string, unknown> = {
      conferenceGame: true,
      sport: espnSport,
      league: espnLeague,
    };
    if (seasonYear) {
      query.season = seasonYear;
    }

    const conferenceTeams = await Team.find({
      conferenceId: conferenceMeta.espnId,
    })
      .lean()
      .select(
        '_id name abbreviation displayName shortDisplayName logo color alternateColor conferenceStanding record'
      )
      .exec();

    const conferenceTeamIds = new Set(conferenceTeams.map((team) => team._id));

    const allConferenceGames = await Game.find(query).lean().sort({ date: 1, week: 1 }).exec();

    const gamesRaw = allConferenceGames.filter(
      (game) =>
        conferenceTeamIds.has(game.home.teamEspnId) && conferenceTeamIds.has(game.away.teamEspnId)
    );

    const games = gamesRaw.map(
      (game): GameLean => ({
        _id: String(game._id),
        espnId: game.espnId,
        displayName: game.displayName,
        date: game.date,
        week: game.week ?? null,
        season: game.season,
        sport: game.sport,
        league: game.league,
        state: game.state,
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

    const teamMetadata: TeamMetadata[] = conferenceTeams.map((team) => ({
      id: String(team._id),
      abbrev: team.abbreviation,
      name: team.name,
      displayName: team.displayName,
      shortDisplayName: team.shortDisplayName,
      logo: team.logo,
      color: team.color,
      alternateColor: team.alternateColor,
      conferenceStanding: team.conferenceStanding ?? 'Tied for 1st',
      conferenceRecord: team.record?.conference ?? '0-0',
      rank: parseRankFromStanding(team.conferenceStanding ?? 'Tied for 1st'),
    }));

    return NextResponse.json<GamesResponse>(
      {
        events: games,
        teams: teamMetadata,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    await ErrorModel.create({
      timestamp: new Date(),
      endpoint: `/api/games/${sport}/${conf}/live`,
      payload: {},
      error: error instanceof Error ? error.message : 'Internal server error',
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
};
