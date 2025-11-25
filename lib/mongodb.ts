import mongoose from 'mongoose';

// Build MongoDB URI dynamically from environment variables
// Validation is done lazily in getMongoDBUri() to avoid issues during Next.js module evaluation

const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_APP_NAME = process.env.MONGODB_APP_NAME;

// Determine database name from environment
// Priority: MONGODB_DB (explicit) > VERCEL_ENV (Vercel deployments)
const MONGODB_DB = process.env.MONGODB_DB || process.env.VERCEL_ENV;

// Build MongoDB URI - use memory server in test mode, otherwise use Atlas
// Validation happens here (lazy) to avoid issues during Next.js module evaluation
const getMongoDBUri = (): string => {
  // In test mode, use MongoDB Memory Server if available
  const isTestWithMemoryServer =
    process.env.NODE_ENV === 'test' && process.env.MONGODB_MEMORY_SERVER_URI;

  if (isTestWithMemoryServer) {
    return process.env.MONGODB_MEMORY_SERVER_URI!;
  }

  // Otherwise use MongoDB Atlas - validate credentials now (lazy validation)
  if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_HOST || !MONGODB_APP_NAME) {
    throw new Error(
      'Please define MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, and MONGODB_APP_NAME environment variables'
    );
  }

  // Require MONGODB_DB to be set locally (when not on Vercel)
  if (!MONGODB_DB && !process.env.VERCEL_ENV) {
    throw new Error('Please define MONGODB_DB environment variable for local development');
  }

  if (!MONGODB_DB) {
    throw new Error('Unable to determine database name from environment');
  }

  return `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}`;
};

const logConnection = () => {
  /* eslint-disable no-console */
  if (process.env.NODE_ENV === 'test' && process.env.MONGODB_MEMORY_SERVER_URI) {
    console.log(`[MongoDB] Connecting to in-memory test database`);
  } else {
    console.log(`[MongoDB] Connecting to database: ${MONGODB_DB}`);
  }
  /* eslint-enable no-console */
};

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global cache to persist across hot reloads in development (industry standard pattern)
declare global {
  // eslint-disable-next-line no-var
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
    console.log(`[MongoDB] Connection established (readyState: ${cached.conn.connection.readyState})`);
  } catch (e) {
    console.error(`[MongoDB] Connection error: ${e instanceof Error ? e.message : String(e)}`);
    cached.promise = null;
    throw e;
  }

  console.log('[MongoDB] dbConnect() complete');
  return cached.conn;
};

export default dbConnect;
