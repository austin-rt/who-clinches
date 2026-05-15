import { NextRequest, NextResponse } from 'next/server';
import { TeamMetadata } from '@/app/store/api';
import { type CFBConferenceAbbreviation } from '@/lib/cfb/constants';
import { isValidSport, isValidConference } from '@/lib/constants';
import { enumerateScenarios, type EnumerateScenariosResult } from '@/lib/cfb/enumerateScenarios';
import { toTeamLean } from '@/lib/cfb/helpers/toTeamLean';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; conf: string }> }
): Promise<NextResponse<EnumerateScenariosResult | { error: string }>> => {
  try {
    const body = await request.json();
    const { games, teams, overrides = {}, teamId, maxScenarios, maxMs } = body;

    if (!Array.isArray(games) || !Array.isArray(teams) || !teamId) {
      return NextResponse.json({ error: 'games, teams, and teamId are required' }, { status: 400 });
    }

    const { sport: sportParam, conf: confParam } = await params;

    if (!isValidSport(sportParam)) {
      return NextResponse.json({ error: `Unsupported sport: ${sportParam}` }, { status: 400 });
    }

    if (!isValidConference(confParam)) {
      return NextResponse.json({ error: `Unsupported conference: ${confParam}` }, { status: 400 });
    }

    const conf = confParam as CFBConferenceAbbreviation;

    const result = await enumerateScenarios({
      games,
      teams: (teams as TeamMetadata[]).map(toTeamLean),
      overrides,
      conf,
      teamId,
      maxScenarios,
      maxMs,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/scenarios/[sport]/[conf]',
      action: 'enumerate-scenarios',
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
