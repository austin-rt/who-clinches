import mongoose from "mongoose";

// Build MongoDB URI dynamically from environment variables
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_APP_NAME = process.env.MONGODB_APP_NAME;

// Determine database name from environment
// Priority: MONGODB_DB (explicit) > VERCEL_ENV (Vercel deployments)
const MONGODB_DB = process.env.MONGODB_DB || process.env.VERCEL_ENV;

if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_HOST || !MONGODB_APP_NAME) {
  throw new Error(
    "Please define MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, and MONGODB_APP_NAME environment variables"
  );
}

// Require MONGODB_DB to be set locally (when not on Vercel)
if (!MONGODB_DB && !process.env.VERCEL_ENV) {
  throw new Error(
    "Please define MONGODB_DB environment variable for local development"
  );
}

if (!MONGODB_DB) {
  throw new Error("Unable to determine database name from environment");
}

const MONGODB_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DB}?appName=${MONGODB_APP_NAME}`;

console.log(`[MongoDB] Connecting to database: ${MONGODB_DB}`);

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
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
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
