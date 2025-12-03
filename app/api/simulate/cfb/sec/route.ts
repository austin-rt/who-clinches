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

    const games: GameLean[] = gamesRaw.map((game): GameLean => ({
      _id: String(game._id),
      espnId: game.espnId,
      displayName: game.displayName,
      date: game.date,
      week: game.week ?? null,
      season: game.season,
      sport: game.sport,
      league: game.league,
      state: game.state as GameState,
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
    }));

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
