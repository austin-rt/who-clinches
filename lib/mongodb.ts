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

// Use a module-level cache instead of global
const cached: MongooseCache = { conn: null, promise: null };

const dbConnect = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    logConnection();
    const opts = {
      bufferCommands: false,
    };

    const mongoUri = getMongoDBUri();
    cached.promise = mongoose.connect(mongoUri, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default dbConnect;
