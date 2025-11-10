/**
 * Team data reshaping functions for ESPN team endpoint responses
 * Transform raw ESPN team data into our desired format
 */

import {
  ESPNTeamResponse,
  ESPNTeamLogo,
  ESPNCoreRecordResponse,
} from "./espn-client";
import {
  ReshapedTeam,
  TeamRecord,
  TeamDataResponse,
  ReshapeResult,
} from "./types";

// SEC team abbreviations - we'll query these
const SEC_TEAMS = [
  "ALA",
  "ARK",
  "AUB",
  "FLA",
  "UGA",
  "UK",
  "LSU",
  "MISS",
  "MSST",
  "MIZ",
  "SC",
  "TENN",
  "TA&M",
  "TEX",
  "OU",
  "VAN",
];

export { SEC_TEAMS };

/**
 * Reshape ESPN team response into our team format
 */
export const reshapeTeamData = (
  espnTeamResponse: ESPNTeamResponse,
  coreRecordResponse?: ESPNCoreRecordResponse
): { team: ReshapedTeam | null; logs: string[] } => {
  const logs: string[] = [];

  try {
    const team = espnTeamResponse.team;
    if (!team) {
      logs.push("❌ No team data in response");
      return { team: null, logs };
    }

    logs.push(`🏈 Processing team: ${team.displayName}`);
    logs.push(`   ID: ${team.id}`);
    logs.push(`   Abbreviation: ${team.abbreviation}`);
    logs.push(`   Conference: ${team.groups?.parent?.id || "Unknown"}`);

    // Find the best logo (prefer larger sizes)
    const logo: ESPNTeamLogo | undefined =
      team.logos?.find((l: ESPNTeamLogo) => l.width >= 500) || team.logos?.[0];
    logs.push(`   Logo: ${logo?.href ? "Found" : "Missing"}`);

    // Parse records from core API if available
    let record: TeamRecord = {};
    if (coreRecordResponse?.items) {
      const items = coreRecordResponse.items;

      // Find each record type
      const overallRecord = items.find((item) => item.type === "total");
      const homeRecord = items.find((item) => item.type === "homerecord");
      const awayRecord = items.find((item) => item.type === "awayrecord");
      const confRecord = items.find((item) => item.type === "vsconf");

      logs.push(`   Overall Record: ${overallRecord?.summary || "N/A"}`);
      logs.push(`   Conference Record: ${confRecord?.summary || "N/A"}`);
      logs.push(`   Home Record: ${homeRecord?.summary || "N/A"}`);
      logs.push(`   Away Record: ${awayRecord?.summary || "N/A"}`);

      // Extract stats from overall record
      const stats = overallRecord?.stats || [];
      const getStatValue = (name: string) =>
        stats.find((s) => s.name === name)?.value;

      record = {
        overall: overallRecord?.summary,
        conference: confRecord?.summary || null,
        home: homeRecord?.summary || null,
        away: awayRecord?.summary || null,
        stats: {
          wins: getStatValue("wins"),
          losses: getStatValue("losses"),
          winPercent: getStatValue("winPercent"),
          pointsFor: getStatValue("pointsFor"),
          pointsAgainst: getStatValue("pointsAgainst"),
          pointDifferential: getStatValue("pointDifferential"),
          avgPointsFor: getStatValue("avgPointsFor"),
          avgPointsAgainst: getStatValue("avgPointsAgainst"),
        },
      };

      logs.push(`   Win %: ${record.stats?.winPercent?.toFixed(3) || "N/A"}`);
      logs.push(`   Points For: ${record.stats?.pointsFor || "N/A"}`);
      logs.push(`   Points Against: ${record.stats?.pointsAgainst || "N/A"}`);
    } else if (espnTeamResponse.team.record?.items) {
      // Fallback to site API record (overall only)
      const recordItem = espnTeamResponse.team.record.items[0];
      if (recordItem) {
        logs.push(`   Overall Record: ${recordItem.summary} (site API)`);

        const stats = recordItem.stats || [];
        const getStatValue = (name: string) =>
          stats.find((s: { name: string; value: number }) => s.name === name)
            ?.value;

        record = {
          overall: recordItem.summary,
          conference: null,
          home: null,
          away: null,
          stats: {
            wins: getStatValue("wins"),
            losses: getStatValue("losses"),
            winPercent: getStatValue("winPercent"),
            pointsFor: getStatValue("pointsFor"),
            pointsAgainst: getStatValue("pointsAgainst"),
            pointDifferential: getStatValue("pointDifferential"),
            avgPointsFor: getStatValue("avgPointsFor"),
            avgPointsAgainst: getStatValue("avgPointsAgainst"),
          },
        };
      }
    }

    // Parse current ranking and playoff info
    // ESPN uses 99 or null for unranked teams
    const rawRank = espnTeamResponse.team.rank;
    const currentRank = rawRank && rawRank !== 99 ? rawRank : null;
    const playoffSeed = null; // Will be populated from separate playoff rankings API if needed

    if (currentRank) {
      logs.push(`   Current Rank: #${currentRank}`);
    }
    if (playoffSeed) {
      logs.push(`   Playoff Seed: #${playoffSeed}`);
    }

    // Parse conference standing
    const conferenceStanding = espnTeamResponse.standingSummary;
    if (conferenceStanding) {
      logs.push(`   Conference Standing: ${conferenceStanding}`);
    }

    // Parse next game
    const nextGameId = espnTeamResponse.nextEvent?.[0]?.id;
    if (nextGameId) {
      logs.push(`   Next Game: ${nextGameId}`);
    }

    const reshapedTeam = {
      _id: team.id,
      name: team.name,
      displayName: team.displayName,
      abbreviation: team.abbreviation,
      logo: logo?.href || "",
      color: team.color,
      alternateColor: team.alternateColor,
      conferenceId: team.groups?.parent?.id || "8", // Default to SEC
      record,
      conferenceStanding,
      nationalRanking: currentRank,
      playoffSeed: playoffSeed || null,
      nextGameId,
      lastUpdated: new Date(),
    };

    logs.push("   ✅ Team reshaped successfully");
    return { team: reshapedTeam, logs };
  } catch (error) {
    logs.push(`❌ Failed to reshape team: ${error}`);
    return { team: null, logs };
  }
};

/**
 * Reshape multiple team responses
 */
export const reshapeTeamsData = (
  teamResponses: TeamDataResponse[]
): ReshapeResult<ReshapedTeam> => {
  const logs: string[] = [];
  const teams: ReshapedTeam[] = [];

  logs.push("\n🔄 RESHAPING ESPN TEAMS DATA");
  logs.push("=====================================");
  logs.push(`📊 Processing ${teamResponses.length} teams`);

  teamResponses.forEach(({ abbreviation, data, recordData }, index) => {
    logs.push(`\n🏈 Team ${index + 1}: ${abbreviation}`);

    if (!data) {
      logs.push("   ❌ No data received from ESPN");
      return;
    }

    const result = reshapeTeamData(data, recordData || undefined);
    result.logs.forEach((log: string) => logs.push(`   ${log}`));

    if (result.team) {
      teams.push(result.team);
    }
  });

  logs.push(
    `\n✅ RESHAPE COMPLETE: ${teams.length}/${teamResponses.length} teams processed`
  );
  logs.push("=====================================\n");

  return { teams, logs };
};
