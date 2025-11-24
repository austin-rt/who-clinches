import { NextRequest, NextResponse } from 'next/server';
import dbConnectTest from '@/lib/mongodb-test';
import { getESPNScoreboardTestData } from '@/lib/models/test/ESPNScoreboardTestData';
import { getESPNGameSummaryTestData } from '@/lib/models/test/ESPNGameSummaryTestData';
import { getESPNTeamTestData } from '@/lib/models/test/ESPNTeamTestData';
import { getESPNTeamRecordsTestData } from '@/lib/models/test/ESPNTeamRecordsTestData';
import { espnClient } from '@/lib/cfb/espn-client';
import { SEC_TEAMS } from '@/lib/cfb/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Pro Mode Only: Daily test data snapshot update
 * Pulls one example of each ESPN API response type for unit testing
 * Runs daily at low traffic time (e.g., 3 AM ET)
 *
 * In Hobby tier, this should be part of the batch pull cron job
 */
export const GET = async (request: NextRequest) => {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Connect to test database
    await dbConnectTest();

    const season = 2025;
    const results: Array<{ type: string; success: boolean; error?: string }> = [];

    // 3. Pull scoreboard data for all weeks
    try {
      // Get all available weeks from ESPN calendar
      let weeksToPull: number[] = [];
      try {
        // Fetch calendar without season parameter - ESPN only returns calendar without season
        const calendarResponse = await espnClient.getScoreboard({
          groups: 8, // SEC
        });

        const regularSeason = calendarResponse.leagues?.[0]?.calendar?.find(
          (cal) => cal.label === 'Regular Season'
        );

        if (regularSeason?.entries) {
          weeksToPull = regularSeason.entries
            .map((entry) => parseInt(entry.value, 10))
            .filter((val: number) => !isNaN(val));
        }

        // If no weeks found from calendar, calculate maxWeek from entries if available
        if (weeksToPull.length === 0) {
          let maxWeek = 15; // Default fallback
          if (regularSeason?.entries && regularSeason.entries.length > 0) {
            // Calculate maxWeek from the highest week number in entries
            const weekNumbers = regularSeason.entries
              .map((entry) => parseInt(entry.value, 10))
              .filter((val: number) => !isNaN(val));
            if (weekNumbers.length > 0) {
              maxWeek = Math.max(...weekNumbers);
            }
          }
          weeksToPull = Array.from({ length: maxWeek }, (_, i) => i + 1);
        }
      } catch {
        // Fallback: try to use a reasonable default, but ESPN data should always be available
        const maxWeek = 15;
        weeksToPull = Array.from({ length: maxWeek }, (_, i) => i + 1);
      }

      const ScoreboardModel = await getESPNScoreboardTestData();
      let weeksPulled = 0;
      const weekErrors: string[] = [];

      // Pull scoreboard for each week
      for (const week of weeksToPull) {
        try {
          const scoreboard = await espnClient.getScoreboard({
            groups: 8, // SEC
            week,
            season,
          });

          // Store each week as separate document (remove unique constraint on season)
          await ScoreboardModel.findOneAndUpdate(
            { season, week },
            {
              season,
              week,
              endpoint: `/v2/sports/football/leagues/college-football/scoreboard?groups=8&week=${week}&seasontype=2&dates=${season}`,
              response: scoreboard,
              pulledAt: new Date(),
              lastUpdated: new Date(),
            },
            { upsert: true }
          );

          weeksPulled++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          weekErrors.push(`Week ${week}: ${errorMessage}`);
        }

        // Rate limiting between weeks
        if (weeksToPull.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (weeksPulled > 0) {
        results.push({
          type: 'scoreboard',
          success: true,
          error: weekErrors.length > 0 ? weekErrors.join('; ') : undefined,
        });
      } else {
        results.push({
          type: 'scoreboard',
          success: false,
          error: `Failed to pull any weeks. Errors: ${weekErrors.join('; ')}`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ type: 'scoreboard', success: false, error: errorMessage });
    }

    // 4. Pull game summary example (first game from scoreboard)
    try {
      // Get a game ID from the scoreboard we just pulled
      const ScoreboardModel = await getESPNScoreboardTestData();
      const scoreboardData = await ScoreboardModel.findOne({ season });

      if (
        scoreboardData &&
        scoreboardData.response.events &&
        scoreboardData.response.events.length > 0
      ) {
        const gameId = scoreboardData.response.events[0].id;
        const gameSummary = await espnClient.getGameSummary(gameId);

        const GameSummaryModel = await getESPNGameSummaryTestData();
        await GameSummaryModel.findOneAndUpdate(
          { season },
          {
            season,
            gameId,
            endpoint: `/v2/sports/football/leagues/college-football/summary?event=${gameId}`,
            response: gameSummary,
            pulledAt: new Date(),
            lastUpdated: new Date(),
          },
          { upsert: true }
        );

        results.push({ type: 'gameSummary', success: true });
      } else {
        results.push({ type: 'gameSummary', success: false, error: 'No games in scoreboard' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ type: 'gameSummary', success: false, error: errorMessage });
    }

    // 5. Pull team example (first SEC team)
    try {
      const teamAbbrev = SEC_TEAMS[0];
      const teamResponse = await espnClient.getTeam(teamAbbrev);

      const TeamModel = await getESPNTeamTestData();
      await TeamModel.findOneAndUpdate(
        { season },
        {
          season,
          teamId: teamResponse.team.id,
          teamAbbrev,
          endpoint: `/v2/sports/football/leagues/college-football/teams/${teamResponse.team.id}`,
          response: teamResponse,
          pulledAt: new Date(),
          lastUpdated: new Date(),
        },
        { upsert: true }
      );

      results.push({ type: 'team', success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ type: 'team', success: false, error: errorMessage });
    }

    // 6. Pull team records example (same team as above)
    try {
      const teamAbbrev = SEC_TEAMS[0];
      const teamResponse = await espnClient.getTeam(teamAbbrev);
      const teamRecords = await espnClient.getTeamRecords(teamResponse.team.id, season);

      const TeamRecordsModel = await getESPNTeamRecordsTestData();
      await TeamRecordsModel.findOneAndUpdate(
        { season },
        {
          season,
          teamId: teamResponse.team.id,
          teamAbbrev,
          endpoint: `/v2/sports/football/leagues/college-football/seasons/${season}/types/2/teams/${teamResponse.team.id}/record`,
          response: teamRecords,
          pulledAt: new Date(),
          lastUpdated: new Date(),
        },
        { upsert: true }
      );

      results.push({ type: 'teamRecords', success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ type: 'teamRecords', success: false, error: errorMessage });
    }

    const successCount = results.filter((r) => r.success).length;

    // 7. Trigger reshape tests (non-blocking, fire-and-forget)
    // Tests run in background to verify reshape functions still work with new API format
    if (successCount > 0 && process.env.CRON_SECRET) {
      // Fire and forget - don't wait for response
      fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron/run-reshape-tests`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }).catch(() => {
        // Silently fail - test failure is logged separately in test endpoint
      });
    }

    return NextResponse.json(
      {
        updated: successCount,
        total: results.length,
        results,
        lastUpdated: new Date().toISOString(),
        testsTriggered: successCount > 0,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
};
