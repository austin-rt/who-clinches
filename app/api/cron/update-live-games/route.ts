import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/lib/models/Game";
import ErrorLog from "@/lib/models/Error";
import { espnClient } from "@/lib/espn-client";
import { reshapeScoreboardData } from "@/lib/reshape-games";
import { SEC_CONFERENCE_ID } from "@/lib/constants";
import { CronLiveGamesResponse } from "@/lib/api-types";
import { GameLean } from "@/lib/types";

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
        score: typeof g.home.score === "number" ? g.home.score : null,
        rank: typeof g.home.rank === "number" ? g.home.rank : null,
      },
      away: {
        teamEspnId: String(g.away.teamEspnId),
        abbrev: String(g.away.abbrev),
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

    for (const reshapedGame of gamesToUpdate) {
      const currentGame = games.find((g) => g.espnId === reshapedGame.espnId);

      if (!currentGame) continue;

      // Check if anything changed
      if (
        reshapedGame.state !== currentGame.state ||
        reshapedGame.completed !== currentGame.completed ||
        reshapedGame.home.score !== currentGame.home.score ||
        reshapedGame.away.score !== currentGame.away.score ||
        reshapedGame.home.rank !== currentGame.home.rank ||
        reshapedGame.away.rank !== currentGame.away.rank
      ) {
        // Update only game fields (not team display fields like displayName, logo, color)
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

