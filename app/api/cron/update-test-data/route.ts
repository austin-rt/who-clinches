import { NextRequest, NextResponse } from 'next/server';
import dbConnectTest from '@/lib/mongodb-test';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import { getESPNScoreboardTestData } from '@/lib/models/test/ESPNScoreboardTestData';
import { getESPNGameSummaryTestData } from '@/lib/models/test/ESPNGameSummaryTestData';
import { getESPNTeamTestData } from '@/lib/models/test/ESPNTeamTestData';
import { getESPNTeamRecordsTestData } from '@/lib/models/test/ESPNTeamRecordsTestData';
import { createESPNClient } from '@/lib/cfb/espn-client';
import { sports } from '@/lib/constants';

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

    // 3. Pull scoreboard data for entire season using dates parameter
    try {
        const { espnRoute, conferences } = sports.cfb;
        const client = createESPNClient(espnRoute);
      const scoreboard = await client.getScoreboard({
          groups: conferences.sec.espnId,
        dates: season,
      });

      const ScoreboardModel = await getESPNScoreboardTestData();
      
      // Store entire season response (dates parameter returns whole season)
      // Store with week: 0 to indicate it's the full season response
          await ScoreboardModel.findOneAndUpdate(
        { season, week: 0 },
            {
              season,
          week: 0,
          endpoint: `/v2/sports/football/leagues/college-football/scoreboard?groups=8&dates=${season}`,
              response: scoreboard,
              pulledAt: new Date(),
              lastUpdated: new Date(),
            },
            { upsert: true }
          );

      results.push({ type: 'scoreboard', success: true });
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
        const { espnRoute } = sports.cfb;
        const client = createESPNClient(espnRoute);
        const gameSummary = await client.getGameSummary(gameId);

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
      // Get first team from SEC conference for testing (from database)
      await dbConnect();
      const { conferences } = sports.cfb;
      const secTeams = await Team.find({ conferenceId: conferences.sec.espnId }).lean();
      if (secTeams.length === 0) {
        throw new Error('No SEC teams found in database. Call pull-games first.');
      }
      const firstTeam = secTeams[0];
      const teamAbbrev = firstTeam.abbreviation;
      const { espnRoute } = sports.cfb;
      const client = createESPNClient(espnRoute);
      const teamResponse = await client.getTeam(teamAbbrev);

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
      // Get first team from SEC conference for testing (from database)
      await dbConnect();
      const { conferences } = sports.cfb;
      const secTeams = await Team.find({ conferenceId: conferences.sec.espnId }).lean();
      if (secTeams.length === 0) {
        throw new Error('No SEC teams found in database. Call pull-games first.');
      }
      const firstTeam = secTeams[0];
      const teamAbbrev = firstTeam.abbreviation;
      const { espnRoute } = sports.cfb;
      const client = createESPNClient(espnRoute);
      const teamResponse = await client.getTeam(teamAbbrev);
      const teamRecords = await client.getTeamRecords(teamResponse.team.id, season);

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
