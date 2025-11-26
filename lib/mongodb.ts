/* eslint-disable no-console */
import mongoose from 'mongoose';

const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_APP_NAME = process.env.MONGODB_APP_NAME;

const MONGODB_DB = process.env.MONGODB_DB || process.env.VERCEL_ENV;

const getMongoDBUri = (): string => {
  const isTestWithMemoryServer =
    process.env.NODE_ENV === 'test' && process.env.MONGODB_MEMORY_SERVER_URI;

  if (isTestWithMemoryServer) {
    return process.env.MONGODB_MEMORY_SERVER_URI!;
  }

  if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_HOST || !MONGODB_APP_NAME) {
    throw new Error(
      'Please define MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, and MONGODB_APP_NAME environment variables'
    );
  }

  if (!MONGODB_DB && !process.env.VERCEL_ENV) {
    throw new Error('Please define MONGODB_DB environment variable for local development');
  }

  if (!MONGODB_DB) {
    throw new Error('Unable to determine database name from environment');
  }

  return `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}`;
};

const logConnection = () => {
  if (process.env.NODE_ENV === 'test' && process.env.MONGODB_MEMORY_SERVER_URI) {
    console.log(`[MongoDB] Connecting to in-memory test database`);
  } else {
    console.log(`[MongoDB] Connecting to database: ${MONGODB_DB}`);
  }
};

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

const dbConnect = async () => {
  console.log('[MongoDB] dbConnect() called');
  if (cached.conn) {
    console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[MongoDB] No cached promise, creating new connection...');
    logConnection();
    const opts = {
      bufferCommands: false,
    };

    const mongoUri = getMongoDBUri();
    console.log(`[MongoDB] Connecting to: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    cached.promise = mongoose.connect(mongoUri, opts);
    console.log('[MongoDB] Connection promise created');
  } else {
    console.log('[MongoDB] Using existing connection promise');
  }

  try {
    console.log('[MongoDB] Waiting for connection promise to resolve...');
    cached.conn = await cached.promise;
    console.log(
      `[MongoDB] Connection established (readyState: ${cached.conn.connection.readyState})`
    );
  } catch (e) {
    console.error(`[MongoDB] Connection error: ${e instanceof Error ? e.message : String(e)}`);
    cached.promise = null;
    throw e;
  }

  console.log('[MongoDB] dbConnect() complete');
  return cached.conn;
};

export default dbConnect;
