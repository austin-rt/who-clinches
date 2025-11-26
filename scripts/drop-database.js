#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dbName = args[0];

if (!dbName || !['test', 'dev', 'preview', 'production'].includes(dbName)) {
  console.error('[ERROR] Invalid database name');
  console.error('  Usage: node scripts/drop-database.js [test|dev|preview|production]');
  console.error('  Example: node scripts/drop-database.js dev');
  process.exit(1);
}

const localEnvFile = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(localEnvFile)) {
  console.error(`[ERROR] .env.local file not found`);
  console.error('  Required for database credentials');
  process.exit(1);
}

try {
  require('dotenv').config({ path: localEnvFile });
} catch (e) {
  console.error(`[ERROR] Failed to load .env.local`);
  console.error(e.message);
  process.exit(1);
}

const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_HOST = process.env.MONGODB_HOST || 'cluster0.rr6gggn.mongodb.net';
const MONGODB_APP_NAME = process.env.MONGODB_APP_NAME || 'SEC-Tiebreaker';

if (!MONGODB_USER || !MONGODB_PASSWORD) {
  console.error(`[ERROR] MongoDB write credentials not found in .env.local`);
  console.error('  Required: MONGODB_USER, MONGODB_PASSWORD');
  console.error('  Note: Read-only credentials cannot drop databases');
  process.exit(1);
}

const mongoUri = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${dbName}?appName=${MONGODB_APP_NAME}`;

console.log('================================================');
console.log('SEC Tiebreaker Database Drop');
console.log('================================================');
console.log(`Database: ${dbName}`);
console.log('');
console.log('⚠️  WARNING: This will PERMANENTLY DELETE all data in this database!');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function dropDatabase() {
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(mongoUri);

    await client.connect();
    console.log(`[INFO] Connected to MongoDB`);

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log(`[INFO] Database '${dbName}' is already empty`);
      await client.close();
      return;
    }

    console.log(`[INFO] Found ${collections.length} collection(s) in '${dbName}'`);
    console.log(`[INFO] Dropping database '${dbName}'...`);

    await db.dropDatabase();

    console.log(`[OK] Database '${dbName}' dropped successfully`);

    await client.close();
  } catch (error) {
    console.error(`[ERROR] Failed to drop database '${dbName}':`);
    console.error(error.message);
    process.exit(1);
  }
}

rl.question('Type "drop" to confirm database deletion: ', (answer) => {
  if (answer.toLowerCase() === 'drop') {
    rl.close();
    dropDatabase();
  } else {
    console.log('[CANCELLED] Database drop cancelled. No changes made.');
    rl.close();
    process.exit(0);
  }
});
