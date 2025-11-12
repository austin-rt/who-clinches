import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import Team from "@/lib/models/Team";
import ErrorLog from "@/lib/models/Error";
import { espnClient } from "@/lib/espn-client";
import { reshapeScoreboardData } from "@/lib/reshape-games";
import { SEC_CONFERENCE_ID } from "@/lib/constants";
import { CronLiveGamesResponse } from "@/lib/api-types";
import { GameLean } from "@/lib/types";
import { calculatePredictedScore } from "@/lib/prefill-helpers";

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

    // 3. Query DB for incomplete games (games that need checking)
    const gamesRaw = await Game.find({
      season: 2025,
      conferenceGame: true,
      completed: false,
    }).lean();

    // Cast to GameLean for type safety
    const games: GameLean[] = gamesRaw.map((g) => ({
      _id: String(g._id),
      espnId: String(g.espnId),
      displayName: String(g.displayName),
      date: String(g.date),
      week: typeof g.week === "number" ? g.week : null,
      season: Number(g.season),
      sport: String(g.sport),
      league: String(g.league),
      state: g.state as "pre" | "in" | "post",
      completed: Boolean(g.completed),
      conferenceGame: Boolean(g.conferenceGame),
      neutralSite: Boolean(g.neutralSite),
      home: {
        teamEspnId: String(g.home.teamEspnId),
        abbrev: String(g.home.abbrev),
        displayName: g.home.displayName
          ? String(g.home.displayName)
          : undefined,
        logo: g.home.logo ? String(g.home.logo) : undefined,
        color: g.home.color ? String(g.home.color) : undefined,
        score: typeof g.home.score === "number" ? g.home.score : null,
        rank: typeof g.home.rank === "number" ? g.home.rank : null,
      },
      away: {
        teamEspnId: String(g.away.teamEspnId),
        abbrev: String(g.away.abbrev),
        displayName: g.away.displayName
          ? String(g.away.displayName)
          : undefined,
        logo: g.away.logo ? String(g.away.logo) : undefined,
        color: g.away.color ? String(g.away.color) : undefined,
        score: typeof g.away.score === "number" ? g.away.score : null,
        rank: typeof g.away.rank === "number" ? g.away.rank : null,
      },
      odds: {
        favoriteTeamEspnId: g.odds.favoriteTeamEspnId
          ? String(g.odds.favoriteTeamEspnId)
          : null,
        spread: typeof g.odds.spread === "number" ? g.odds.spread : null,
        overUnder:
          typeof g.odds.overUnder === "number" ? g.odds.overUnder : null,
      },
      predictedScore: g.predictedScore
        ? {
            home: Number(g.predictedScore.home),
            away: Number(g.predictedScore.away),
          }
        : undefined,
      lastUpdated: new Date(g.lastUpdated),
    }));

    // 4. Early exit if all games are completed (no ESPN calls!)
    if (games.length === 0) {
      return NextResponse.json<CronLiveGamesResponse>({
        updated: 0,
        gamesChecked: 0,
        activeGames: 0,
        espnCalls: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // 5. Get week number from first game (all games should be in same week)
    const currentWeek = games[0].week;
    const currentSeason = 2025; // Hardcoded for now

    // Validate week number exists
    if (currentWeek === null) {
      await ErrorLog.create({
        timestamp: new Date(),
        endpoint: "/api/cron/update-live-games",
        payload: { season: currentSeason },
        error: "Games in database missing week number",
        stackTrace: "",
      });

      return NextResponse.json<CronLiveGamesResponse>({
        updated: 0,
        gamesChecked: 0,
        activeGames: games.length,
        espnCalls: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // 6. Fetch scoreboard from ESPN (one call for entire week)
    let espnResponse;
    try {
      espnResponse = await espnClient.getScoreboard({
        groups: SEC_CONFERENCE_ID, // 8
        season: currentSeason,
        week: currentWeek,
      });
    } catch (error) {
      // Log error and return, will retry in 5 minutes
      await ErrorLog.create({
        timestamp: new Date(),
        endpoint: "/api/cron/update-live-games",
        payload: { season: currentSeason, week: currentWeek },
        error: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack || "" : "",
      });

      return NextResponse.json<CronLiveGamesResponse>({
        updated: 0,
        gamesChecked: 0,
        activeGames: games.length,
        espnCalls: 0,
        lastUpdated: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }

    // 7. Reshape ESPN response
    const result = reshapeScoreboardData(
      espnResponse,
      "football",
      "college-football"
    );
    const reshapedGames = result.games || [];

    // 8. Update each game with new data from ESPN
    let updateCount = 0;
    const gameIds = new Set(games.map((g) => g.espnId));
    const gamesToUpdate = reshapedGames.filter((game) =>
      gameIds.has(game.espnId)
    );

    // Fetch teams for predictedScore calculation
    const teamIds = [
      ...new Set([
        ...gamesToUpdate.map((g) => g.home.teamEspnId),
        ...gamesToUpdate.map((g) => g.away.teamEspnId),
      ]),
    ];
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamMap = new Map(teams.map((t) => [String(t._id), t]));

    for (const reshapedGame of gamesToUpdate) {
      const currentGame = games.find((g) => g.espnId === reshapedGame.espnId);

      if (!currentGame) continue;

      // Get team data for predictedScore calculation
      const homeTeam = teamMap.get(reshapedGame.home.teamEspnId);
      const awayTeam = teamMap.get(reshapedGame.away.teamEspnId);

      if (!homeTeam || !awayTeam) {
        // Skip if team data is missing (non-conference games)
        continue;
      }

      // Always recalculate predictedScore (uses real scores if available, otherwise spread + averages)
      const predictedScore = calculatePredictedScore(
        reshapedGame,
        homeTeam as unknown as {
          record?: {
            stats?: { avgPointsFor?: number; avgPointsAgainst?: number };
          };
        },
        awayTeam as unknown as {
          record?: {
            stats?: { avgPointsFor?: number; avgPointsAgainst?: number };
          };
        }
      );

      // Check if anything changed (including spreads and predictedScore)
      const hasChanges =
        reshapedGame.state !== currentGame.state ||
        reshapedGame.completed !== currentGame.completed ||
        reshapedGame.home.score !== currentGame.home.score ||
        reshapedGame.away.score !== currentGame.away.score ||
        reshapedGame.home.rank !== currentGame.home.rank ||
        reshapedGame.away.rank !== currentGame.away.rank ||
        reshapedGame.odds?.spread !== currentGame.odds?.spread ||
        reshapedGame.odds?.favoriteTeamEspnId !==
          currentGame.odds?.favoriteTeamEspnId ||
        predictedScore.home !== currentGame.predictedScore?.home ||
        predictedScore.away !== currentGame.predictedScore?.away;

      if (hasChanges) {
        // Update game with new data including spreads and predictedScore
        await Game.updateOne(
          { espnId: reshapedGame.espnId },
          {
            $set: {
              state: reshapedGame.state,
              completed: reshapedGame.completed,
              "home.score": reshapedGame.home.score,
              "home.rank": reshapedGame.home.rank,
              "away.score": reshapedGame.away.score,
              "away.rank": reshapedGame.away.rank,
              "odds.spread": reshapedGame.odds?.spread ?? null,
              "odds.favoriteTeamEspnId":
                reshapedGame.odds?.favoriteTeamEspnId ?? null,
              "odds.overUnder": reshapedGame.odds?.overUnder ?? null,
              "predictedScore.home": predictedScore.home,
              "predictedScore.away": predictedScore.away,
              lastUpdated: new Date(),
            },
          }
        );
        updateCount++;
      }
    }

    return NextResponse.json<CronLiveGamesResponse>({
      updated: updateCount,
      gamesChecked: gamesToUpdate.length,
      activeGames: games.length,
      espnCalls: 1,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    // Unexpected error - log and return
    await ErrorLog.create({
      timestamp: new Date(),
      endpoint: "/api/cron/update-live-games",
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
