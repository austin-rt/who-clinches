import { NextRequest, NextResponse } from 'next/server';
import { SimulateResponse, TeamMetadata } from '@/app/store/api';
import { type CFBConferenceAbbreviation } from '@/lib/cfb/constants';
import { isValidSport, isValidConference } from '@/lib/constants';
import { runConferenceSimulation } from '@/lib/cfb/runConferenceSimulation';
import { toTeamLean } from '@/lib/cfb/helpers/toTeamLean';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; conf: string }> }
): Promise<NextResponse<SimulateResponse | { error: string }>> => {
  try {
    const body = await request.json();
    const { season, games, teams, overrides = {} } = body;

    if (!season || !Array.isArray(games) || !Array.isArray(teams)) {
      return NextResponse.json({ error: 'season, games, and teams are required' }, { status: 400 });
    }

    if (games.length === 0 || teams.length === 0) {
      return NextResponse.json({ error: 'games and teams must not be empty' }, { status: 400 });
    }

    const { sport: sportParam, conf: confParam } = await params;

    if (!isValidSport(sportParam)) {
      return NextResponse.json({ error: `Unsupported sport: ${sportParam}` }, { status: 400 });
    }

    if (!isValidConference(confParam)) {
      return NextResponse.json({ error: `Unsupported conference: ${confParam}` }, { status: 400 });
    }

    const conf = confParam as CFBConferenceAbbreviation;

    const result = await runConferenceSimulation({
      games,
      teams: (teams as TeamMetadata[]).map(toTeamLean),
      overrides,
      conf,
    });

    return NextResponse.json<SimulateResponse>(result, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/simulate/[sport]/[conf]',
      action: 'simulate-standings',
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
