import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import {
  applyOverrides,
  calculateStandings,
} from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
import { SimulateResponse } from '@/lib/api-types';
import { GameLean, GameState } from '@/lib/types';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { getDefaultPredictedScore } from '@/lib/cfb/helpers/prefill-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest
): Promise<NextResponse<SimulateResponse | { error: string }>> => {
  try {
    const body = await request.json();
    const { season, overrides = {} } = body;

    if (!season) {
      return NextResponse.json(
        {
          error: 'Season is required',
        },
        { status: 400 }
      );
    }

    const sport: SportSlug = 'cfb';
    const conf: ConferenceSlug = 'sec';

    const { conferences } = sports[sport];
    const conferenceMeta = conferences[conf];

    if (!conferenceMeta) {
      return NextResponse.json({ error: `Unsupported conference: ${conf}` }, { status: 400 });
    }

    await dbConnect();

    const conferenceTeams = await Team.find({
      conferenceId: conferenceMeta.espnId,
    })
      .lean()
      .exec();

    if (conferenceTeams.length === 0) {
      return NextResponse.json(
        { error: `No teams found for ${conferenceMeta.name} conference` },
        { status: 404 }
      );
    }

    const conferenceTeamIds = new Set(conferenceTeams.map((team) => team._id));

    const allConferenceGamesRaw = await Game.find({
      season,
      conferenceGame: true,
      league: 'college-football',
    })
      .lean()
      .exec();

    const gamesRaw = allConferenceGamesRaw.filter(
      (game) =>
        conferenceTeamIds.has(game.home.teamEspnId) && conferenceTeamIds.has(game.away.teamEspnId)
    );

    if (gamesRaw.length === 0) {
      return NextResponse.json(
        { error: `No ${conferenceMeta.name} conference games found for season ${season}` },
        { status: 404 }
      );
    }

    const games: GameLean[] = gamesRaw.map((game): GameLean => {
      return {
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
          displayName: game.home?.displayName || game.home?.abbrev || '',
          shortDisplayName: game.home?.shortDisplayName || game.home?.abbrev || '',
          logo: game.home?.logo || '',
          color: game.home?.color || '000000',
          alternateColor: game.home?.alternateColor || '000000',
          score: typeof game.home?.score === 'number' ? game.home.score : null,
          rank: typeof game.home?.rank === 'number' ? game.home.rank : null,
        },
        away: {
          teamEspnId: String(game.away?.teamEspnId || ''),
          abbrev: String(game.away?.abbrev || ''),
          displayName: game.away?.displayName || game.away?.abbrev || '',
          shortDisplayName: game.away?.shortDisplayName || game.away?.abbrev || '',
          logo: game.away?.logo || '',
          color: game.away?.color || '000000',
          alternateColor: game.away?.alternateColor || '000000',
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
              home: Number(game.predictedScore.home || 0),
              away: Number(game.predictedScore.away || 0),
            }
          : getDefaultPredictedScore(),
        gameType: game.gameType
          ? {
              name: String(game.gameType.name),
              abbreviation: String(game.gameType.abbreviation),
            }
          : { name: 'Regular Season', abbreviation: 'reg' },
      };
    });

    const finalGames = applyOverrides(games, overrides);

    const teamSet = new Set<string>();
    for (const game of finalGames) {
      if (conferenceTeamIds.has(game.home.teamEspnId)) {
        teamSet.add(game.home.teamEspnId);
      }
      if (conferenceTeamIds.has(game.away.teamEspnId)) {
        teamSet.add(game.away.teamEspnId);
      }
    }
    const allTeams = Array.from(teamSet);

    const conferenceGamesOnly = finalGames.filter(
      (game) =>
        conferenceTeamIds.has(game.home.teamEspnId) && conferenceTeamIds.has(game.away.teamEspnId)
    );

    const { standings, tieLogs } = calculateStandings(conferenceGamesOnly, allTeams);

    return NextResponse.json<SimulateResponse>(
      {
        standings,
        championship: [standings[0].teamId, standings[1].teamId],
        tieLogs,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
};
