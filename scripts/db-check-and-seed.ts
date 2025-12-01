import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { sports, type SportSlug, type ConferenceSlug } from '../lib/constants';

interface GamesResponse {
  events?: unknown[];
  teams?: unknown[];
}

interface SimulateResponse {
  standings?: unknown[];
}

const args = process.argv.slice(2);
let envName = 'dev';
let sportSlug: SportSlug = 'cfb';
let confSlug: ConferenceSlug = 'sec';

const envIndex = args.indexOf('--env');
if (envIndex !== -1 && args[envIndex + 1]) {
  envName = args[envIndex + 1];
}

const sportIndex = args.indexOf('--sport');
if (sportIndex !== -1 && args[sportIndex + 1]) {
  sportSlug = args[sportIndex + 1] as SportSlug;
}

const confIndex = args.indexOf('--conf');
if (confIndex !== -1 && args[confIndex + 1]) {
  confSlug = args[confIndex + 1] as ConferenceSlug;
}

if (envName === 'local') {
  envName = 'dev';
}

const localEnvFile = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(localEnvFile)) {
  console.error(`[ERROR] .env.local file not found`);
  console.error('  Required for read-only credentials');
  process.exit(1);
}

try {
  dotenv.config({ path: localEnvFile });
} catch (e) {
  const error = e as Error;
  console.error(`[ERROR] Failed to load .env.local`);
  console.error(error.message);
  process.exit(1);
}

let BASE_URL: string;
if (envName === 'preview') {
  BASE_URL = 'https://who-clinches-git-develop-austinrts-projects.vercel.app';
} else if (envName === 'production') {
  BASE_URL = 'https://whoclinches.com';
} else {
  BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
}

let DATABASE: string;
if (envName === 'preview') {
  DATABASE = 'preview';
} else if (envName === 'production') {
  DATABASE = 'production';
} else {
  DATABASE = process.env.MONGODB_DB || '';
  if (!DATABASE) {
    console.error(`[ERROR] MONGODB_DB not found in .env.local`);
    console.error('  Required for dev testing');
    process.exit(1);
  }
}

const MONGODB_USER_READONLY = process.env.MONGODB_USER_READONLY;
const MONGODB_PASSWORD_READONLY = process.env.MONGODB_PASSWORD_READONLY;

if (!MONGODB_USER_READONLY || !MONGODB_PASSWORD_READONLY) {
  console.error(`[ERROR] MongoDB read-only credentials not found`);
  console.error('  Required: MONGODB_USER_READONLY, MONGODB_PASSWORD_READONLY');
  console.error('  These should be in .env.local (or Vercel environment variables)');
  process.exit(1);
}

const VERCEL_AUTOMATION_BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if ((envName === 'preview' || envName === 'production') && !VERCEL_AUTOMATION_BYPASS_SECRET) {
  console.error(`[ERROR] VERCEL_AUTOMATION_BYPASS_SECRET not found`);
  console.error('  Required for preview/production deployments');
  console.error('  This should be in .env.local');
  process.exit(1);
}

const sportConfig = sports[sportSlug];
if (!sportConfig) {
  console.error(`[ERROR] Unsupported sport: ${sportSlug}`);
  console.error(`  Available sports: ${Object.keys(sports).join(', ')}`);
  process.exit(1);
}

const conferenceMeta = sportConfig.conferences[confSlug];
if (!conferenceMeta) {
  console.error(`[ERROR] Unsupported conference: ${confSlug} for sport: ${sportSlug}`);
  console.error(
    `  Available conferences for ${sportSlug}: ${Object.keys(sportConfig.conferences).join(', ')}`
  );
  process.exit(1);
}

const expectedGames = (conferenceMeta.teams * conferenceMeta.confGames) / 2;

console.log('================================================');
console.log('Who Clinches Database Check & Seed');
console.log('================================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Database: ${DATABASE}`);
console.log(`Sport: ${sportSlug}`);
console.log(`Conference: ${confSlug}`);
console.log(`Expected teams: ${conferenceMeta.teams}`);
console.log(`Expected games: ${expectedGames}`);
console.log('');

async function fetchAPI<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const REQUEST_TIMEOUT_MS = 120000;

  try {
    let finalUrl = url;
    if ((envName === 'preview' || envName === 'production') && VERCEL_AUTOMATION_BYPASS_SECRET) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('x-vercel-protection-bypass', VERCEL_AUTOMATION_BYPASS_SECRET);
      finalUrl = urlObj.toString();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(finalUrl, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return await response.json();
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(
          `Request timeout: ${finalUrl} did not complete within ${REQUEST_TIMEOUT_MS}ms`
        );
      }

      throw fetchError;
    }
  } catch (error) {
    const err = error as Error;
    throw new Error(`API request failed: ${err.message}`);
  }
}

async function main() {
  const isDevEnvironment = envName === 'dev' && BASE_URL.startsWith('http://localhost');
  let serverStarted = false;
  let exitCode = 0;
  const serverPidFile = path.join(process.cwd(), '.db-check-server.pid');

  if (isDevEnvironment) {
    try {
      const { startNextDevServer } = await import('../lib/helpers/nextjs-dev-server');
      console.log('Ensuring Next.js dev server is running...');
      const result = await startNextDevServer({
        url: BASE_URL,
        pidFile: serverPidFile,
        waitForReady: true,
        logPrefix: '[DB Check Script]',
      });
      serverStarted = !result.wasAlreadyRunning;
      if (result.wasAlreadyRunning) {
        console.log('[DB Check Script] Using existing dev server');
      } else {
        console.log(`[DB Check Script] Started dev server (PID: ${result.pid})`);
      }
    } catch (error) {
      const err = error as Error;
      console.error(`[ERROR] Failed to start Next.js dev server: ${err.message}`);
      process.exit(1);
    }
  }

  try {
    console.log('Step 1: Checking if games are seeded...');
    try {
      const allGamesResponse = await fetchAPI<GamesResponse>(
        `${BASE_URL}/api/games/${sportSlug}/${confSlug}?season=2025`
      );
      const gameCount = allGamesResponse.events?.length || 0;
      const teamCount = allGamesResponse.teams?.length || 0;

      if (teamCount === conferenceMeta.teams && gameCount === expectedGames) {
        console.log(
          `[OK] Found ${teamCount} team(s) and ${gameCount} conference game(s) in database (expected ${conferenceMeta.teams} teams, ${expectedGames} games)`
        );
      } else {
        console.log(
          `[INFO] Found ${teamCount} team(s) and ${gameCount} game(s) (expected ${conferenceMeta.teams} teams, ${expectedGames} games), will seed full season...`
        );
        await seedGames();
        await sleep(2000);
        const verifyResponse = await fetchAPI<GamesResponse>(
          `${BASE_URL}/api/games/${sportSlug}/${confSlug}?season=2025`
        );
        const verifyGameCount = verifyResponse.events?.length || 0;
        const verifyTeamCount = verifyResponse.teams?.length || 0;
        if (verifyTeamCount === conferenceMeta.teams && verifyGameCount === expectedGames) {
          console.log(
            `[OK] Seeded ${verifyTeamCount} team(s) and ${verifyGameCount} conference game(s) (expected ${conferenceMeta.teams} teams, ${expectedGames} games)`
          );
        } else {
          console.log(
            `[WARNING] Seeded ${verifyTeamCount} team(s) and ${verifyGameCount} game(s), but expected ${conferenceMeta.teams} teams and ${expectedGames} games`
          );
        }
      }
    } catch {
      console.log('[INFO] Games check failed, attempting to seed...');
      await seedGames();
      await sleep(2000);
    }

    console.log('');
    console.log('Step 3: Verifying API response structures...');
    await verifyGamesResponse();

    console.log('');
    console.log('Step 4: Verifying simulate response structure...');
    await verifySimulateResponse();

    console.log('');
    console.log('================================================');
    console.log('[OK] Database ready for testing');
    console.log('================================================');
  } catch (error) {
    console.error('');
    console.error('[ERROR] Database check failed:');
    const err = error as Error;
    console.error(err.message);
    exitCode = 1;
  } finally {
    if (isDevEnvironment && serverStarted) {
      try {
        const { stopNextDevServer } = await import('../lib/helpers/nextjs-dev-server');
        console.log('[DB Check Script] Stopping dev server...');
        await stopNextDevServer({
          pidFile: serverPidFile,
          logPrefix: '[DB Check Script]',
        });
      } catch (error) {
        const err = error as Error;
        console.error(`[WARNING] Failed to stop dev server: ${err.message}`);
      }
    }
  }

  process.exit(exitCode);
}

async function seedGames() {
  console.log('  Seeding games (this will also extract teams)...');
  try {
    await fetchAPI(`${BASE_URL}/api/games/${sportSlug}/${confSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        season: 2025,
      }),
    });
    console.log('[OK] Games and teams seeded');
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to seed games: ${err.message}`);
  }
}

async function verifyGamesResponse() {
  try {
    const response = await fetchAPI<GamesResponse>(
      `${BASE_URL}/api/games/${sportSlug}/${confSlug}?season=2025`
    );

    if (!response.events || !Array.isArray(response.events)) {
      throw new Error('Missing or invalid events array');
    }
    if (!response.teams || !Array.isArray(response.teams)) {
      throw new Error('Missing or invalid teams array');
    }

    if (response.teams.length > 0) {
      const requiredFields = ['id', 'abbrev', 'displayName', 'logo', 'color', 'alternateColor'];
      const team = response.teams[0] as Record<string, unknown>;
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
    const err = error as Error;
    throw new Error(`GamesResponse verification failed: ${err.message}`);
  }
}

async function verifySimulateResponse() {
  try {
    const response = await fetchAPI<SimulateResponse>(
      `${BASE_URL}/api/simulate/${sportSlug}/${confSlug}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season: 2025,
          overrides: {},
        }),
      }
    );

    if (!response.standings || !Array.isArray(response.standings)) {
      throw new Error('Missing or invalid standings array');
    }
    if (response.standings.length !== conferenceMeta.teams) {
      throw new Error(`Expected ${conferenceMeta.teams} teams, got ${response.standings.length}`);
    }

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
      const team = response.standings[0] as Record<string, unknown>;
      const missingFields = requiredFields.filter((f) => !(f in team));

      if (missingFields.length > 0) {
        throw new Error(`Standing entry missing fields: ${missingFields.join(', ')}`);
      }
      console.log(
        `[OK] SimulateResponse structure verified (${response.standings.length} standings)`
      );
    }
  } catch (error) {
    const err = error as Error;
    throw new Error(`SimulateResponse verification failed: ${err.message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void main();
