const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { startNextDevServer } = require('./lib/helpers/nextjs-dev-server');

const SERVER_PID_FILE = path.join(__dirname, '.jest-server.pid');
const SERVER_URL = 'http://localhost:3000';

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// MongoDB Memory Server - use the helper from mongodb-memory-server.mock.ts
// We'll import it dynamically to avoid ES module issues
async function startMongoMemoryServer() {
  console.log('[Jest Server Setup] startMongoMemoryServer() called');
  console.log('[Jest Server Setup] Importing mongodb-memory-server.mock...');
  const { startMongoMemoryServer: startServer } = await import(
    './__tests__/mocks/mongodb-memory-server.mock.ts'
  );
  console.log('[Jest Server Setup] Calling startServer() from mock...');
  const uri = await startServer();
  console.log(`[Jest Server Setup] startMongoMemoryServer() complete, URI: ${uri}`);
  return uri;
}

async function seedMemoryServerFromTestDB(memoryServerUri) {
  console.log('[Jest Server Setup] seedMemoryServerFromTestDB() called');
  console.log('[Jest Server Setup] Seeding memory server from Atlas /test database...');

  let testConnection = null;
  let memoryConnection = null;

  try {
    console.log('[Jest Server Setup] Connecting to Atlas /test database...');
    const { default: dbConnectTest } = await import('./lib/mongodb-test');
    testConnection = await dbConnectTest();
    console.log('[Jest Server Setup] Connected to Atlas /test database');

    // Connect to memory server directly (NODE_ENV not set to 'test' yet, so use direct connection)
    console.log('[Jest Server Setup] Connecting to memory server...');
    const mongoose = await import('mongoose');
    memoryConnection = await mongoose.default.createConnection(memoryServerUri, {
      bufferCommands: false,
    });
    console.log('[Jest Server Setup] Connected to memory server');

    const collections = [
      'espn_scoreboard_test_data',
      'espn_game_summary_test_data',
      'espn_team_test_data',
      'espn_team_records_test_data',
    ];

    let totalSeeded = 0;

    for (const collectionName of collections) {
      console.log(`[Jest Server Setup] Processing collection: ${collectionName}`);
      const testCollection = testConnection.db.collection(collectionName);
      console.log(`[Jest Server Setup] Reading documents from ${collectionName}...`);
      const documents = await testCollection.find({}).toArray();
      console.log(`[Jest Server Setup] Found ${documents.length} documents in ${collectionName}`);

      if (documents.length > 0) {
        const memoryCollection = memoryConnection.db.collection(collectionName);
        console.log(
          `[Jest Server Setup] Inserting ${documents.length} documents into memory server ${collectionName}...`
        );
        await memoryCollection.insertMany(documents);
        totalSeeded += documents.length;
        console.log(
          `[Jest Server Setup] Seeded ${documents.length} documents from ${collectionName}`
        );
      } else {
        console.log(`[Jest Server Setup] No documents found in ${collectionName}`);
      }
    }

    console.log(`[Jest Server Setup] Seeding complete. Total documents seeded: ${totalSeeded}`);

    // Close memory server connection (dbConnect() will create its own connection later)
    console.log('[Jest Server Setup] Closing memory server connection...');
    await memoryConnection.close();
    console.log('[Jest Server Setup] Memory server connection closed');
    console.log('[Jest Server Setup] seedMemoryServerFromTestDB() complete');
  } catch (error) {
    console.error(`[Jest Server Setup] Error seeding memory server: ${error.message}`);
    console.error(`[Jest Server Setup] Stack: ${error.stack}`);
    if (memoryConnection) {
      try {
        await memoryConnection.close();
      } catch (closeError) {
        console.log(
          `[Jest Server Setup] Error closing memory server connection: ${closeError.message}`
        );
      }
    }
    throw error;
  }
}

module.exports = async () => {
  console.log('[Jest Server Setup] ===== GLOBAL SETUP START =====');
  console.log('[Jest Server Setup] Starting server lifecycle management...');

  try {
    // Start MongoDB Memory Server BEFORE starting Next.js server
    // This ensures MONGODB_MEMORY_SERVER_URI is set when Next.js loads lib/mongodb.ts
    console.log('[Jest Server Setup] Step 1: Starting MongoDB Memory Server...');
    const memoryServerUri = await startMongoMemoryServer();
    console.log(
      `[Jest Server Setup] Step 1: MongoDB Memory Server started, URI: ${memoryServerUri}`
    );
    process.env.MONGODB_MEMORY_SERVER_URI = memoryServerUri;
    console.log(`[Jest Server Setup] Step 1: MONGODB_MEMORY_SERVER_URI environment variable set`);
    console.log(`[Jest Server Setup] Step 1: MongoDB Memory Server ready at ${memoryServerUri}`);

    console.log('[Jest Server Setup] Step 2: Seeding memory server from Atlas /test database...');
    await seedMemoryServerFromTestDB(memoryServerUri);
    console.log('[Jest Server Setup] Step 2: Seeding complete');

    // Start Next.js dev server (will kill existing and start new one for tests)
    console.log('[Jest Server Setup] Step 3: Starting Next.js dev server...');
    const result = await startNextDevServer({
      url: SERVER_URL,
      pidFile: SERVER_PID_FILE,
      nodeEnv: 'test',
      env: {
        MONGODB_MEMORY_SERVER_URI: memoryServerUri,
      },
      killExisting: true,
      waitForReady: true,
      logPrefix: '[Jest Server Setup]',
    });
    console.log('[Jest Server Setup] Step 3: Next.js dev server started');

    console.log(
      `[Jest Server Setup] Server ready at ${SERVER_URL} (PID: ${result.pid}, wasAlreadyRunning: ${result.wasAlreadyRunning})`
    );
    console.log('[Jest Server Setup] ===== GLOBAL SETUP COMPLETE =====');
  } catch (error) {
    console.error(`[Jest Server Setup] ===== GLOBAL SETUP ERROR =====`);
    console.error(`[Jest Server Setup] Error: ${error.message}`);
    console.error(`[Jest Server Setup] Stack: ${error.stack}`);
    throw error;
  }
};
