import { NextRequest, NextResponse } from 'next/server';
import { cfbdClient } from '@/lib/cfb/cfbd-client';
import { reshapeCfbdGames } from '@/lib/reshape-games';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { applyOverrides } from '@/lib/cfb/tiebreaker-rules/common/core-helpers';
import { calculateStandings } from '@/lib/cfb/tiebreaker-rules/core/calculateStandings';
import { CONFERENCE_CONFIGS } from '@/lib/cfb/tiebreaker-rules/configs';
import { SimulateResponse } from '@/app/store/api';
import { GameLean, TeamLean } from '@/lib/types';
import {
  getConferenceMetadata,
  isValidSport,
  isValidConference,
  type SportSlug,
  type ConferenceAbbreviation,
} from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; conf: string }> }
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

    const { sport: sportParam, conf: confParam } = await params;

    if (!isValidSport(sportParam)) {
      return NextResponse.json(
        {
          error: `Unsupported sport: ${sportParam}`,
        },
        { status: 400 }
      );
    }

    if (!isValidConference(confParam)) {
      return NextResponse.json(
        {
          error: `Unsupported conference: ${confParam}`,
        },
        { status: 400 }
      );
    }

    const sport = sportParam as SportSlug;
    const conf = confParam as ConferenceAbbreviation;
    const conferenceMeta = getConferenceMetadata(conf);

    if (!conferenceMeta) {
      return NextResponse.json(
        { error: `Unsupported conference: ${conf} for sport: ${sport}` },
        { status: 400 }
      );
    }

    const config = CONFERENCE_CONFIGS[conferenceMeta.cfbdId];
    if (!config) {
      return NextResponse.json(
        { error: `Conference config not found for ${conf}` },
        { status: 400 }
      );
    }

    const cfbdGames = await cfbdClient.getGames({
      year: season,
      conference: conferenceMeta.cfbdId,
    });

    const conferenceGamesOnly = cfbdGames.filter((game) => game.conferenceGame);

    if (conferenceGamesOnly.length === 0) {
      return NextResponse.json(
        { error: `No ${conferenceMeta.name} conference games found for season ${season}` },
        { status: 404 }
      );
    }

    const cfbdTeams = await cfbdClient.getTeams({
      conference: conferenceMeta.cfbdId,
    });

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
    const games: GameLean[] = reshaped.games.map((game) => ({
      _id: game.id,
      ...game,
    }));

    const finalGames = applyOverrides(games, overrides);

    const conferenceTeamIds = new Set(teams.map((team) => team._id));
    const teamSet = new Set<string>();
    for (const game of finalGames) {
      if (conferenceTeamIds.has(game.home.teamId)) {
        teamSet.add(game.home.teamId);
      }
      if (conferenceTeamIds.has(game.away.teamId)) {
        teamSet.add(game.away.teamId);
      }
    }
    const allTeams = Array.from(teamSet);

    const filteredConferenceGames = finalGames.filter(
      (game) => conferenceTeamIds.has(game.home.teamId) && conferenceTeamIds.has(game.away.teamId)
    );

    const { standings, tieLogs } = calculateStandings(filteredConferenceGames, allTeams, config);

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
