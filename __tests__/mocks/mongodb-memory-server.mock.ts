/**
 * MongoDB Memory Server Setup
 *
 * Provides isolated in-memory MongoDB for each test suite.
 * Ensures tests don't interfere with each other or production data.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;
let isConnected = false;

/**
 * Start in-memory MongoDB server
 * Call in beforeAll() hook
 */
export async function startMongoMemoryServer() {
  if (mongoServer) {
    return mongoServer.getUri();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri);
    isConnected = true;
  }

  return mongoUri;
}

/**
 * Stop in-memory MongoDB server
 * Call in afterAll() hook
 */
export async function stopMongoMemoryServer() {
  if (isConnected && mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    isConnected = false;
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

/**
 * Clear all collections
 * Call in beforeEach() to ensure clean state
 */
export async function clearMongoMemoryServerData() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

/**
 * Get current MongoDB connection URI
 */
export function getMongoMemoryServerUri(): string {
  if (!mongoServer) {
    throw new Error('MongoDB Memory Server not started. Call startMongoMemoryServer() first.');
  }
  return mongoServer.getUri();
}

/**
 * Insert test data into MongoDB
 */
export async function insertTestData<T extends Record<string, unknown>>(
  collectionName: string,
  data: T | T[]
): Promise<mongoose.mongo.InsertManyResult | mongoose.mongo.InsertOneResult> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB not connected');
  }

  const collection = db.collection(collectionName);
  const result = Array.isArray(data)
    ? await collection.insertMany(data as mongoose.mongo.BSON.Document[])
    : await collection.insertOne(data as mongoose.mongo.BSON.Document);

  return result;
}

/**
 * Query test data from MongoDB
 */
export async function queryTestData<T = Record<string, unknown>>(
  collectionName: string,
  filter: Record<string, unknown> = {}
): Promise<T[]> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB not connected');
  }

  const collection = db.collection(collectionName);
  return (await collection.find(filter).toArray()) as T[];
}

/**
 * Count documents in collection
 */
export async function countTestData(
  collectionName: string,
  filter: Record<string, unknown> = {}
): Promise<number> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB not connected');
  }

  const collection = db.collection(collectionName);
  return await collection.countDocuments(filter);
}

/**
 * Setup helper for test suites
 * Usage in beforeEach():
 *   await setupMongoTestEnv();
 */
export async function setupMongoTestEnv() {
  await clearMongoMemoryServerData();
}

/**
 * Teardown helper for test suites
 * Usage in afterEach():
 *   await teardownMongoTestEnv();
 */
export async function teardownMongoTestEnv() {
  await clearMongoMemoryServerData();
}
