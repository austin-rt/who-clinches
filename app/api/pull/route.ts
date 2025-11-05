import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import ErrorModel from "@/lib/models/Error";
import { espnClient, createESPNClient } from "@/lib/espn-client";
import { parseESPNEvents, validateParsedGame } from "@/lib/parsers";

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
}

export async function POST(request: NextRequest) {
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

    // Parse ESPN events
    const parsedGames = parseESPNEvents(espnResponse.events, sport, league);
    const validGames = parsedGames.filter(validateParsedGame);

    console.log(
      `[API] Parsed ${validGames.length}/${parsedGames.length} valid games`
    );

    // Upsert games to database
    let upsertCount = 0;
    const errors: string[] = [];

    for (const gameData of validGames) {
      try {
        await Game.findOneAndUpdate({ espnId: gameData.espnId }, gameData, {
          upsert: true,
          new: true,
          lean: true, // Use lean mode as specified in tech spec
        });
        upsertCount++;
      } catch (error) {
        const errorMsg = `Failed to upsert game ${gameData.espnId}: ${error}`;
        console.error("[API]", errorMsg);
        errors.push(errorMsg);
      }
    }

    const response: PullResponse = {
      upserted: upsertCount,
      lastUpdated: new Date().toISOString(),
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    console.log(`[API] Pull completed: ${upsertCount} games upserted`);

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
}
