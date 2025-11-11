import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/lib/models/Team";
import ErrorLog from "@/lib/models/Error";
import { espnClient } from "@/lib/espn-client";
import { SEC_TEAMS } from "@/lib/constants";
import { CronRankingsResponse } from "@/lib/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  // 1. Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Connect to database
    await dbConnect();

    // 3. Check if in season
    const now = new Date();
    const year = now.getFullYear();
    const seasonStart = new Date(`${year}-08-15`);
    const seasonEnd = new Date(`${year}-12-15`);

    if (now < seasonStart || now > seasonEnd) {
      return NextResponse.json<CronRankingsResponse>({
        updated: 0,
        teamsChecked: 0,
        espnCalls: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // 4. Update rankings and standings for all 16 SEC teams
    // Site API provides: nationalRanking, conferenceStanding
    // ESPN doesn't have a rankings-only endpoint, so we must call team endpoint

    const failedTeams: string[] = [];
    let successfulUpdates = 0;

    for (const teamAbbrev of SEC_TEAMS) {
      try {
        const teamData = await espnClient.getTeam(teamAbbrev);

        // Extract only ranking fields (no full team reshape)
        const nationalRanking =
          teamData.team.rank && teamData.team.rank !== 99
            ? teamData.team.rank
            : null;
        const conferenceStanding = teamData.team.standingSummary;

        // Update only ranking-related fields
        await Team.updateOne(
          { _id: teamData.team.id },
          {
            $set: {
              nationalRanking,
              conferenceStanding,
              lastUpdated: new Date(),
            },
          }
        );

        successfulUpdates++;

        // Rate limit between calls
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        // Log error and track failed team for retry
        await ErrorLog.create({
          timestamp: new Date(),
          endpoint: "/api/cron/update-rankings",
          payload: { team: teamAbbrev },
          error: error instanceof Error ? error.message : String(error),
          stackTrace: error instanceof Error ? error.stack || "" : "",
        });
        failedTeams.push(teamAbbrev);
      }
    }

    // 5. Retry failed teams once (after 5 second delay)
    if (failedTeams.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const retryFailures: string[] = [];

      for (const teamAbbrev of failedTeams) {
        try {
          const teamData = await espnClient.getTeam(teamAbbrev);

          const nationalRanking =
            teamData.team.rank && teamData.team.rank !== 99
              ? teamData.team.rank
              : null;
          const conferenceStanding = teamData.team.standingSummary;

          await Team.updateOne(
            { _id: teamData.team.id },
            {
              $set: {
                nationalRanking,
                conferenceStanding,
                lastUpdated: new Date(),
              },
            }
          );

          successfulUpdates++;

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          // Log retry failure - will be handled by next week's cron
          await ErrorLog.create({
            timestamp: new Date(),
            endpoint: "/api/cron/update-rankings",
            payload: { team: teamAbbrev, retry: true },
            error: error instanceof Error ? error.message : String(error),
            stackTrace: error instanceof Error ? error.stack || "" : "",
          });
          retryFailures.push(teamAbbrev);
        }
      }

      // Update failed teams list to only include those that failed retry
      failedTeams.length = 0;
      failedTeams.push(...retryFailures);
    }

    return NextResponse.json<CronRankingsResponse>({
      updated: successfulUpdates,
      teamsChecked: SEC_TEAMS.length,
      espnCalls: SEC_TEAMS.length + (SEC_TEAMS.length - successfulUpdates), // Original attempts + retries
      lastUpdated: new Date().toISOString(),
      errors: failedTeams.length > 0 ? failedTeams : undefined,
    });
  } catch (error) {
    // Unexpected error - log and return
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: "/api/cron/update-rankings",
      payload: {},
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack || "" : "",
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

