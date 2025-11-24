import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Game from '@/lib/models/Game';
import Team from '@/lib/models/Team';
import {
  applyOverrides,
  calculateStandings,
} from '@/lib/cfb/tiebreaker-rules/sec/tiebreaker-helpers';
import { SimulateRequest, SimulateResponse } from '@/lib/api-types';
import { GameLean } from '@/lib/types';
import { CONFERENCE_METADATA, type ConferenceSlug } from '@/lib/cfb/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest
): Promise<NextResponse<SimulateResponse | { error: string }>> => {
  try {
    const body: SimulateRequest = await request.json();
    const { season, overrides = {} } = body;

    if (!season) {
      return NextResponse.json({ error: 'Missing required field: season' }, { status: 400 });
    }

    const conf = 'sec' as ConferenceSlug;

    if (!CONFERENCE_METADATA[conf]) {
      return NextResponse.json({ error: 'Unsupported conference: sec' }, { status: 400 });
    }

    await dbConnect();

    const conferenceTeams = await Team.find({
      conferenceId: CONFERENCE_METADATA[conf].espnId.toString(),
    })
      .lean()
      .exec();

    if (conferenceTeams.length === 0) {
      return NextResponse.json({ error: 'No teams found for SEC conference' }, { status: 404 });
    }

    const conferenceTeamIds = new Set(conferenceTeams.map((team) => team._id));

    const allConferenceGames = await Game.find({
      season,
      conferenceGame: true,
      league: 'college-football',
    }).lean<GameLean[]>();

    const games = allConferenceGames.filter(
      (game) =>
        conferenceTeamIds.has(game.home.teamEspnId) && conferenceTeamIds.has(game.away.teamEspnId)
    );

    if (games.length === 0) {
      return NextResponse.json(
        { error: `No SEC conference games found for season ${season}` },
        { status: 404 }
      );
    }

    const finalGames = applyOverrides(games, overrides);

    const teamSet = new Set<string>();
    for (const game of finalGames) {
      teamSet.add(game.home.teamEspnId);
      teamSet.add(game.away.teamEspnId);
    }
    const allTeams = Array.from(teamSet);

    const { standings, tieLogs } = calculateStandings(finalGames, allTeams);

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
