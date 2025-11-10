import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/lib/models/Team";
import ErrorModel from "@/lib/models/Error";
import { createESPNClient } from "@/lib/espn-client";
import { reshapeTeamsData } from "@/lib/reshape-teams";
import { TeamDataResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PullTeamsRequest {
  sport: string;
  league: string;
  conferenceId?: number; // Optional: if not provided, must provide teams
  teams?: string[]; // Optional: specific teams, overrides conferenceId
}

interface PullTeamsResponse {
  upserted: number;
  lastUpdated: string;
  errors?: string[];
}

export const POST = async (request: NextRequest) => {
  try {
    await dbConnect();

    const body: PullTeamsRequest = await request.json();

    // Validate required fields
    if (!body.sport || !body.league) {
      return NextResponse.json(
        {
          error: "Missing required fields: sport and league are required",
        },
        { status: 400 }
      );
    }

    if (!body.teams && !body.conferenceId) {
      return NextResponse.json(
        {
          error:
            "Must provide either 'teams' (array of team abbreviations) or 'conferenceId' (number)",
        },
        { status: 400 }
      );
    }

    const { sport, league, conferenceId, teams } = body;

    // Create ESPN client for sport/league
    const client = createESPNClient(sport, league);

    // Fetch teams list from ESPN (either specific teams or all conference teams)
    let teamsToQuery: string[];
    if (teams) {
      teamsToQuery = teams;
    } else if (conferenceId) {
      teamsToQuery = await client.getConferenceTeams(conferenceId);
    } else {
      // This shouldn't happen due to validation above, but TypeScript needs it
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Fetch all teams from ESPN (with rate limiting)
    const teamResponses: TeamDataResponse[] = [];

    for (const teamAbbrev of teamsToQuery) {
      try {
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
          } catch {
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
      } catch {
        teamResponses.push({
          abbreviation: teamAbbrev,
          data: null,
          recordData: undefined,
        });
      }
    }

    // Reshape team data
    const reshapedTeams = reshapeTeamsData(teamResponses);

    if (!reshapedTeams || reshapedTeams.length === 0) {
      return NextResponse.json({
        upserted: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

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
      } catch (error) {
        const errorMsg = `Failed to upsert team ${teamData._id}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        errors.push(errorMsg);
      }
    }

    const response: PullTeamsResponse = {
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
        endpoint: "/api/pull-teams",
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
