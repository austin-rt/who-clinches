/**
 * Database Mock Setup Helper
 *
 * Sets up MongoDB Memory Server for main database in integration tests.
 * This ensures tests don't write to real databases while still testing
 * full database operations.
 */

/* eslint-disable no-console */

import { stopMongoMemoryServer } from '../mocks/mongodb-memory-server.mock';
import { checkTestDataAvailable } from './test-data-loader';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

let memoryServerUri: string | null = null;

/**
 * Setup test database environment
 * - Verifies MongoDB Memory Server is already running (started in jest.server-setup.js)
 * - Verifies test DB snapshots are available (for ESPN client mocks)
 * - This is called in beforeAll() hooks to ensure everything is ready
 * - Note: Memory server is started in jest.server-setup.js BEFORE Next.js server starts
 */
export const setupTestDB = async (): Promise<void> => {
  console.log('[Test DB Setup] ===== setupTestDB() START =====');
  process.stdout.write('[setupTestDB] Starting...\n');
  // 1. Verify test DB snapshots are available (for ESPN client mocks)
  console.log('[Test DB Setup] Step 1: Verifying test DB snapshots are available...');
  process.stdout.write('[Test DB Setup] Verifying test DB snapshots are available...\n');
  const testDataCheck = await checkTestDataAvailable();
  console.log(`[Test DB Setup] Test data check result: available=${testDataCheck.available}, missing=${testDataCheck.missing.join(',') || 'none'}`);
  process.stdout.write(`[Test DB Setup] Test data check result: available=${testDataCheck.available}, missing=${testDataCheck.missing.join(',') || 'none'}\n`);
  if (!testDataCheck.available) {
    console.error(`[Test DB Setup] ERROR: Missing test data types: ${testDataCheck.missing.join(',')}`);
    throw new Error(
      `TEST_DATA_ERROR | ENTITY:TestData | ISSUE:missing_snapshots | MISSING_TYPES:${testDataCheck.missing.join(',')} | EXPECTED:all_test_data_available | ACTUAL:missing_types | NOTE:Run 'npm run test:db:check' to populate test data snapshots`
    );
  }
  console.log('[Test DB Setup] Step 1: Test DB snapshots verified');
  process.stdout.write('[Test DB Setup] Test DB snapshots verified\n');

  // 2. Memory server should already be started in jest.server-setup.js
  // The URI is stored in the environment variable, so we just verify it's set
  console.log('[Test DB Setup] Step 2: Verifying MongoDB Memory Server is started...');
  if (!process.env.MONGODB_MEMORY_SERVER_URI) {
    console.error('[Test DB Setup] ERROR: MONGODB_MEMORY_SERVER_URI not set');
    throw new Error(
      'MongoDB Memory Server not started. It should be started in jest.server-setup.js before Next.js server starts.'
    );
  }

  // Store the URI for reference (it's already in process.env)
  memoryServerUri = process.env.MONGODB_MEMORY_SERVER_URI;
  console.log(`[Test DB Setup] Step 2: MongoDB Memory Server verified at ${memoryServerUri}`);
  process.stdout.write(`[Test DB Setup] MongoDB Memory Server verified at ${memoryServerUri}\n`);
  console.log('[Test DB Setup] ===== setupTestDB() COMPLETE =====');
  process.stdout.write('[setupTestDB] Complete\n');
};

/**
 * Teardown test database environment
 * - Stops MongoDB Memory Server
 * - Clears environment variable
 */
export const teardownTestDB = async (): Promise<void> => {
  console.log('[Test DB Teardown] ===== teardownTestDB() START =====');
  console.log('[Test DB Teardown] Stopping MongoDB Memory Server...');
  await stopMongoMemoryServer();
  memoryServerUri = null;
  delete process.env.MONGODB_MEMORY_SERVER_URI;
  console.log('[Test DB Teardown] MongoDB Memory Server stopped');
  console.log('[Test DB Teardown] ===== teardownTestDB() COMPLETE =====');
};

/**
 * Clear all collections in memory server EXCEPT ESPN test data collections
 * Call this in beforeEach() to ensure clean state between tests
 * Note: ESPN test data collections are preserved since they're seeded once at startup
 */
export const clearTestDB = async (): Promise<void> => {
  console.log('[Test DB Setup] ===== clearTestDB() START =====');
  process.stdout.write('[clearTestDB] Starting...\n');
  // Ensure connection is established before clearing
  console.log('[Test DB Setup] Establishing database connection...');
  await dbConnect();
  console.log('[Test DB Setup] Database connection established');
  process.stdout.write('[clearTestDB] Connection established\n');
  
  // ESPN test data collections to preserve (seeded once at startup)
  const preservedCollections = [
    'espn_scoreboard_test_data',
    'espn_game_summary_test_data',
    'espn_team_test_data',
    'espn_team_records_test_data',
  ];
  
  // Clear all collections except ESPN test data
  const collections = mongoose.connection.collections;
  const collectionNames = Object.keys(collections);
  console.log(`[Test DB Setup] Found ${collectionNames.length} collections`);
  process.stdout.write(`[clearTestDB] Found ${collectionNames.length} collections\n`);
  let clearedCount = 0;
  for (const key of collectionNames) {
    if (!preservedCollections.includes(key)) {
      console.log(`[Test DB Setup] Clearing collection: ${key}...`);
      process.stdout.write(`[clearTestDB] Clearing collection: ${key}\n`);
      const collection = collections[key];
      const result = await collection.deleteMany({});
      console.log(`[Test DB Setup] Cleared ${result.deletedCount} documents from ${key}`);
      clearedCount++;
    } else {
      console.log(`[Test DB Setup] Preserving collection: ${key}`);
      process.stdout.write(`[clearTestDB] Preserving collection: ${key}\n`);
    }
  }
  console.log(`[Test DB Setup] Cleared ${clearedCount} collections`);
  process.stdout.write(`[clearTestDB] Complete. Cleared ${clearedCount} collections\n`);
  console.log('[Test DB Setup] ===== clearTestDB() COMPLETE =====');
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
