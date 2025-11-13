/**
 * Test Data Loader
 *
 * Loads real ESPN API response snapshots from database for unit testing.
 * These snapshots are updated daily via cron job to ensure tests use current API format.
 */

import dbConnectTest from '@/lib/mongodb-test';
import { getESPNScoreboardTestData } from '@/lib/models/test/ESPNScoreboardTestData';
import { getESPNGameSummaryTestData } from '@/lib/models/test/ESPNGameSummaryTestData';
import { getESPNTeamTestData } from '@/lib/models/test/ESPNTeamTestData';
import { getESPNTeamRecordsTestData } from '@/lib/models/test/ESPNTeamRecordsTestData';
import {
  ESPNScoreboardResponse,
  ESPNGameSummaryResponse,
  ESPNTeamResponse,
  ESPNCoreRecordResponse,
} from '@/lib/espn-client';

const SEASON = 2025;

/**
 * Load scoreboard test data from test database
 */
export async function loadScoreboardTestData(): Promise<ESPNScoreboardResponse> {
  await dbConnectTest();
  const Model = await getESPNScoreboardTestData();
  const data = await Model.findOne({ season: SEASON });

  if (!data) {
    throw new Error(
      `TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:missing_data | TYPE:scoreboard | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Run /api/cron/update-test-data to populate test data, then update reshape functions if API format changed`
    );
  }

  return data.response;
}

/**
 * Load team test data from test database
 */
export async function loadTeamTestData(): Promise<ESPNTeamResponse> {
  await dbConnectTest();
  const Model = await getESPNTeamTestData();
  const data = await Model.findOne({ season: SEASON });

  if (!data) {
    throw new Error(
      `TEST_DATA_ERROR | ENTITY:TeamTestData | ISSUE:missing_data | TYPE:team | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Run /api/cron/update-test-data to populate test data, then update reshape functions if API format changed`
    );
  }

  return data.response;
}

/**
 * Load game summary test data from test database
 */
export async function loadGameSummaryTestData(): Promise<ESPNGameSummaryResponse> {
  await dbConnectTest();
  const Model = await getESPNGameSummaryTestData();
  const data = await Model.findOne({ season: SEASON });

  if (!data) {
    throw new Error(
      `TEST_DATA_ERROR | ENTITY:GameSummaryTestData | ISSUE:missing_data | TYPE:gameSummary | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Run /api/cron/update-test-data to populate test data, then update reshape functions if API format changed`
    );
  }

  return data.response;
}

/**
 * Load team records test data from test database
 */
export async function loadTeamRecordsTestData(): Promise<ESPNCoreRecordResponse> {
  await dbConnectTest();
  const Model = await getESPNTeamRecordsTestData();
  const data = await Model.findOne({ season: SEASON });

  if (!data) {
    throw new Error(
      `TEST_DATA_ERROR | ENTITY:TeamRecordsTestData | ISSUE:missing_data | TYPE:teamRecords | SEASON:${SEASON} | EXPECTED:test_data_exists | ACTUAL:not_found | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Run /api/cron/update-test-data to populate test data, then update reshape functions if API format changed`
    );
  }

  return data.response;
}

/**
 * Check if test data exists for all required types
 */
export async function checkTestDataAvailable(): Promise<{
  available: boolean;
  missing: string[];
}> {
  await dbConnectTest();
  const missing: string[] = [];

  const ScoreboardModel = await getESPNScoreboardTestData();
  const scoreboard = await ScoreboardModel.findOne({ season: SEASON });
  if (!scoreboard) missing.push('scoreboard');

  const GameSummaryModel = await getESPNGameSummaryTestData();
  const gameSummary = await GameSummaryModel.findOne({ season: SEASON });
  if (!gameSummary) missing.push('gameSummary');

  const TeamModel = await getESPNTeamTestData();
  const team = await TeamModel.findOne({ season: SEASON });
  if (!team) missing.push('team');

  const TeamRecordsModel = await getESPNTeamRecordsTestData();
  const teamRecords = await TeamRecordsModel.findOne({ season: SEASON });
  if (!teamRecords) missing.push('teamRecords');

  return {
    available: missing.length === 0,
    missing,
  };
}
