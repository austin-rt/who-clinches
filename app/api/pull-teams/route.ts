import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/lib/models/Team";
import ErrorModel from "@/lib/models/Error";
import {
  espnClient,
  createESPNClient,
  ESPNTeamResponse,
} from "@/lib/espn-client";
import { reshapeTeamsData, SEC_TEAMS } from "@/lib/reshape-teams";
import { TeamDataResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PullTeamsRequest {
  sport?: string; // Optional: defaults to 'football'
  league?: string; // Optional: defaults to 'college-football'
  teams?: string[]; // Optional: specific teams, defaults to SEC_TEAMS
}

interface PullTeamsResponse {
  upserted: number;
  lastUpdated: string;
  errors?: string[];
  logs?: string[];
}

export const POST = async (request: NextRequest) => {
  try {
    await dbConnect();

    const body: PullTeamsRequest = await request.json().catch(() => ({}));

    const sport = body.sport || "football";
    const league = body.league || "college-football";
    const teamsToQuery = body.teams || SEC_TEAMS;

    console.log(`[API] Starting ESPN teams pull for ${sport}/${league}`);
    console.log(
      `[API] Querying ${teamsToQuery.length} teams: ${teamsToQuery.join(", ")}`
    );

    // Create appropriate ESPN client for sport/league
    const client =
      body.sport || body.league ? createESPNClient(sport, league) : espnClient;

    // Fetch all teams from ESPN (with rate limiting)
    const teamResponses: TeamDataResponse[] = [];

    for (const teamAbbrev of teamsToQuery) {
      try {
        console.log(`[API] Fetching ${teamAbbrev}...`);
        
        // Fetch team basic info from site API
        const teamData = await client.getTeam(teamAbbrev);
        
        // Fetch detailed records from core API (if we have team ID)
        let recordData = null;
        if (teamData?.team?.id) {
          try {
            const currentSeason = new Date().getFullYear();
            recordData = await client.getTeamRecords(
              teamData.team.id,
              currentSeason,
              2 // Regular season
            );
            console.log(`[API] Fetched records for ${teamAbbrev}`);
          } catch (recordError) {
            console.warn(
              `[API] Failed to fetch records for ${teamAbbrev}:`,
              recordError
            );
            // Continue without record data - will use site API fallback
          }
        }

        teamResponses.push({
          abbreviation: teamAbbrev,
          data: teamData,
          recordData: recordData || undefined,
        });

        // Rate limiting - be nice to ESPN (2 calls per team now)
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[API] Failed to fetch ${teamAbbrev}:`, error);
        teamResponses.push({
          abbreviation: teamAbbrev,
          data: null,
          recordData: undefined,
        });
      }
    }

    console.log(`[API] Fetched ${teamResponses.length} team responses`);

    // Reshape team data
    const reshapeResult = reshapeTeamsData(teamResponses);
    const { teams: reshapedTeams, logs } = reshapeResult;

    if (!reshapedTeams) {
      console.log("[API] No teams returned from reshape");
      return NextResponse.json({
        upserted: 0,
        lastUpdated: new Date().toISOString(),
        logs: logs,
      });
    }

    console.log(`[API] Reshaped ${reshapedTeams.length} teams`);

    // Write teams to database using upsert
    let upsertedCount = 0;
    const errors: string[] = [];

    for (const teamData of reshapedTeams) {
      try {
        const result = await Team.updateOne(
          { _id: teamData._id }, // Find by ESPN team ID (which is our _id)
          {
            $set: {
              ...teamData,
              lastUpdated: new Date(),
            },
          },
          { upsert: true } // Create if doesn't exist, update if it does
        );

        if (result.upsertedCount > 0 || result.modifiedCount > 0) {
          upsertedCount++;
        }

        console.log(
          `[DB] ${result.upsertedCount > 0 ? "Created" : "Updated"} team: ${
            teamData.displayName
          } (${teamData.abbreviation})`
        );
      } catch (error) {
        const errorMsg = `Failed to upsert team ${teamData._id}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        console.error(`[DB] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const response: PullTeamsResponse = {
      upserted: upsertedCount,
      lastUpdated: new Date().toISOString(),
      logs: logs, // Include reshape logs in response
      ...(errors.length > 0 && { errors }),
    };

    console.log(
      `[API] Database write completed: ${upsertedCount}/${
        reshapedTeams?.length || 0
      } teams upserted`
    );

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API] Pull teams endpoint error:", error);

    // Log error to database
    try {
      await ErrorModel.create({
        timestamp: new Date(),
        endpoint: "/api/pull-teams",
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
