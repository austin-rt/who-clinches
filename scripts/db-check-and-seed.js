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

// Parse command line arguments
const args = process.argv.slice(2);
let envName = 'local'; // Default to local
const envIndex = args.indexOf('--env');
if (envIndex !== -1 && args[envIndex + 1]) {
  envName = args[envIndex + 1];
}

// Load .env.local for read-only credentials (always needed)
const localEnvFile = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(localEnvFile)) {
  console.error(`[ERROR] .env.local file not found`);
  console.error('  Required for read-only credentials');
  process.exit(1);
}

try {
  require('dotenv').config({ path: localEnvFile });
} catch (e) {
  console.error(`[ERROR] Failed to load .env.local`);
  console.error(e.message);
  process.exit(1);
}

// Determine BASE_URL: hardcoded for preview/production, from .env.local or default for local
let BASE_URL;
if (envName === 'preview') {
  BASE_URL = 'https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app';
} else if (envName === 'production') {
  BASE_URL = 'https://sec-tiebreaker-git-main-austinrts-projects.vercel.app';
} else {
  // For local, use from .env.local or default to localhost
  BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
}

// Determine database name: derive from env name for preview/production, from .env.local for local
let DATABASE;
if (envName === 'preview') {
  DATABASE = 'preview';
} else if (envName === 'production') {
  DATABASE = 'production';
} else {
  // For local, must be in .env.local
  DATABASE = process.env.MONGODB_DB;
  if (!DATABASE) {
    console.error(`[ERROR] MONGODB_DB not found in .env.local`);
    console.error('  Required for local testing');
    process.exit(1);
  }
}

// Get read-only credentials: from .env.local first, then process.env (for Vercel)
const MONGODB_USER_READONLY = process.env.MONGODB_USER_READONLY;
const MONGODB_PASSWORD_READONLY = process.env.MONGODB_PASSWORD_READONLY;

if (!MONGODB_USER_READONLY || !MONGODB_PASSWORD_READONLY) {
  console.error(`[ERROR] MongoDB read-only credentials not found`);
  console.error('  Required: MONGODB_USER_READONLY, MONGODB_PASSWORD_READONLY');
  console.error('  These should be in .env.local (or Vercel environment variables)');
  process.exit(1);
}

// Get Vercel bypass token for preview/production deployments
const VERCEL_AUTOMATION_BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if ((envName === 'preview' || envName === 'production') && !VERCEL_AUTOMATION_BYPASS_SECRET) {
  console.error(`[ERROR] VERCEL_AUTOMATION_BYPASS_SECRET not found`);
  console.error('  Required for preview/production deployments');
  console.error('  This should be in .env.local');
  process.exit(1);
}

console.log('================================================');
console.log('SEC Tiebreaker Database Check & Seed');
console.log('================================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Database: ${DATABASE}`);
console.log('');

/**
 * Fetch helper - simple wrapper around fetch API
 * Automatically adds bypass token for preview/production deployments
 */
async function fetchAPI(url, options = {}) {
  try {
    // Add bypass token for preview/production deployments
    let finalUrl = url;
    if ((envName === 'preview' || envName === 'production') && VERCEL_AUTOMATION_BYPASS_SECRET) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('x-vercel-protection-bypass', VERCEL_AUTOMATION_BYPASS_SECRET);
      finalUrl = urlObj.toString();
    }

    const response = await fetch(finalUrl, options);
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
 * Main execution flow
 */
async function main() {
  try {
    // Step 1: Check if teams are seeded
    console.log('Step 1: Checking if teams are seeded...');
    try {
      const gamesResponse = await fetchAPI(`${BASE_URL}/api/games?limit=1`);
      if (gamesResponse.teams && gamesResponse.teams.length > 0) {
        console.log(`[OK] Found ${gamesResponse.teams.length} team(s) in response`);
      } else {
        console.log('[INFO] No teams in response, will seed...');
        await seedTeams();
        await sleep(2000);
      }
    } catch {
      console.log('[INFO] Teams check failed, attempting to seed...');
      await seedTeams();
      await sleep(2000);
    }

    // Step 2: Check if games are seeded
    console.log('');
    console.log('Step 2: Checking if games are seeded...');
    try {
      // Check total games in database (should be 128: all SEC games)
      const allGamesResponse = await fetchAPI(`${BASE_URL}/api/games?season=2025`);
      if (allGamesResponse.events && allGamesResponse.events.length >= 128) {
        console.log(
          `[OK] Found ${allGamesResponse.events.length} total game(s) in database (expected 128 for full season)`
        );
      } else {
        console.log(
          `[INFO] Only ${allGamesResponse.events?.length || 0} games found, will seed full season...`
        );
        await seedGames();
        await sleep(2000);
        // Verify after seeding
        const verifyResponse = await fetchAPI(`${BASE_URL}/api/games?season=2025`);
        if (verifyResponse.events && verifyResponse.events.length >= 128) {
          console.log(
            `[OK] Seeded ${verifyResponse.events.length} total games (expected 128 for full season)`
          );
        }
      }
    } catch {
      console.log('[INFO] Games check failed, attempting to seed...');
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
    console.log('[OK] Database ready for testing');
    console.log('================================================');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('[ERROR] Database check failed:');
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
    console.log('[OK] Teams seeded');
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
    console.log('[OK] Games seeded');
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
      const missingFields = requiredFields.filter((f) => !(f in team));

      if (missingFields.length > 0) {
        throw new Error(`Team missing fields: ${missingFields.join(', ')}`);
      }
      console.log(
        `[OK] GamesResponse structure verified (${response.teams.length} teams, ${response.events.length} events)`
      );
    } else {
      console.log('[WARNING] No teams in response (games may not be fully seeded yet)');
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
      const requiredFields = [
        'rank',
        'teamId',
        'abbrev',
        'displayName',
        'logo',
        'color',
        'record',
        'confRecord',
        'explainPosition',
      ];
      const team = response.standings[0];
      const missingFields = requiredFields.filter((f) => !(f in team));

      if (missingFields.length > 0) {
        throw new Error(`Standing entry missing fields: ${missingFields.join(', ')}`);
      }
      console.log(
        `[OK] SimulateResponse structure verified (${response.standings.length} standings)`
      );
    }
  } catch (error) {
    throw new Error(`SimulateResponse verification failed: ${error.message}`);
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run
main();
