import { NextRequest } from 'next/server';
import { cfbdGraphQLClient } from '@/lib/cfb/cfbd-graphql-client';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { getTeams } from '@/lib/cfb/cfbd-cached';
import { getVenueMap } from '@/lib/cfb/venues-cached';
import { buildSubscriptionPayload } from '@/lib/cfb/build-subscription-payload';
import type { CFBConferenceAbbreviation } from '@/lib/cfb/constants';
import { getConferenceMetadata, isValidSport, isValidConference } from '@/lib/constants';
import { isInSeasonFromCfbd } from '@/lib/cfb/helpers/season-check-cfbd';
import { getFixtureYear } from '@/lib/cfb/helpers/fixture-year';
import { graphqlSubscriptionsEnabled } from '@/lib/cfb/helpers/graphql-flags';
import { logError } from '@/lib/errorLogger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ sport: string; conf: string }> }
) => {
  const { sport: sportParam, conf: confParam } = await params;

  if (!isValidSport(sportParam)) {
    return new Response(`Invalid sport: ${sportParam}`, { status: 400 });
  }

  if (!isValidConference(confParam)) {
    return new Response(`Invalid conference: ${confParam}`, { status: 400 });
  }

  const conf = confParam as CFBConferenceAbbreviation;
  const { searchParams } = new URL(request.url);
  const season = searchParams.get('season');

  const conferenceMeta = getConferenceMetadata(conf);

  if (!conferenceMeta) {
    return new Response('Invalid conference', { status: 400 });
  }

  const seasonYear = season
    ? parseInt(season, 10)
    : ((await getFixtureYear()) ?? new Date().getFullYear());
  const inSeason = await isInSeasonFromCfbd();

  const isGraphQLEnabled = await graphqlSubscriptionsEnabled();

  if (!inSeason || !isGraphQLEnabled) {
    return new Response('Subscriptions only available during season with GraphQL enabled', {
      status: 400,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let unsubscribe: (() => void) | null = null;

      try {
        const teamsByConference = await getTeams(seasonYear);
        const venueMap = await getVenueMap();
        const teams = extractTeamsFromCfbd(
          teamsByConference[conferenceMeta.cfbdId] ?? [],
          conferenceMeta.cfbdId
        );

        unsubscribe = cfbdGraphQLClient.subscribeToGames({
          filter: { season: seasonYear, conference: conferenceMeta.cfbdId },
          onUpdate: (nodes) => {
            const response = buildSubscriptionPayload(nodes, teams, venueMap, seasonYear);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
          },
          onError: (error) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
            );
          },
        });
      } catch (error) {
        await logError(error, {
          endpoint: '/api/games/[sport]/[conf]/subscribe',
          action: 'subscribe-to-games',
        });
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
        controller.close();
      }

      request.signal.addEventListener('abort', () => {
        if (unsubscribe) {
          unsubscribe();
        }
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
};
