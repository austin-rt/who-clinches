/**
 * Data reshaping functions for ESPN API responses
 * Transform raw ESPN data into our desired format
 */

import { ESPNScoreboardResponse, ESPNCompetition } from "./espn-client";
import { ReshapedGame, ReshapeResult } from "./types";

/**
 * Reshape ESPN scoreboard response for our needs
 */
export const reshapeScoreboardData = (
  espnResponse: ESPNScoreboardResponse,
  sport: string = "football",
  league: string = "college-football"
): ReshapeResult<ReshapedGame> => {
  const logs: string[] = [];

  logs.push("\n🔄 RESHAPING ESPN SCOREBOARD DATA");
  logs.push("=====================================");

  // Log raw response structure first
  logs.push("📊 Raw ESPN Response:");
  logs.push(`   Season: ${espnResponse.season?.year}`);
  logs.push(`   Week: ${espnResponse.week?.number}`);
  logs.push(`   Events: ${espnResponse.events?.length || 0}`);

  if (!espnResponse.events || espnResponse.events.length === 0) {
    logs.push("❌ No events to reshape");
    return { games: [], logs };
  }

  const reshapedGames = espnResponse.events
    .map((event, index) => {
      logs.push(`\n🎮 Game ${index + 1}: ${event.id}`);

      const competition = event.competitions[0];
      if (!competition) {
        logs.push("   ❌ No competition data");
        return null;
      }

      const competitors = competition.competitors;
      if (!competitors || competitors.length !== 2) {
        logs.push("   ❌ Invalid competitors");
        return null;
      }

      // Use ESPN's homeAway field instead of assuming array positions
      const homeTeam = competitors.find((c) => c.homeAway === "home");
      const awayTeam = competitors.find((c) => c.homeAway === "away");

      if (!homeTeam || !awayTeam) {
        logs.push("   ❌ Could not identify home/away teams");
        return null;
      }

      logs.push(
        `   Away: ${awayTeam.team.abbreviation} (${awayTeam.score || 0})`
      );
      logs.push(
        `   Home: ${homeTeam.team.abbreviation} (${homeTeam.score || 0})`
      );
      logs.push(`   Status: ${competition.status.type.state}`);
      logs.push(`   Completed: ${competition.status.type.completed}`);
      logs.push(`   Conference Game: ${competition.conferenceCompetition}`);

      // Parse scores
      const awayScore = awayTeam.score ? parseInt(awayTeam.score, 10) : null;
      const homeScore = homeTeam.score ? parseInt(homeTeam.score, 10) : null;

      // Parse rankings (99 = unranked)
      const awayRank =
        awayTeam.curatedRank?.current === 99
          ? null
          : awayTeam.curatedRank?.current || null;
      const homeRank =
        homeTeam.curatedRank?.current === 99
          ? null
          : homeTeam.curatedRank?.current || null;

      if (awayRank) logs.push(`   Away Rank: #${awayRank}`);
      if (homeRank) logs.push(`   Home Rank: #${homeRank}`);

      // Parse odds - explicitly handle null vs undefined
      let favoriteTeamEspnId: string | null = null;
      let spread: number | null = null;
      let overUnder: number | null = null;

      if (competition.odds && competition.odds.length > 0) {
        const odds = competition.odds[0];

        // Explicitly set to null if ESPN has the field but no value
        overUnder = odds.overUnder ?? null;
        spread = odds.spread ?? null;

        // Use ESPN's favorite boolean fields
        if (odds.awayTeamOdds?.favorite === true) {
          favoriteTeamEspnId = awayTeam.team.id;
          logs.push(`   Favorite: ${awayTeam.team.abbreviation}`);
        } else if (odds.homeTeamOdds?.favorite === true) {
          favoriteTeamEspnId = homeTeam.team.id;
          logs.push(`   Favorite: ${homeTeam.team.abbreviation}`);
        }
        // If neither team is marked as favorite, favoriteTeamEspnId stays null

        if (spread !== null) {
          logs.push(`   Spread: ${spread} (Details: ${odds.details || "N/A"})`);
        }

        if (overUnder !== null) {
          logs.push(`   Over/Under: ${overUnder}`);
        }

        logs.push(
          `   Odds Last Updated: ${new Date().toISOString()} (ESPN fetch time)`
        );
      } else {
        // ESPN doesn't have odds for this game - explicitly set to null
        favoriteTeamEspnId = null;
        spread = null;
        overUnder = null;
        logs.push("   No odds data from ESPN");
      }

      // Our reshaped format
      const reshapedGame = {
        espnId: event.id,
        date: competition.date,
        week: competition.week?.number || espnResponse.week?.number || null,
        season:
          competition.season?.year ||
          espnResponse.season?.year ||
          new Date().getFullYear(),
        sport,
        league,
        state: competition.status.type.state,
        completed: competition.status.type.completed,
        conferenceGame: competition.conferenceCompetition || false,
        neutralSite: competition.neutralSite || false,
        home: {
          teamEspnId: homeTeam.team.id,
          abbrev: homeTeam.team.abbreviation,
          displayName: homeTeam.team.displayName,
          score: homeScore,
          rank: homeRank,
          logo: homeTeam.team.logo,
          color: homeTeam.team.color,
        },
        away: {
          teamEspnId: awayTeam.team.id,
          abbrev: awayTeam.team.abbreviation,
          displayName: awayTeam.team.displayName,
          score: awayScore,
          rank: awayRank,
          logo: awayTeam.team.logo,
          color: awayTeam.team.color,
        },
        odds: {
          favoriteTeamEspnId,
          spread,
          overUnder,
        },
        lastUpdated: new Date(),
      };

      logs.push("   ✅ Reshaped successfully");
      return reshapedGame;
    })
    .filter((game) => game !== null);

  logs.push(`\n✅ RESHAPE COMPLETE: ${reshapedGames.length} games processed`);
  logs.push("=====================================\n");

  return { games: reshapedGames, logs };
};

/**
 * Reshape individual game summary (for live polling)
 */
export const reshapeGameSummary = (
  summary: { header?: { competitions?: ESPNCompetition[] } },
  sport: string = "football",
  league: string = "college-football"
): ReshapedGame | null => {
  console.log("\n🔄 RESHAPING GAME SUMMARY");
  console.log("==========================");

  const competition = summary.header?.competitions?.[0];
  if (!competition) {
    console.log("❌ No competition data in game summary");
    return null;
  }

  // Create mock event to reuse scoreboard reshape logic
  const mockEvent = {
    id: competition.id,
    competitions: [competition],
  };

  const mockResponse: ESPNScoreboardResponse = {
    events: [mockEvent],
    season: { year: competition.season?.year || new Date().getFullYear() },
    week: { number: competition.week?.number || 1 },
  };

  const reshaped = reshapeScoreboardData(mockResponse, sport, league);
  return reshaped.games?.[0] || null;
};
