#!/usr/bin/env node

/**
 * Database Check and Seed Script
 *
 * Checks if teams and games are seeded in the database.
 * If empty, automatically seeds via API endpoints.
 * This runs before tests to ensure DB is ready.
 *
 * Usage:
 *   node scripts/db-check-and-seed.js [--env dev|preview|production]
 *   npm run db:check
 */

const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config();
} catch (e) {
  console.warn('dotenv not available, using process.env');
}

// Parse command line arguments
const args = process.argv.slice(2);
let envName = 'dev';
const envIndex = args.indexOf('--env');
if (envIndex !== -1 && args[envIndex + 1]) {
  envName = args[envIndex + 1];
}

// Try to load specific env file if available
try {
  const envFile = path.join(process.cwd(), `.env.${envName}`);
  if (fs.existsSync(envFile)) {
    require('dotenv').config({ path: envFile });
  } else if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
    require('dotenv').config({ path: '.env.local' });
  }
} catch (e) {
  // dotenv already loaded from root
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DATABASE = process.env.MONGODB_DB || 'dev';
const MONGODB_USER_READONLY = process.env.MONGODB_USER_READONLY || 'readonly';
const MONGODB_PASSWORD_READONLY = process.env.MONGODB_PASSWORD_READONLY || '';
const MONGODB_HOST = process.env.MONGODB_HOST || 'cluster0.rr6gggn.mongodb.net';
const MONGODB_APP_NAME = process.env.MONGODB_APP_NAME || 'SEC-Tiebreaker';

const mongoUri = `mongodb+srv://${MONGODB_USER_READONLY}:${MONGODB_PASSWORD_READONLY}@${MONGODB_HOST}/${DATABASE}?appName=${MONGODB_APP_NAME}`;

console.log('================================================');
console.log('SEC Tiebreaker Database Check & Seed');
console.log('================================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Database: ${DATABASE}`);
console.log('');

/**
 * Fetch helper - simple wrapper around fetch API
 */
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Check if MongoDB is accessible and count documents
 */
async function checkMongoDB() {
  try {
    // Try to import mongoose dynamically
    const mongoose = require('mongoose');

    // Simple count via mongoose
    // Note: In production, we'd use a proper connection pool
    // For now, we'll rely on the API endpoints to seed the DB
    return true;
  } catch (error) {
    console.warn('⚠ MongoDB check skipped (mongoose not available)');
    return false;
  }
}

/**
 * Main execution flow
 */
async function main() {
  try {
    // Step 1: Check if teams are seeded
    console.log('Step 1: Checking if teams are seeded...');
    try {
      const gamesResponse = await fetchAPI(`${BASE_URL}/api/games?limit=1`);
      if (gamesResponse.teams && gamesResponse.teams.length > 0) {
        console.log(`✓ Found ${gamesResponse.teams.length} team(s) in response`);
      } else {
        console.log('ℹ No teams in response, will seed...');
        await seedTeams();
        await sleep(2000);
      }
    } catch (error) {
      console.log('ℹ Teams check failed, attempting to seed...');
      await seedTeams();
      await sleep(2000);
    }

    // Step 2: Check if games are seeded
    console.log('');
    console.log('Step 2: Checking if games are seeded...');
    try {
      const gamesResponse = await fetchAPI(`${BASE_URL}/api/games?season=2025&conferenceId=8&limit=1`);
      if (gamesResponse.events && gamesResponse.events.length > 0) {
        console.log(`✓ Found ${gamesResponse.events.length} game(s) in response`);
      } else {
        console.log('ℹ No games in response, will seed...');
        await seedGames();
        await sleep(2000);
      }
    } catch (error) {
      console.log('ℹ Games check failed, attempting to seed...');
      await seedGames();
      await sleep(2000);
    }

    // Step 3: Verify response structures
    console.log('');
    console.log('Step 3: Verifying API response structures...');
    await verifyGamesResponse();

    console.log('');
    console.log('Step 4: Verifying simulate response structure...');
    await verifySimulateResponse();

    // Success
    console.log('');
    console.log('================================================');
    console.log('✓ Database ready for testing');
    console.log('================================================');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('✗ Database check failed:');
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Seed teams via API
 */
async function seedTeams() {
  console.log('  Seeding teams...');
  try {
    await fetchAPI(`${BASE_URL}/api/pull-teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sport: 'football',
        league: 'college-football',
        conferenceId: 8,
      }),
    });
    console.log('✓ Teams seeded');
  } catch (error) {
    throw new Error(`Failed to seed teams: ${error.message}`);
  }
}

/**
 * Seed games via API
 */
async function seedGames() {
  console.log('  Seeding games...');
  try {
    await fetchAPI(`${BASE_URL}/api/pull-games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sport: 'football',
        league: 'college-football',
        season: 2025,
        conferenceId: 8,
      }),
    });
    console.log('✓ Games seeded');
  } catch (error) {
    throw new Error(`Failed to seed games: ${error.message}`);
  }
}

/**
 * Verify /api/games response structure
 */
async function verifyGamesResponse() {
  try {
    const response = await fetchAPI(`${BASE_URL}/api/games?season=2025&conferenceId=8`);

    if (!response.events || !Array.isArray(response.events)) {
      throw new Error('Missing or invalid events array');
    }
    if (!response.teams || !Array.isArray(response.teams)) {
      throw new Error('Missing or invalid teams array');
    }

    // Check first team has required fields
    if (response.teams.length > 0) {
      const requiredFields = ['id', 'abbrev', 'displayName', 'logo', 'color', 'alternateColor'];
      const team = response.teams[0];
      const missingFields = requiredFields.filter(f => !(f in team));

      if (missingFields.length > 0) {
        throw new Error(`Team missing fields: ${missingFields.join(', ')}`);
      }
      console.log(`✓ GamesResponse structure verified (${response.teams.length} teams, ${response.events.length} events)`);
    } else {
      console.log('⚠ No teams in response (games may not be fully seeded yet)');
    }
  } catch (error) {
    throw new Error(`GamesResponse verification failed: ${error.message}`);
  }
}

/**
 * Verify /api/simulate response structure
 */
async function verifySimulateResponse() {
  try {
    const response = await fetchAPI(`${BASE_URL}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        season: 2025,
        conferenceId: 8,
        overrides: {},
      }),
    });

    if (!response.standings || !Array.isArray(response.standings)) {
      throw new Error('Missing or invalid standings array');
    }
    if (response.standings.length !== 16) {
      throw new Error(`Expected 16 teams, got ${response.standings.length}`);
    }

    // Check first team has required fields
    if (response.standings.length > 0) {
      const requiredFields = ['rank', 'teamId', 'abbrev', 'displayName', 'logo', 'color', 'record', 'confRecord', 'explainPosition'];
      const team = response.standings[0];
      const missingFields = requiredFields.filter(f => !(f in team));

      if (missingFields.length > 0) {
        throw new Error(`Standing entry missing fields: ${missingFields.join(', ')}`);
      }
      console.log(`✓ SimulateResponse structure verified (${response.standings.length} standings)`);
    }
  } catch (error) {
    throw new Error(`SimulateResponse verification failed: ${error.message}`);
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
main();
