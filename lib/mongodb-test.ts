import mongoose from 'mongoose';

const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_APP_NAME = process.env.MONGODB_APP_NAME;

if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_HOST || !MONGODB_APP_NAME) {
  throw new Error(
    'Please define MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, and MONGODB_APP_NAME environment variables'
  );
}

const TEST_DB_NAME = 'test';
const TEST_MONGODB_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${TEST_DB_NAME}?appName=${MONGODB_APP_NAME}`;

// eslint-disable-next-line no-console -- Allow DB connection logging
console.log(`[MongoDB Test] Connecting to test database: ${TEST_DB_NAME}`);

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

const cached: MongooseCache = { conn: null, promise: null };

const dbConnectTest = async (): Promise<mongoose.Connection> => {
  console.log('[MongoDB Test] dbConnectTest() called');
  if (cached.conn) {
    console.log('[MongoDB Test] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[MongoDB Test] No cached promise, creating new connection...');
    console.log(`[MongoDB Test] Connecting to test database: ${TEST_DB_NAME}`);
    cached.promise = mongoose
      .createConnection(TEST_MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .asPromise();
    console.log('[MongoDB Test] Connection promise created');
  } else {
    console.log('[MongoDB Test] Using existing connection promise');
  }

  try {
    console.log('[MongoDB Test] Waiting for connection promise to resolve...');
    cached.conn = await cached.promise;
    console.log(`[MongoDB Test] Connection established (readyState: ${cached.conn.readyState})`);
  } catch (e) {
    console.error(`[MongoDB Test] Connection error: ${e instanceof Error ? e.message : String(e)}`);
    cached.promise = null;
    throw e;
  }

  console.log('[MongoDB Test] dbConnectTest() complete');
  return cached.conn;
};

export const dbDisconnectTest = async (): Promise<void> => {
  console.log('[MongoDB Test] dbDisconnectTest() called');
  if (cached.conn) {
    console.log(`[MongoDB Test] Closing connection (readyState: ${cached.conn.readyState})...`);
    await cached.conn.close();
    cached.conn = null;
    cached.promise = null;
    console.log('[MongoDB Test] Connection closed and cache cleared');
  } else {
    console.log('[MongoDB Test] No connection to close');
  }
  console.log('[MongoDB Test] dbDisconnectTest() complete');
};

export default dbConnectTest;
