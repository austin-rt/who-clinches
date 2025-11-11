import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import { applyOverrides, calculateStandings } from "@/lib/tiebreaker-helpers";
import { SimulateRequest, SimulateResponse } from "@/lib/api-types";
import { GameLean } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (
  request: NextRequest
): Promise<NextResponse<SimulateResponse | { error: string }>> => {
  try {
    // 1. Parse request body
    const body: SimulateRequest = await request.json();
    const { season, conferenceId, overrides } = body;

    // 2. Validate
    if (!season || !conferenceId) {
      return NextResponse.json(
        { error: "Missing required fields: season, conferenceId" },
        { status: 400 }
      );
    }

    // 3. Connect to DB
    await dbConnect();

    // 4. Fetch all conference games
    const games = await Game.find({
      season,
      conferenceGame: true,
      league: "college-football",
    }).lean<GameLean[]>();

    if (games.length === 0) {
      return NextResponse.json(
        { error: "No conference games found for this season" },
        { status: 404 }
      );
    }

    // 5. Apply user overrides
    const finalGames = applyOverrides(games, overrides);

    // 6. Get all SEC teams from games (all teams that played conference games)
    const teamSet = new Set<string>();
    for (const game of finalGames) {
      teamSet.add(game.home.teamEspnId);
      teamSet.add(game.away.teamEspnId);
    }
    const allTeams = Array.from(teamSet);

    // 7. Calculate standings
    const { standings, tieLogs } = calculateStandings(finalGames, allTeams);

    // 8. Return response
    return NextResponse.json<SimulateResponse>(
      {
        standings,
        championship: [standings[0].teamId, standings[1].teamId],
        tieLogs,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
};
