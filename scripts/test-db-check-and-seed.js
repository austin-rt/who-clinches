#!/usr/bin/env node

/**
 * Test Database Check and Seed Script
 *
 * Checks if test data snapshots are seeded in the /test database.
 * If empty, automatically seeds via cron endpoint.
 * This runs before reshape unit tests to ensure test DB is ready.
 *
 * Usage:
 *   node scripts/test-db-check-and-seed.js
 *   npm run test:db:check
 */

const fs = require('fs');
const path = require('path');

// Load .env.local - fail if it doesn't exist
const envFile = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envFile)) {
  console.error('[ERROR] Environment file not found: .env.local');
  console.error('  Test database seeding requires .env.local');
  process.exit(1);
}

try {
  require('dotenv').config({ path: envFile });
} catch (e) {
  console.error('[ERROR] Failed to load environment file: .env.local');
  console.error(e.message);
  process.exit(1);
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || '';
const MONGODB_USER = process.env.MONGODB_USER || '';
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || '';
const MONGODB_HOST = process.env.MONGODB_HOST || 'cluster0.rr6gggn.mongodb.net';
const MONGODB_APP_NAME = process.env.MONGODB_APP_NAME || 'SEC-Tiebreaker';
const TEST_DB_NAME = 'test';

const mongoUri = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${TEST_DB_NAME}?appName=${MONGODB_APP_NAME}`;

console.log('================================================');
console.log('SEC Tiebreaker Test Database Check & Seed');
console.log('================================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Database: ${TEST_DB_NAME}`);
console.log('');

// Validate required environment variables - fail if missing
if (!CRON_SECRET) {
  console.error('[ERROR] CRON_SECRET not found in .env.local');
  console.error('  Required for test data seeding');
  process.exit(1);
}

if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_HOST || !MONGODB_APP_NAME) {
  console.error('[ERROR] MongoDB credentials not found in .env.local');
  console.error('  Required: MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST, MONGODB_APP_NAME');
  process.exit(1);
}


/**
 * Check MongoDB connection
 */
async function checkMongoDB() {
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(mongoUri);
    await client.connect();
    await client.db().admin().ping();
    await client.close();
    return true;
  } catch (error) {
    console.error('[ERROR] MongoDB connection failed:');
    console.error(error.message);
    return false;
  }
}

/**
 * Check if test data exists in test database
 */
async function checkTestData() {
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(TEST_DB_NAME);

    const collections = [
      'espn_scoreboard_test_data',
      'espn_game_summary_test_data',
      'espn_team_test_data',
      'espn_team_records_test_data',
    ];

    const results = {};
    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments({ season: 2025 });
      results[collectionName] = count;
    }

    await client.close();

    const allPresent = Object.values(results).every((count) => count > 0);
    return { allPresent, results };
  } catch (error) {
    console.error('[ERROR] Test data check failed:');
    console.error(error.message);
    return { allPresent: false, results: {} };
  }
}

/**
 * Seed test data via cron endpoint
 */
async function seedTestData() {
  console.log('Seeding test data via /api/cron/update-test-data...');
  try {
    const response = await fetch(`${BASE_URL}/api/cron/update-test-data`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to seed test data: ${response.status} ${response.statusText} - ${text}`
      );
    }

    const data = await response.json();
    console.log(`[OK] Test data seeded successfully`);
    console.log(`  Updated: ${data.updated || data.total || 'N/A'}`);
    console.log(`  Total: ${data.total || 'N/A'}`);
    return true;
  } catch (error) {
    console.error('[ERROR] Test data seeding failed:');
    console.error(error.message);
    return false;
  }
}

/**
 * Main execution flow
 */
async function main() {
  try {
    // Step 1: Check MongoDB connection
    console.log('Step 1: Checking MongoDB connection...');
    if (!(await checkMongoDB())) {
      process.exit(1);
    }
    console.log('[OK] MongoDB connection successful');

    // Step 2: Check if test data is seeded
    console.log('');
    console.log('Step 2: Checking if test data is seeded...');
    const { allPresent, results } = await checkTestData();

    if (allPresent) {
      console.log('[OK] All test data collections have data:');
      Object.entries(results).forEach(([collection, count]) => {
        console.log(`  ${collection}: ${count} document(s)`);
      });
    } else {
      console.log('[INFO] Missing test data in some collections:');
      Object.entries(results).forEach(([collection, count]) => {
        const status = count > 0 ? '[OK]' : '[MISSING]';
        console.log(`  ${status} ${collection}: ${count} document(s)`);
      });
      console.log('');
      console.log('Seeding test data...');
      if (!(await seedTestData())) {
        process.exit(1);
      }
      // Wait for data to be written (MongoDB writes can take a moment)
      await new Promise((resolve) => setTimeout(resolve, 5000));
      // Verify after seeding
      const { allPresent: verifyPresent } = await checkTestData();
      if (!verifyPresent) {
        console.error('[ERROR] Test data seeding completed but verification failed');
        console.error('  Some collections may still be empty');
        process.exit(1);
      }
      console.log('[OK] Test data verification successful');
    }

    // Success
    console.log('');
    console.log('================================================');
    console.log('[OK] Test database ready for testing');
    console.log('================================================');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('[ERROR] Test database check failed:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
