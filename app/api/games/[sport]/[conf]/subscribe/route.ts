import { NextRequest } from 'next/server';
import { cfbdGraphQLClient } from '@/lib/cfb/cfbd-graphql-client';
import { mapGqlGameToCfbdGame } from '@/lib/cfb/graphql/map-to-cfbd';
import { reshapeCfbdGames } from '@/lib/reshape-games';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { getTeams } from '@/lib/cfb/cfbd-cached';
import { GamesResponse, TeamMetadata } from '@/app/store/api';
import { GameLean, TeamLean } from '@/lib/types';
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
        const teams = extractTeamsFromCfbd(teamsByConference[conf] ?? [], conferenceMeta.cfbdId);
        const teamMap = new Map<string, TeamLean>(
          teams.map((team) => [team._id, { ...team, conferenceId: team.conference } as TeamLean])
        );
        const teamMetadata: TeamMetadata[] = teams.map((team) => ({
          id: team._id,
          abbrev: team.abbreviation,
          name: team.name,
          displayName: team.displayName,
          shortDisplayName: team.shortDisplayName,
          mascot: team.mascot,
          alternateNames: team.alternateNames,
          logo: team.logo,
          color: team.color,
          alternateColor: team.alternateColor,
          conferenceId: team.conference,
          conferenceStanding: team.conferenceStanding,
          conferenceRecord: team.record.conference,
          record: team.record,
          rank: null,
          division: team.division,
        })) as unknown as TeamMetadata[];

        unsubscribe = cfbdGraphQLClient.subscribeToGames({
          filter: { season: seasonYear, conference: conferenceMeta.cfbdId },
          onUpdate: (nodes) => {
            const cfbdGames = nodes.map(mapGqlGameToCfbdGame);
            const { games } = reshapeCfbdGames(cfbdGames, teamMap);

            const response: GamesResponse = {
              events: games as GameLean[],
              teams: teamMetadata,
              season: seasonYear,
            };

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
