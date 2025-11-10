import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/lib/models/Team";
import ErrorModel from "@/lib/models/Error";
import { createESPNClient } from "@/lib/espn-client";
import { reshapeTeamsData } from "@/lib/reshape-teams";
import { TeamDataResponse } from "@/lib/types";
import { CONFERENCE_TEAMS_MAP } from "@/lib/constants";
import {
  PullTeamsRequest,
  PullTeamsResponse,
  ApiErrorResponse,
} from "@/lib/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (request: NextRequest) => {
  try {
    await dbConnect();

    const body: PullTeamsRequest = await request.json();

    // Validate required fields
    if (!body.sport || !body.league) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: "Missing required fields: sport and league are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (!body.teams && !body.conferenceId) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error:
            "Must provide either 'teams' (array of team abbreviations) or 'conferenceId' (number)",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { sport, league, conferenceId, teams } = body;

    // Create ESPN client for sport/league
    const client = createESPNClient(sport, league);

    // Fetch teams list (either specific teams or use conference constant)
    let teamsToQuery: string[];
    if (teams) {
      teamsToQuery = teams;
    } else if (conferenceId) {
      // Look up conference teams from the map
      const conferenceTeams = CONFERENCE_TEAMS_MAP[conferenceId];
      if (!conferenceTeams) {
        return NextResponse.json<ApiErrorResponse>(
          {
            error: `Conference ID ${conferenceId} not supported. Add conference to CONFERENCE_TEAMS_MAP in lib/constants.ts`,
            code: "INVALID_CONFERENCE",
          },
          { status: 400 }
        );
      }
      teamsToQuery = [...conferenceTeams];
    } else {
      // This shouldn't happen due to validation above, but TypeScript needs it
      return NextResponse.json<ApiErrorResponse>(
        { error: "Invalid request", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
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
      return NextResponse.json<PullTeamsResponse>({
        upserted: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Upsert teams to database
    const upsertErrors: string[] = [];
    let upsertedCount = 0;

    for (const team of reshapedTeams) {
      try {
        await Team.updateOne(
          { _id: team._id },
          { $set: team },
          { upsert: true }
        );
        upsertedCount++;
      } catch (error) {
        const errorMessage = `Failed to upsert team ${team._id}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        upsertErrors.push(errorMessage);
      }
    }

    return NextResponse.json<PullTeamsResponse>(
      {
        upserted: upsertedCount,
        lastUpdated: new Date().toISOString(),
        errors: upsertErrors.length > 0 ? upsertErrors : undefined,
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
        endpoint: "/api/pull-teams",
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
