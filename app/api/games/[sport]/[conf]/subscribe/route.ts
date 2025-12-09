import { NextRequest } from 'next/server';
import { cfbdGraphQLClient } from '@/lib/cfb/cfbd-graphql-client';
import { reshapeCfbdGames } from '@/lib/reshape-games';
import { extractTeamsFromCfbd } from '@/lib/reshape-teams-from-cfbd';
import { GamesResponse, TeamMetadata } from '@/app/store/api';
import { GameLean, TeamLean } from '@/lib/types';
import {
  getConferenceMetadata,
  isValidSport,
  isValidConference,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';
import { isInSeasonFromCfbd } from '@/lib/cfb/helpers/season-check-cfbd';
import type { Game, Team } from 'cfbd';

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

  const seasonYear = season ? parseInt(season, 10) : new Date().getFullYear();
  const inSeason = await isInSeasonFromCfbd();
  const allowGraphQL = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

  if (!inSeason || !allowGraphQL) {
    return new Response('Subscriptions only available during season in production', {
      status: 400,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let unsubscribe: (() => void) | null = null;

      try {
        const teamsResult = await cfbdGraphQLClient.getCurrentTeams({
          conference: conferenceMeta.cfbdId,
        });

        const cfbdTeams: Team[] = teamsResult.currentTeams.nodes.map(
          (node): Team => ({
            id: node.id,
            school: node.school,
            mascot: null,
            abbreviation: node.abbreviation ?? null,
            alternateNames: null,
            conference: node.conference ?? null,
            division: null,
            classification: null,
            color: node.color ?? null,
            alternateColor: node.altColor ?? null,
            logos: node.logos ?? null,
            twitter: null,
            location: null,
          })
        );

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

        unsubscribe = cfbdGraphQLClient.subscribeToGames({
          season: seasonYear,
          conference: conferenceMeta.cfbdId,
          onUpdate: (subscriptionData) => {
            const cfbdGames: Array<
              Game & { spread?: number; overUnder?: number; favoriteId?: number }
            > = subscriptionData.game.map(
              (game): Game & { spread?: number; overUnder?: number; favoriteId?: number } => ({
                id: game.id,
                season: game.year,
                week: game.week,
                seasonType: game.seasonType as Game['seasonType'],
                startDate: game.startDate,
                startTimeTBD: false,
                completed: game.completed,
                neutralSite: game.neutralSite,
                conferenceGame: game.conferenceGame,
                attendance: null,
                venueId: null,
                venue: game.venue ?? null,
                homeId: game.homeId,
                homeTeam: game.homeTeam,
                homeConference: null,
                homeClassification: null,
                homePoints: game.homePoints ?? null,
                homeLineScores: null,
                homePostgameWinProbability: null,
                homePregameElo: null,
                homePostgameElo: null,
                awayId: game.awayId,
                awayTeam: game.awayTeam,
                awayConference: null,
                awayClassification: null,
                awayPoints: game.awayPoints ?? null,
                awayLineScores: null,
                awayPostgameWinProbability: null,
                awayPregameElo: null,
                awayPostgameElo: null,
                excitementIndex: null,
                highlights: null,
                notes: null,
                spread: game.spread,
                overUnder: game.overUnder,
                favoriteId: game.favoriteId,
              })
            );

            const conferenceGamesOnly = cfbdGames.filter((game) => game.conferenceGame);
            const reshaped = reshapeCfbdGames(conferenceGamesOnly, teamMap);
            const games: GameLean[] = reshaped.games.map((game) => ({
              _id: game.id,
              ...game,
            }));

            const teamMetadata: TeamMetadata[] = teams.map((team) => ({
              id: team._id,
              abbrev: team.abbreviation,
              name: team.name,
              displayName: team.displayName,
              shortDisplayName: team.shortDisplayName,
              logo: team.logo,
              color: team.color,
              alternateColor: team.alternateColor,
              conferenceStanding: team.conferenceStanding ?? 'Tied for 1st',
              conferenceRecord: team.record?.conference ?? '0-0',
              rank: null,
            }));

            const response: GamesResponse = {
              events: games,
              teams: teamMetadata,
              season: seasonYear,
            };

            const responseData = `data: ${JSON.stringify(response)}\n\n`;
            controller.enqueue(encoder.encode(responseData));
          },
          onError: (error) => {
            const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
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
