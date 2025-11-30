import { stopMongoMemoryServer } from '../mocks/mongodb-memory-server.mock';
import { checkTestDataAvailable } from './test-data-loader';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

let memoryServerUri: string | null = null;

export const setupTestDB = async (): Promise<void> => {
  console.log('[Test DB Setup] ===== setupTestDB() START =====');
  process.stdout.write('[setupTestDB] Starting...\n');
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

  console.log('[Test DB Setup] Step 2: Verifying MongoDB Memory Server is started...');
  if (!process.env.MONGODB_MEMORY_SERVER_URI) {
    console.error('[Test DB Setup] ERROR: MONGODB_MEMORY_SERVER_URI not set');
    throw new Error(
      'MongoDB Memory Server not started. It should be started in jest.server-setup.js before Next.js server starts.'
    );
  }

  memoryServerUri = process.env.MONGODB_MEMORY_SERVER_URI;
  console.log(`[Test DB Setup] Step 2: MongoDB Memory Server verified at ${memoryServerUri}`);
  process.stdout.write(`[Test DB Setup] MongoDB Memory Server verified at ${memoryServerUri}\n`);
  console.log('[Test DB Setup] ===== setupTestDB() COMPLETE =====');
  process.stdout.write('[setupTestDB] Complete\n');
};

export const teardownTestDB = async (): Promise<void> => {
  console.log('[Test DB Teardown] ===== teardownTestDB() START =====');
  console.log('[Test DB Teardown] Stopping MongoDB Memory Server...');
  await stopMongoMemoryServer();
  memoryServerUri = null;
  delete process.env.MONGODB_MEMORY_SERVER_URI;
  console.log('[Test DB Teardown] MongoDB Memory Server stopped');
  console.log('[Test DB Teardown] ===== teardownTestDB() COMPLETE =====');
};

export const clearTestDB = async (): Promise<void> => {
  console.log('[Test DB Setup] ===== clearTestDB() START =====');
  process.stdout.write('[clearTestDB] Starting...\n');
  console.log('[Test DB Setup] Establishing database connection...');
  await dbConnect();
  console.log('[Test DB Setup] Database connection established');
  process.stdout.write('[clearTestDB] Connection established\n');
  
  const preservedCollections = [
    'espn_scoreboard_test_data',
    'espn_game_summary_test_data',
    'espn_team_test_data',
    'espn_team_records_test_data',
  ];
  
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

export const getTestDBUri = (): string => {
  if (!memoryServerUri) {
    throw new Error('MongoDB Memory Server not started. Call setupTestDB() first.');
  }
  return memoryServerUri;
};
