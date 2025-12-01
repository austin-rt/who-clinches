import dbConnect from '@/lib/mongodb';
import { getESPNScoreboardTestData } from '@/lib/models/test/ESPNScoreboardTestData';
import { getESPNGameSummaryTestData } from '@/lib/models/test/ESPNGameSummaryTestData';
import { getESPNTeamTestData } from '@/lib/models/test/ESPNTeamTestData';
import type { EspnScoreboardGenerated } from '@/lib/espn/espn-scoreboard-generated';
import type { EspnGameSummaryGenerated } from '@/lib/espn/espn-game-summary-generated';
import type { EspnTeamGenerated } from '@/lib/espn/espn-team-generated';

export const loadScoreboardTestData = async (): Promise<EspnScoreboardGenerated> => {
  console.log('[Test Data Loader] loadScoreboardTestData() called');
  console.log('[Test Data Loader] Connecting to database...');
  await dbConnect();
  console.log('[Test Data Loader] Getting ESPNScoreboardTestData model...');
  const Model = await getESPNScoreboardTestData();
  console.log('[Test Data Loader] Finding scoreboard test data...');
  const data = await Model.findOne({});

  if (!data) {
    console.error('[Test Data Loader] ERROR: Scoreboard test data not found');
    throw new Error(
      `TEST_DATA_ERROR | ENTITY:ScoreboardTestData | ISSUE:missing_data | TYPE:scoreboard | EXPECTED:test_data_exists | ACTUAL:not_found | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Test data must be populated in the test database, then update reshape functions if API format changed`
    );
  }

  console.log('[Test Data Loader] Scoreboard test data loaded');
  return data.response;
};

export const loadTeamTestData = async (): Promise<EspnTeamGenerated> => {
  console.log('[Test Data Loader] loadTeamTestData() called');
  console.log('[Test Data Loader] Connecting to database...');
  await dbConnect();
  console.log('[Test Data Loader] Getting ESPNTeamTestData model...');
  const Model = await getESPNTeamTestData();
  console.log('[Test Data Loader] Finding team test data...');
  const data = await Model.findOne({});

  if (!data) {
    console.error('[Test Data Loader] ERROR: Team test data not found');
    throw new Error(
      `TEST_DATA_ERROR | ENTITY:TeamTestData | ISSUE:missing_data | TYPE:team | EXPECTED:test_data_exists | ACTUAL:not_found | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Test data must be populated in the test database, then update reshape functions if API format changed`
    );
  }

  console.log('[Test Data Loader] Team test data loaded');
  return data.response;
};

export const loadGameSummaryTestData = async (): Promise<EspnGameSummaryGenerated> => {
  console.log('[Test Data Loader] loadGameSummaryTestData() called');
  console.log('[Test Data Loader] Connecting to database...');
  await dbConnect();
  console.log('[Test Data Loader] Getting ESPNGameSummaryTestData model...');
  const Model = await getESPNGameSummaryTestData();
  console.log('[Test Data Loader] Finding game summary test data...');
  const data = await Model.findOne({});

  if (!data) {
    console.error('[Test Data Loader] ERROR: Game summary test data not found');
    throw new Error(
      `TEST_DATA_ERROR | ENTITY:GameSummaryTestData | ISSUE:missing_data | TYPE:gameSummary | EXPECTED:test_data_exists | ACTUAL:not_found | IMPLICATION:ESPN_API_may_have_changed_requiring_reshape_function_updates | NOTE:Test data must be populated in the test database, then update reshape functions if API format changed`
    );
  }

  console.log('[Test Data Loader] Game summary test data loaded');
  return data.response;
};

export const checkTestDataAvailable = async (): Promise<{
  available: boolean;
  missing: string[];
}> => {
  process.stdout.write('[checkTestDataAvailable] Starting...\n');
  await dbConnect();
  process.stdout.write('[checkTestDataAvailable] Connection established\n');
  const missing: string[] = [];

  process.stdout.write('[checkTestDataAvailable] Checking scoreboard...\n');
  const ScoreboardModel = await getESPNScoreboardTestData();
  const scoreboard = await ScoreboardModel.findOne({});
  if (!scoreboard) missing.push('scoreboard');
  process.stdout.write(`[checkTestDataAvailable] Scoreboard: ${scoreboard ? 'found' : 'missing'}\n`);

  process.stdout.write('[checkTestDataAvailable] Checking gameSummary...\n');
  const GameSummaryModel = await getESPNGameSummaryTestData();
  const gameSummary = await GameSummaryModel.findOne({});
  if (!gameSummary) missing.push('gameSummary');
  process.stdout.write(`[checkTestDataAvailable] GameSummary: ${gameSummary ? 'found' : 'missing'}\n`);

  process.stdout.write('[checkTestDataAvailable] Checking team...\n');
  const TeamModel = await getESPNTeamTestData();
  const team = await TeamModel.findOne({});
  if (!team) missing.push('team');
  process.stdout.write(`[checkTestDataAvailable] Team: ${team ? 'found' : 'missing'}\n`);

  process.stdout.write(`[checkTestDataAvailable] Complete. Available: ${missing.length === 0}, Missing: ${missing.join(',') || 'none'}\n`);
  return {
    available: missing.length === 0,
    missing,
  };
};
