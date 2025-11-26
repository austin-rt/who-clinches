import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;
let isConnected = false;

export const startMongoMemoryServer = async () => {
  console.log('[MongoDB Memory Server] startMongoMemoryServer() called');
  if (mongoServer) {
    const uri = mongoServer.getUri();
    console.log(`[MongoDB Memory Server] Memory server already exists, returning URI: ${uri}`);
    return uri;
  }

  console.log('[MongoDB Memory Server] Creating new MongoMemoryServer...');
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  console.log(`[MongoDB Memory Server] MongoMemoryServer created, URI: ${mongoUri}`);

  if (mongoose.connection.readyState !== 1) {
    console.log(`[MongoDB Memory Server] Connecting mongoose (readyState: ${mongoose.connection.readyState})...`);
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log(`[MongoDB Memory Server] Mongoose connected (readyState: ${mongoose.connection.readyState})`);
  } else {
    console.log('[MongoDB Memory Server] Mongoose already connected');
  }

  console.log('[MongoDB Memory Server] startMongoMemoryServer() complete');
  return mongoUri;
};

export const stopMongoMemoryServer = async () => {
  console.log('[MongoDB Memory Server] stopMongoMemoryServer() called');
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log(`[MongoDB Memory Server] Disconnecting mongoose (readyState: ${mongoose.connection.readyState})...`);
    await mongoose.disconnect();
    isConnected = false;
    console.log('[MongoDB Memory Server] Mongoose disconnected');
  } else {
    console.log(`[MongoDB Memory Server] Mongoose not connected (isConnected: ${isConnected}, readyState: ${mongoose.connection.readyState})`);
  }

  if (mongoServer) {
    console.log('[MongoDB Memory Server] Stopping MongoMemoryServer...');
    await mongoServer.stop();
    mongoServer = null;
    console.log('[MongoDB Memory Server] MongoMemoryServer stopped');
  } else {
    console.log('[MongoDB Memory Server] No MongoMemoryServer to stop');
  }
  console.log('[MongoDB Memory Server] stopMongoMemoryServer() complete');
};

export const clearMongoMemoryServerData = async () => {
  console.log('[MongoDB Memory Server] clearMongoMemoryServerData() called');
  const readyState = mongoose.connection.readyState;
  console.log(`[MongoDB Memory Server] Connection readyState: ${readyState}`);
  if (readyState !== 1) {
    throw new Error(
      `Cannot clear MongoDB Memory Server data: connection not ready. ReadyState: ${readyState}`
    );
  }
  const collections = mongoose.connection.collections;
  const collectionNames = Object.keys(collections);
  console.log(`[MongoDB Memory Server] Found ${collectionNames.length} collections to clear`);
  for (const key of collectionNames) {
    console.log(`[MongoDB Memory Server] Clearing collection: ${key}...`);
    const collection = collections[key];
    const result = await collection.deleteMany({});
    console.log(`[MongoDB Memory Server] Cleared ${result.deletedCount} documents from ${key}`);
  }
  console.log('[MongoDB Memory Server] clearMongoMemoryServerData() complete');
};

export const getMongoMemoryServerUri = (): string => {
  if (!mongoServer) {
    throw new Error('MongoDB Memory Server not started. Call startMongoMemoryServer() first.');
  }
  return mongoServer.getUri();
};

export const insertTestData = async <T extends Record<string, unknown>>(
  collectionName: string,
  data: T | T[]
): Promise<mongoose.mongo.InsertManyResult | mongoose.mongo.InsertOneResult> => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB not connected');
  }

  const collection = db.collection(collectionName);
  const result = Array.isArray(data)
    ? await collection.insertMany(data as mongoose.mongo.BSON.Document[])
    : await collection.insertOne(data as mongoose.mongo.BSON.Document);

  return result;
};

export const queryTestData = async <T = Record<string, unknown>>(
  collectionName: string,
  filter: Record<string, unknown> = {}
): Promise<T[]> => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB not connected');
  }

  const collection = db.collection(collectionName);
  return (await collection.find(filter).toArray()) as T[];
};

export const countTestData = async (
  collectionName: string,
  filter: Record<string, unknown> = {}
): Promise<number> => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB not connected');
  }

  const collection = db.collection(collectionName);
  return await collection.countDocuments(filter);
};

export const setupMongoTestEnv = async () => {
  await clearMongoMemoryServerData();
};

export const teardownMongoTestEnv = async () => {
  await clearMongoMemoryServerData();
};
