import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Team from "@/lib/models/Team";
import ErrorLog from "@/lib/models/Error";
import { espnClient } from "@/lib/espn-client";
import {
  SEC_TEAMS,
  RECORD_TYPE_OVERALL,
  RECORD_TYPE_HOME,
  RECORD_TYPE_AWAY,
  RECORD_TYPE_CONFERENCE,
  STAT_AVG_POINTS_FOR,
  STAT_AVG_POINTS_AGAINST,
  STAT_WINS,
  STAT_LOSSES,
  STAT_DIFFERENTIAL,
} from "@/lib/constants";
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
        // Fetch team data from Site API (rankings, standings)
        const teamData = await espnClient.getTeam(teamAbbrev);

        // Extract ranking fields
        const nationalRanking =
          teamData.team.rank && teamData.team.rank !== 99
            ? teamData.team.rank
            : null;
        const conferenceStanding = teamData.team.standingSummary;

        // Fetch team record from Core API (includes avgPointsFor/Against)
        const recordData = await espnClient.getTeamRecords(teamData.team.id);

        // Extract records by type from Core API
        const overallRecord = recordData?.items?.find(
          (item) => item.name === RECORD_TYPE_OVERALL
        );
        const homeRecord = recordData?.items?.find(
          (item) => item.type === RECORD_TYPE_HOME
        );
        const awayRecord = recordData?.items?.find(
          (item) => item.type === RECORD_TYPE_AWAY
        );
        const conferenceRecord = recordData?.items?.find(
          (item) => item.type === RECORD_TYPE_CONFERENCE
        );

        // Helper to extract stat value from flat stats array
        const getStatValue = (
          stats: Array<{ name: string; value: number }> | undefined,
          statName: string
        ): number => {
          return stats?.find((s) => s.name === statName)?.value ?? 0;
        };

        // Try Core API stats first
        const coreStats = overallRecord?.stats;

        // Fallback to Site API stats if Core API returns no data
        const siteStats =
          teamData.team.record?.items?.find((item) => item.summary)?.stats ||
          [];
        const useSiteAPI = !coreStats && siteStats.length > 0;

        let recordStats;
        if (useSiteAPI) {
          // Parse Site API format (same flat array structure)
          const getSiteStatValue = (statName: string): number => {
            return siteStats.find((s) => s.name === statName)?.value ?? 0;
          };
          recordStats = {
            wins: getSiteStatValue("wins"),
            losses: getSiteStatValue("losses"),
            winPercent: getSiteStatValue("winPercent"),
            pointsFor: getSiteStatValue("pointsFor"),
            pointsAgainst: getSiteStatValue("pointsAgainst"),
            pointDifferential: getSiteStatValue("pointDifferential"),
            avgPointsFor: getSiteStatValue("avgPointsFor"),
            avgPointsAgainst: getSiteStatValue("avgPointsAgainst"),
          };
        } else {
          // Parse Core API format (flat stats array)
          recordStats = {
            wins: getStatValue(coreStats, STAT_WINS),
            losses: getStatValue(coreStats, STAT_LOSSES),
            winPercent: getStatValue(coreStats, "winPercent"),
            pointsFor: getStatValue(coreStats, "pointsFor"),
            pointsAgainst: getStatValue(coreStats, "pointsAgainst"),
            pointDifferential: getStatValue(coreStats, STAT_DIFFERENTIAL),
            avgPointsFor: getStatValue(coreStats, STAT_AVG_POINTS_FOR),
            avgPointsAgainst: getStatValue(coreStats, STAT_AVG_POINTS_AGAINST),
          };
        }

        // Update team with rankings AND season averages
        await Team.updateOne(
          { _id: teamData.team.id },
          {
            $set: {
              nationalRanking,
              conferenceStanding,
              "record.overall":
                overallRecord?.summary ||
                teamData.team.record?.items?.[0]?.summary ||
                null,
              "record.conference": conferenceRecord?.summary || null,
              "record.home": homeRecord?.summary || null,
              "record.away": awayRecord?.summary || null,
              "record.stats.wins": recordStats.wins,
              "record.stats.losses": recordStats.losses,
              "record.stats.winPercent": recordStats.winPercent,
              "record.stats.pointsFor": recordStats.pointsFor,
              "record.stats.pointsAgainst": recordStats.pointsAgainst,
              "record.stats.pointDifferential": recordStats.pointDifferential,
              "record.stats.avgPointsFor": recordStats.avgPointsFor,
              "record.stats.avgPointsAgainst": recordStats.avgPointsAgainst,
              lastUpdated: new Date(),
            },
          }
        );

        successfulUpdates++;

        // Rate limit between calls (2 API calls per team)
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
          // Retry: Fetch team data from Site API
          const teamData = await espnClient.getTeam(teamAbbrev);

          const nationalRanking =
            teamData.team.rank && teamData.team.rank !== 99
              ? teamData.team.rank
              : null;
          const conferenceStanding = teamData.team.standingSummary;

          // Retry: Fetch team record from Core API
          const recordData = await espnClient.getTeamRecords(teamData.team.id);

          // Extract records by type from Core API
          const overallRecord = recordData?.items?.find(
            (item) => item.name === RECORD_TYPE_OVERALL
          );
          const homeRecord = recordData?.items?.find(
            (item) => item.type === RECORD_TYPE_HOME
          );
          const awayRecord = recordData?.items?.find(
            (item) => item.type === RECORD_TYPE_AWAY
          );
          const conferenceRecord = recordData?.items?.find(
            (item) => item.type === RECORD_TYPE_CONFERENCE
          );

          // Helper to extract stat value from flat stats array
          const getStatValue = (
            stats: Array<{ name: string; value: number }> | undefined,
            statName: string
          ): number => {
            return stats?.find((s) => s.name === statName)?.value ?? 0;
          };

          // Try Core API stats first
          const coreStats = overallRecord?.stats;

          // Fallback to Site API stats if Core API returns no data
          const siteStats =
            teamData.team.record?.items?.find((item) => item.summary)?.stats ||
            [];
          const useSiteAPI = !coreStats && siteStats.length > 0;

          let recordStats;
          if (useSiteAPI) {
            // Parse Site API format (same flat array structure)
            const getSiteStatValue = (statName: string): number => {
              return siteStats.find((s) => s.name === statName)?.value ?? 0;
            };
            recordStats = {
              wins: getSiteStatValue("wins"),
              losses: getSiteStatValue("losses"),
              winPercent: getSiteStatValue("winPercent"),
              pointsFor: getSiteStatValue("pointsFor"),
              pointsAgainst: getSiteStatValue("pointsAgainst"),
              pointDifferential: getSiteStatValue("pointDifferential"),
              avgPointsFor: getSiteStatValue("avgPointsFor"),
              avgPointsAgainst: getSiteStatValue("avgPointsAgainst"),
            };
          } else {
            // Parse Core API format (flat stats array)
            recordStats = {
              wins: getStatValue(coreStats, STAT_WINS),
              losses: getStatValue(coreStats, STAT_LOSSES),
              winPercent: getStatValue(coreStats, "winPercent"),
              pointsFor: getStatValue(coreStats, "pointsFor"),
              pointsAgainst: getStatValue(coreStats, "pointsAgainst"),
              pointDifferential: getStatValue(coreStats, STAT_DIFFERENTIAL),
              avgPointsFor: getStatValue(coreStats, STAT_AVG_POINTS_FOR),
              avgPointsAgainst: getStatValue(
                coreStats,
                STAT_AVG_POINTS_AGAINST
              ),
            };
          }

          await Team.updateOne(
            { _id: teamData.team.id },
            {
              $set: {
                nationalRanking,
                conferenceStanding,
                "record.overall":
                  overallRecord?.summary ||
                  teamData.team.record?.items?.[0]?.summary ||
                  null,
                "record.conference": conferenceRecord?.summary || null,
                "record.home": homeRecord?.summary || null,
                "record.away": awayRecord?.summary || null,
                "record.stats.wins": recordStats.wins,
                "record.stats.losses": recordStats.losses,
                "record.stats.winPercent": recordStats.winPercent,
                "record.stats.pointsFor": recordStats.pointsFor,
                "record.stats.pointsAgainst": recordStats.pointsAgainst,
                "record.stats.pointDifferential": recordStats.pointDifferential,
                "record.stats.avgPointsFor": recordStats.avgPointsFor,
                "record.stats.avgPointsAgainst": recordStats.avgPointsAgainst,
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
