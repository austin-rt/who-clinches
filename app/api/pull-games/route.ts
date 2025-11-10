import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import ErrorModel from "@/lib/models/Error";
import { createESPNClient } from "@/lib/espn-client";
import { reshapeScoreboardData } from "@/lib/reshape-games";
import {
  PullGamesRequest,
  PullGamesResponse,
  ApiErrorResponse,
} from "@/lib/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GameWeekQuery {
  week: number;
}

export const POST = async (request: NextRequest) => {
  try {
    await dbConnect();

    const body: PullGamesRequest = await request.json();

    // Validate request
    if (!body.sport || !body.league || !body.season || !body.conferenceId) {
      return NextResponse.json<ApiErrorResponse>(
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

    // Determine which weeks to pull
    let weeksToPull: number[] = [];

    if (week !== undefined) {
      // Specific week requested
      weeksToPull = [week];
    } else {
      // Backfill mode: find all missing weeks for this season
      // Get distinct weeks that already exist in the database
      const existingWeeks = await Game.distinct("week", {
        season,
        sport,
        league,
        conferenceGame: true, // Only check conference games
      });

      // Assume weeks 1-15 for college football season (can make this configurable)
      const maxWeek = 15;
      const allWeeks = Array.from({ length: maxWeek }, (_, i) => i + 1);

      // Find weeks that don't exist yet
      weeksToPull = allWeeks.filter((w) => !existingWeeks.includes(w));

      // If all weeks exist, pull current week (week with most recent games)
      if (weeksToPull.length === 0) {
        const latestGame = await Game.findOne(
          { season, sport, league },
          { week: 1 }
        )
          .sort({ date: -1 })
          .lean<GameWeekQuery>();

        if (latestGame?.week) {
          weeksToPull = [latestGame.week];
        } else {
          // Default to week 1 if no games exist
          weeksToPull = [1];
        }
      }
    }

    // Pull games for each week
    let totalUpserted = 0;
    const errors: string[] = [];
    const weeksPulled: number[] = [];

    for (const weekNumber of weeksToPull) {
      try {
        // Fetch data from ESPN
        const espnResponse = await client.getScoreboard({
          groups: conferenceId,
          season: season,
          week: weekNumber,
        });

        if (!espnResponse.events || espnResponse.events.length === 0) {
          continue; // Skip weeks with no games
        }

        // Reshape ESPN data
        const reshapeResult = reshapeScoreboardData(
          espnResponse,
          sport,
          league
        );
        const { games: reshapedGames } = reshapeResult;

        if (!reshapedGames || reshapedGames.length === 0) {
          continue;
        }

        // Write games to database using upsert
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
              totalUpserted++;
            }
          } catch (error) {
            const errorMsg = `Failed to upsert game ${
              gameData.espnId
            } (week ${weekNumber}): ${
              error instanceof Error ? error.message : String(error)
            }`;
            errors.push(errorMsg);
          }
        }

        weeksPulled.push(weekNumber);

        // Rate limiting between weeks
        if (weeksToPull.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        const errorMsg = `Failed to fetch week ${weekNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        errors.push(errorMsg);
      }
    }

    return NextResponse.json<PullGamesResponse>(
      {
        upserted: totalUpserted,
        weeksPulled: weeksPulled.sort((a, b) => a - b),
        lastUpdated: new Date().toISOString(),
        ...(errors.length > 0 && { errors }),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
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

    return NextResponse.json<ApiErrorResponse>(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
};
