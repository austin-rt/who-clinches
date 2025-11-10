import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import ErrorModel from "@/lib/models/Error";
import { createESPNClient } from "@/lib/espn-client";
import { reshapeScoreboardData } from "@/lib/reshape-games";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PullRequest {
  sport: string;
  league: string;
  season: number;
  conferenceId: number;
  week?: number; // Optional: specific week, otherwise pulls current week
}

interface PullResponse {
  upserted: number;
  lastUpdated: string;
  errors?: string[];
}

export const POST = async (request: NextRequest) => {
  try {
    await dbConnect();

    const body: PullRequest = await request.json();

    // Validate request
    if (!body.sport || !body.league || !body.season || !body.conferenceId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sport, league, season, and conferenceId are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { sport, league, season, conferenceId, week } = body;

    // Create ESPN client for sport/league
    const client = createESPNClient(sport, league);

    // Fetch data from ESPN
    const espnResponse = await client.getScoreboard({
      groups: conferenceId,
      season: season,
      week: week,
    });

    if (!espnResponse.events || espnResponse.events.length === 0) {
      return NextResponse.json({
        upserted: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Reshape ESPN data
    const reshapeResult = reshapeScoreboardData(espnResponse, sport, league);
    const { games: reshapedGames } = reshapeResult;

    if (!reshapedGames || reshapedGames.length === 0) {
      return NextResponse.json({
        upserted: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

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
      } catch (error) {
        const errorMsg = `Failed to upsert game ${gameData.espnId}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        errors.push(errorMsg);
      }
    }

    const response: PullResponse = {
      upserted: upsertedCount,
      lastUpdated: new Date().toISOString(),
      ...(errors.length > 0 && { errors }),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Log error to database
    try {
      await ErrorModel.create({
        timestamp: new Date(),
        endpoint: "/api/pull",
        payload: await request.json().catch(() => ({})),
        error: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack || "" : "",
      });
    } catch {
      // Failed to log error to database
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
