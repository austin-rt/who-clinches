import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import Team from "@/lib/models/Team";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GameResponse {
  events: any[];
  teams: Array<{
    id: string;
    abbrev: string;
    displayName: string;
    logo: string;
  }>;
  lastUpdated: string;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // Build query from search parameters
    const query: any = {};

    const conferenceId = searchParams.get("conferenceId");
    const season = searchParams.get("season");
    const week = searchParams.get("week");
    const state = searchParams.get("state");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sport = searchParams.get("sport");
    const league = searchParams.get("league");

    // Filter by conference games only (as specified in tech spec)
    if (conferenceId) {
      query.conferenceGame = true;
    }

    if (season) {
      query.season = parseInt(season, 10);
    }

    if (week) {
      query.week = parseInt(week, 10);
    }

    if (state && ["pre", "in", "post"].includes(state)) {
      query.state = state;
    }

    if (sport) {
      query.sport = sport;
    }

    if (league) {
      query.league = league;
    }

    // Date range filtering
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    console.log("[API] Games query:", query);

    // Fetch games with lean mode (no hydration)
    const games = await Game.find(query)
      .lean()
      .sort({ date: 1, week: 1 })
      .exec();

    console.log(`[API] Found ${games.length} games`);

    // Extract unique team IDs from games
    const teamIds = new Set<string>();
    games.forEach((game) => {
      teamIds.add(game.home.teamId);
      teamIds.add(game.away.teamId);
    });

    // Fetch team metadata for all teams in results
    const teams = await Team.find({ _id: { $in: Array.from(teamIds) } })
      .lean()
      .select("_id abbreviation displayName logo")
      .exec();

    const teamMap = teams.reduce((acc, team) => {
      acc[team._id] = {
        id: team._id,
        abbrev: team.abbreviation,
        displayName: team.displayName,
        logo: team.logo,
      };
      return acc;
    }, {} as Record<string, any>);

    // Determine cache headers based on game states
    const hasLiveGames = games.some((game) => game.state === "in");
    const cacheMaxAge = hasLiveGames ? 10 : 60; // 10s for live games, 60s otherwise

    const response: GameResponse = {
      events: games,
      teams: Object.values(teamMap),
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": `public, s-maxage=${cacheMaxAge}`,
      },
    });
  } catch (error) {
    console.error("[API] Games endpoint error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        code: "DB_ERROR",
      },
      { status: 500 }
    );
  }
}
