import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { GamesResponse, TeamMetadata, ApiErrorResponse } from '@/lib/api-types';
import { GameLean } from '@/lib/types';
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

    const season = body.season?.toString();
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

    if (shouldFetchFromESPN) {
      try {
        const client = createESPNClient(espnRoute);

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

        const scoreboardResponse = await client.getScoreboard({
          groups: conferenceMeta.espnId,
          season: seasonYear,
        });

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
                  lastUpdated: new Date(),
                },
                { upsert: true, new: true }
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

    const query: Record<string, unknown> = { conferenceGame: true };
    if (season) query.season = parseInt(season, 10);

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

    const games = gamesRaw.map((game): GameLean => {
      const gameLean: GameLean = {
        _id: String(game._id),
        espnId: String(game.espnId),
        displayName: String(game.displayName),
        date: String(game.date),
        week: typeof game.week === 'number' ? game.week : null,
        season: Number(game.season),
        sport: String(game.sport),
        league: String(game.league),
        state: game.state,
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
          teamEspnId: String(game.home.teamEspnId),
          abbrev: String(game.home.abbrev),
          score: game.home.score ?? null,
          rank: game.home.rank ?? null,
        },
        away: {
          teamEspnId: String(game.away.teamEspnId),
          abbrev: String(game.away.abbrev),
          score: game.away.score ?? null,
          rank: game.away.rank ?? null,
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
              home: Number(game.predictedScore.home),
              away: Number(game.predictedScore.away),
            }
          : undefined,
      };

      return gameLean;
    });

    const teamMetadata: TeamMetadata[] = conferenceTeams.map((team) => {
      const conferenceStanding = team.conferenceStanding
        ? String(team.conferenceStanding)
        : 'Tied for 1st';
      return {
        id: String(team._id),
        abbrev: String(team.abbreviation),
        name: String(team.name),
        displayName: String(team.displayName),
        shortDisplayName: String(team.shortDisplayName || team.displayName || team.abbreviation),
        logo: String(team.logo),
        color: String(team.color),
        alternateColor: String(team.alternateColor),
        conferenceStanding,
        conferenceRecord: team.record?.conference || '0-0',
        rank: parseRankFromStanding(conferenceStanding),
      };
    });

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
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stackTrace: error instanceof Error ? error.stack || '' : '',
    });

    return NextResponse.json<ApiErrorResponse>(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
};
