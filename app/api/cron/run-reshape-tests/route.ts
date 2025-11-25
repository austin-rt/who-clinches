import { NextRequest, NextResponse } from 'next/server';
import dbConnectTest from '@/lib/mongodb-test';
import {
  loadScoreboardTestData,
  loadTeamTestData,
  loadTeamRecordsTestData,
  checkTestDataAvailable,
} from '@/__tests__/helpers/test-data-loader';
import { reshapeScoreboardData } from '@/lib/reshape-games';
import { reshapeTeamData } from '@/lib/reshape-teams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Run reshape function tests against test database
 * Called internally by update-test-data cron after successful data update
 *
 * This endpoint:
 * - Verifies test data is available
 * - Runs reshape functions against real ESPN API snapshots
 * - Logs results to database
 * - Returns pass/fail status (doesn't block deployment)
 */
export const GET = async (request: NextRequest) => {
  // 1. Verify cron secret (same as other cron endpoints)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Array<{ test: string; passed: boolean; error?: string; duration: number }> = [];

  try {
    // 2. Connect to test database
    await dbConnectTest();

    // 3. Verify test data is available
    const available = await checkTestDataAvailable();
    if (!available.available) {
      return NextResponse.json(
        {
          success: false,
          error: 'TEST_DATA_MISSING',
          missing: available.missing,
          message: 'Test data not available - reshape tests cannot run',
        },
        { status: 500 }
      );
    }

    // 4. Test reshapeScoreboardData
    try {
      const testStart = Date.now();
      const scoreboardData = await loadScoreboardTestData();

      if (!scoreboardData.events || scoreboardData.events.length === 0) {
        throw new Error('Scoreboard test data has no events');
      }

      const reshaped = reshapeScoreboardData(scoreboardData);

      if (!reshaped.games || reshaped.games.length === 0) {
        throw new Error('reshapeScoreboardData returned no games');
      }

      // Basic validation
      const firstGame = reshaped.games[0];
      if (!firstGame.espnId || !firstGame.home || !firstGame.away) {
        throw new Error('Reshaped game missing required fields');
      }

      results.push({
        test: 'reshapeScoreboardData',
        passed: true,
        duration: Date.now() - testStart,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        test: 'reshapeScoreboardData',
        passed: false,
        error: errorMessage,
        duration: 0,
      });
    }

    // 5. Test reshapeTeamData
    try {
      const testStart = Date.now();
      const teamData = await loadTeamTestData();
      const recordData = await loadTeamRecordsTestData();

      const reshaped = reshapeTeamData(teamData, recordData);

      if (!reshaped) {
        throw new Error('reshapeTeamData returned null');
      }

      // Basic validation
      if (!reshaped._id || !reshaped.displayName || !reshaped.abbreviation) {
        throw new Error('Reshaped team missing required fields');
      }

      results.push({
        test: 'reshapeTeamData',
        passed: true,
        duration: Date.now() - testStart,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        test: 'reshapeTeamData',
        passed: false,
        error: errorMessage,
        duration: 0,
      });
    }

    // 6. Calculate summary
    const totalDuration = Date.now() - startTime;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const allPassed = failed === 0;

    // 7. Log to database (ErrorLog model for failures)
    if (!allPassed) {
      try {
        const ErrorLog = (await import('@/lib/models/Error')).default;
        await ErrorLog.create({
          message: `RESHAPE_TEST_FAILURE | FAILED_TESTS:${failed} | PASSED:${passed} | DURATION:${totalDuration}ms`,
          stack: JSON.stringify(results, null, 2),
          context: {
            type: 'reshape_test',
            results,
            totalDuration,
          },
        });
      } catch (logError) {
        // Don't fail if logging fails - error already logged to database
        // eslint-disable-next-line no-console
        console.error('Failed to log test results:', logError);
      }
    }

    return NextResponse.json(
      {
        success: allPassed,
        passed,
        failed,
        total: results.length,
        duration: totalDuration,
        results,
        message: allPassed
          ? 'All reshape tests passed'
          : `RESHAPE_TEST_FAILURE | FAILED_TESTS:${failed} | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Review failed tests and update reshape functions if API format changed`,
      },
      { status: allPassed ? 200 : 500 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        results,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
};
