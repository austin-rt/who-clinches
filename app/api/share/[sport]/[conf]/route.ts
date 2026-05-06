import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db/client';
import type { Prisma } from '@prisma/client';
import {
  isValidSport,
  isValidConference,
  type SportSlug,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';
import { checkSameOrigin } from '@/lib/api/same-origin-gate';
import { hashPayload } from '@/lib/api/payload-hash';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; conf: string }> }
) => {
  const originCheck = checkSameOrigin(request);
  if (originCheck) return originCheck;

  try {
    const body = await request.json();
    const { season, overrides = {}, results } = body;

    if (!season) {
      return NextResponse.json({ error: 'Season is required' }, { status: 400 });
    }

    if (!results?.standings || !results?.championship) {
      return NextResponse.json({ error: 'Simulation results are required' }, { status: 400 });
    }

    const { sport: sportParam, conf: confParam } = await params;

    if (!isValidSport(sportParam)) {
      return NextResponse.json({ error: `Unsupported sport: ${sportParam}` }, { status: 400 });
    }
    if (!isValidConference(confParam)) {
      return NextResponse.json({ error: `Unsupported conference: ${confParam}` }, { status: 400 });
    }

    const sport = sportParam as SportSlug;
    const conf = confParam as CFBConferenceAbbreviation;

    const bodyHash = hashPayload(sport, conf, { season, overrides });

    const origin = request.headers.get('origin') || request.nextUrl.origin;

    const existing = await db.simulationSnapshot.findUnique({ where: { hash: bodyHash } });
    if (existing) {
      return NextResponse.json(
        { id: existing.id, url: `${origin}/results/${existing.id}` },
        { status: 200 }
      );
    }

    const displayOverrides: Record<string, { awayScore: string; homeScore: string }> = {};
    for (const [gameId, pick] of Object.entries(overrides)) {
      const { homeScore, awayScore } = pick as { homeScore: number; awayScore: number };
      const homeWon = homeScore > awayScore;
      const normalized =
        (homeScore === 1 && awayScore === 0) || (homeScore === 0 && awayScore === 1);
      displayOverrides[gameId] = normalized
        ? { awayScore: homeWon ? 'L' : 'W', homeScore: homeWon ? 'W' : 'L' }
        : { awayScore: String(awayScore), homeScore: String(homeScore) };
    }

    const id = nanoid(10);
    await db.simulationSnapshot.create({
      data: {
        id,
        hash: bodyHash,
        sport,
        conf,
        season,
        payload: {
          input: { overrides: displayOverrides },
          output: {
            standings: results.standings,
            championship: results.championship,
            tieLogs: results.tieLogs,
            tieFlowGraphs: results.tieFlowGraphs ?? [],
          },
          teams: results.teams ?? [],
          games: results.games ?? [],
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ id, url: `${origin}/results/${id}` }, { status: 201 });
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, {
      endpoint: '/api/share/[sport]/[conf]',
      action: 'create-snapshot',
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
