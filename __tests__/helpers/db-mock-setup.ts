/**
 * Database Mock Setup Helper
 *
 * Sets up MongoDB Memory Server for main database in integration tests.
 * This ensures tests don't write to real databases while still testing
 * full database operations.
 */

/* eslint-disable no-console */

import {
  stopMongoMemoryServer,
  clearMongoMemoryServerData,
} from '../mocks/mongodb-memory-server.mock';
import { checkTestDataAvailable } from './test-data-loader';
import dbConnectTest from '@/lib/mongodb-test';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import Game from '@/lib/models/Game';
import { CONFERENCE_METADATA } from '@/lib/cfb/constants';
import { SUPPORTED_SPORTS_CONFS } from '@/lib/cfb/supported-config';

let memoryServerUri: string | null = null;

/**
 * Setup test database environment
 * - Verifies MongoDB Memory Server is already running (started in jest.server-setup.js)
 * - Verifies test DB snapshots are available (for ESPN client mocks)
 * - This is called in beforeAll() hooks to ensure everything is ready
 * - Note: Memory server is started in jest.server-setup.js BEFORE Next.js server starts
 */
export const setupTestDB = async (): Promise<void> => {
  // 1. Verify test DB snapshots are available (for ESPN client mocks)
  console.log('[Test DB Setup] Verifying test DB snapshots are available...');
  const testDataCheck = await checkTestDataAvailable();
  if (!testDataCheck.available) {
    throw new Error(
      `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:missing_snapshots | MISSING_TYPES:${testDataCheck.missing.join(',')} | EXPECTED:all_test_data_available | ACTUAL:missing_types | NOTE:Run 'npm run test:db:check' to populate test data snapshots`
    );
  }
  console.log('[Test DB Setup] Test DB snapshots verified');

  // 2. Memory server should already be started in jest.server-setup.js
  // The URI is stored in the environment variable, so we just verify it's set
  if (!process.env.MONGODB_MEMORY_SERVER_URI) {
    throw new Error(
      'MongoDB Memory Server not started. It should be started in jest.server-setup.js before Next.js server starts.'
    );
  }

  // Store the URI for reference (it's already in process.env)
  memoryServerUri = process.env.MONGODB_MEMORY_SERVER_URI;
  console.log(`[Test DB Setup] MongoDB Memory Server verified at ${memoryServerUri}`);
};

/**
 * Teardown test database environment
 * - Stops MongoDB Memory Server
 * - Clears environment variable
 */
export const teardownTestDB = async (): Promise<void> => {
  console.log('[Test DB Teardown] Stopping MongoDB Memory Server...');
  await stopMongoMemoryServer();
  memoryServerUri = null;
  delete process.env.MONGODB_MEMORY_SERVER_URI;
  console.log('[Test DB Teardown] MongoDB Memory Server stopped');
};

/**
 * Seed memory server with data from test database
 * Copies teams and games for all supported conferences from test DB snapshots
 * NOTE: Currently unused - tests seed via API calls instead
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const seedMemoryServerFromTestDB = async (): Promise<void> => {
  try {
    // CRITICAL: Establish connection to memory server BEFORE using Team/Game models
    // The Team and Game models use the default mongoose connection (from lib/mongodb.ts)
    // which connects to the memory server in test mode
    console.log('[Test DB Seed] Establishing connection to memory server...');
    await dbConnect();
    console.log('[Test DB Seed] Memory server connection established');

    // Connect to test database (separate connection for reading test data)
    const testConnection = await dbConnectTest();

    // Get models bound to test connection for reading
    const TestTeam = testConnection.models.Team || Team;
    const TestGame = testConnection.models.Game || Game;

    // Get all supported conference IDs
    const conferenceIds = SUPPORTED_SPORTS_CONFS.map(({ conf }) =>
      CONFERENCE_METADATA[conf].espnId.toString()
    );
    console.log(
      `[Test DB Seed] Looking for teams with conferenceId in: ${conferenceIds.join(', ')}`
    );

    // 1. Read teams from test DB for all supported conferences
    const testTeams = await TestTeam.find({
      conferenceId: { $in: conferenceIds },
    })
      .lean()
      .exec();

    console.log(`[Test DB Seed] Found ${testTeams.length} teams in test database`);

    if (testTeams.length > 0) {
      // Insert into memory server using the Team model (which uses main/memory connection)
      // dbConnect() was called above, so connection should be ready
      await Team.insertMany(testTeams);
      console.log(`[Test DB Seed] Inserted ${testTeams.length} teams into memory server`);
    } else {
      console.log('[Test DB Seed] WARNING: No teams found in test database to seed');
    }

    // 2. Copy games (for current season)
    const currentSeason = new Date().getFullYear();
    const testGames = await TestGame.find({
      season: currentSeason,
      conferenceGame: true,
      league: 'college-football',
    })
      .lean()
      .exec();

    // Filter to only conference games (games where both teams are in supported conferences)
    const supportedTeamIds = new Set(testTeams.map((t) => t._id));
    const conferenceGames = testGames.filter(
      (game) =>
        supportedTeamIds.has(game.home.teamEspnId) && supportedTeamIds.has(game.away.teamEspnId)
    );

    if (conferenceGames.length > 0) {
      // Insert into memory server using the Game model (which uses main/memory connection)
      // dbConnect() was called above, so connection should be ready
      await Game.insertMany(conferenceGames);
      console.log(
        `[Test DB Seed] Inserted ${conferenceGames.length} conference games into memory server`
      );
    }
  } catch (error) {
    console.error('[Test DB Seed] Error seeding memory server:', error);
    throw error;
  }
};

/**
 * Clear all collections in memory server
 * Call this in beforeEach() to ensure clean state between tests
 * Note: Tests that need data should seed via API calls (pull-teams/pull-games)
 * rather than relying on test database seeding, as the test database only contains
 * ESPN API snapshots, not teams/games data
 */
export const clearTestDB = async (): Promise<void> => {
  // Ensure connection is established before clearing
  await dbConnect();
  await clearMongoMemoryServerData();
};

/**
 * Get the memory server URI (for debugging)
 */
export const getTestDBUri = (): string => {
  if (!memoryServerUri) {
    throw new Error('MongoDB Memory Server not started. Call setupTestDB() first.');
  }
  return memoryServerUri;
};
