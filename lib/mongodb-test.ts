import mongoose from 'mongoose';

/**
 * Test Database Connection
 * 
 * Hardcoded connection to /test database for storing ESPN API test data snapshots.
 * Separate from main application database to keep test data isolated.
 */

// Build MongoDB URI for test database
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_APP_NAME = process.env.MONGODB_APP_NAME;

if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_HOST || !MONGODB_APP_NAME) {
  throw new Error(
    'Please define MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, and MONGODB_APP_NAME environment variables'
  );
}

// Hardcoded test database name
const TEST_DB_NAME = 'test';
const TEST_MONGODB_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${TEST_DB_NAME}?appName=${MONGODB_APP_NAME}`;

// eslint-disable-next-line no-console -- Allow DB connection logging
console.log(`[MongoDB Test] Connecting to test database: ${TEST_DB_NAME}`);

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

// Use a module-level cache for test database connection
const cached: MongooseCache = { conn: null, promise: null };

const dbConnectTest = async (): Promise<mongoose.Connection> => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.createConnection(TEST_MONGODB_URI, {
      bufferCommands: false,
    }).asPromise();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default dbConnectTest;

