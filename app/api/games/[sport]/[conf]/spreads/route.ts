import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import ErrorModel from '@/lib/models/Error';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { calculatePredictedScore } from '@/lib/cfb/helpers/prefill-helpers';
import { GamesResponse, TeamMetadata, ApiErrorResponse } from '@/lib/api-types';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { GameLean } from '@/lib/types';
import { isInSeasonFromESPN } from '@/lib/cfb/helpers/season-check-espn';

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
    const week = body.week?.toString();
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
            season: seasonYear,
          });
        }

        const reshaped = reshapeScoreboardData(scoreboardResponse, espnRoute, seasonYear);
        const conferenceGamesOnly = reshaped.games.filter((game) => game.conferenceGame === true);

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

              await Game.updateOne(
                { espnId: game.espnId },
                {
                  $set: {
                    'odds.spread': game.odds.spread ?? null,
                    'odds.favoriteTeamEspnId': game.odds.favoriteTeamEspnId ?? null,
                    'odds.overUnder': game.odds.overUnder ?? null,
                    'predictedScore.home': predictedScore.home,
                    'predictedScore.away': predictedScore.away,
                    lastUpdated: new Date(),
                  },
                }
              );
            } catch (error) {
              await ErrorModel.create({
                timestamp: new Date(),
                endpoint: `/api/games/${sport}/${conf}/spreads`,
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
          endpoint: `/api/games/${sport}/${conf}/spreads`,
          payload: { sport, conf },
          error: error instanceof Error ? error.message : 'Unknown error',
          stackTrace: error instanceof Error ? error.stack || '' : '',
        });
      }
    }

    const query: Record<string, unknown> = { conferenceGame: true };
    if (season) query.season = parseInt(season, 10);
    if (week) query.week = parseInt(week, 10);

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
          'Cache-Control': 'public, s-maxage=60',
        },
      }
    );
  } catch (error) {
    await ErrorModel.create({
      timestamp: new Date(),
      endpoint: `/api/games/${sport}/${conf}/spreads`,
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
