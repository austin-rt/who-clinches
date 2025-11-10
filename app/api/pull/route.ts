import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import ErrorModel from "@/lib/models/Error";
import { espnClient, createESPNClient } from "@/lib/espn-client";
import { reshapeScoreboardData } from "@/lib/reshape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PullRequest {
  season: number;
  conferenceId: number;
  week?: number; // Optional: specific week, otherwise pulls current week
  sport?: string; // Optional: defaults to 'football'
  league?: string; // Optional: defaults to 'college-football'
}

interface PullResponse {
  upserted: number;
  lastUpdated: string;
  errors?: string[];
  logs?: string[];
}

export const POST = async (request: NextRequest) => {
  try {
    await dbConnect();

    const body: PullRequest = await request.json();

    // Validate request
    if (!body.season || !body.conferenceId) {
      return NextResponse.json(
        {
          error: "Missing required fields: season, conferenceId",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const sport = body.sport || "football";
    const league = body.league || "college-football";

    console.log(
      `[API] Starting ESPN pull for ${sport}/${league} season ${body.season}, conference ${body.conferenceId}`
    );

    // Create appropriate ESPN client for sport/league
    const client =
      body.sport || body.league ? createESPNClient(sport, league) : espnClient;

    // Fetch data from ESPN
    const espnResponse = await client.getScoreboard({
      groups: body.conferenceId,
      season: body.season,
      week: body.week,
    });

    if (!espnResponse.events || espnResponse.events.length === 0) {
      console.log("[API] No events returned from ESPN");
      return NextResponse.json({
        upserted: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Reshape ESPN data (return logs for inspection)
    const reshapeResult = reshapeScoreboardData(espnResponse, sport, league);
    const { games: reshapedGames, logs } = reshapeResult;

    if (!reshapedGames) {
      console.log("[API] No games returned from reshape");
      return NextResponse.json({
        upserted: 0,
        lastUpdated: new Date().toISOString(),
        logs: logs,
      });
    }

    console.log(`[API] Reshaped ${reshapedGames.length} games`);

    // Write games to database using upsert
    let upsertedCount = 0;
    const errors: string[] = [];

    for (const gameData of reshapedGames) {
      try {
        const result = await Game.updateOne(
          { espnId: gameData.espnId }, // Find by ESPN ID
          {
            $set: {
              ...gameData,
              lastUpdated: new Date(),
            },
          },
          { upsert: true } // Create if doesn't exist, update if it does
        );

        if (result.upsertedCount > 0 || result.modifiedCount > 0) {
          upsertedCount++;
        }

        console.log(
          `[DB] ${result.upsertedCount > 0 ? "Created" : "Updated"} game: ${
            gameData.away.abbrev
          } @ ${gameData.home.abbrev}`
        );
      } catch (error) {
        const errorMsg = `Failed to upsert game ${gameData.espnId}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        console.error(`[DB] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const response: PullResponse = {
      upserted: upsertedCount,
      lastUpdated: new Date().toISOString(),
      logs: logs, // Include reshape logs in response
      ...(errors.length > 0 && { errors }),
    };

    console.log(
      `[API] Database write completed: ${upsertedCount}/${
        reshapedGames?.length || 0
      } games upserted`
    );

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API] Pull endpoint error:", error);

    // Log error to database
    try {
      await ErrorModel.create({
        timestamp: new Date(),
        endpoint: "/api/pull",
        payload: await request.json().catch(() => ({})),
        error: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack || "" : "",
      });
    } catch (logError) {
      console.error("[API] Failed to log error to database:", logError);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
};
