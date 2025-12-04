import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { type SportSlug, type ConferenceSlug, sports } from '../lib/constants';

interface TestResult {
  route: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  responseTime?: number;
}

interface EnvironmentConfig {
  name: string;
  baseUrl: string;
  database: string;
  requiresAuth: boolean;
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
  console.error('  Required for credentials');
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

const VERCEL_AUTOMATION_BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

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

function getEnvironmentConfig(env: string): EnvironmentConfig {
  if (env === 'preview') {
    return {
      name: 'preview',
      baseUrl: 'https://who-clinches-git-develop-austinrts-projects.vercel.app',
      database: 'preview',
      requiresAuth: true,
    };
  } else if (env === 'production' || env === 'prod') {
    return {
      name: 'production',
      baseUrl: 'https://whoclinches.com',
      database: 'production',
      requiresAuth: true,
    };
  } else {
    return {
      name: 'dev',
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      database: process.env.MONGODB_DB || 'dev',
      requiresAuth: false,
    };
  }
}

async function fetchAPI(
  url: string,
  options: RequestInit = {},
  config: EnvironmentConfig
): Promise<{ status: number; data: unknown; responseTime: number }> {
  const REQUEST_TIMEOUT_MS = 120000;
  const startTime = Date.now();

  try {
    let finalUrl = url;
    if (config.requiresAuth && VERCEL_AUTOMATION_BYPASS_SECRET) {
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
      const responseTime = Date.now() - startTime;

      const data = await response.json().catch(() => ({}));

      return {
        status: response.status,
        data,
        responseTime,
      };
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

async function testRoute(
  config: EnvironmentConfig,
  method: string,
  route: string,
  body?: unknown
): Promise<TestResult> {
  const url = `${config.baseUrl}${route}`;
  const startTime = Date.now();

  try {
    const { status, data, responseTime } = await fetchAPI(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );

    const success = status >= 200 && status < 300;

    if (!success) {
      return {
        route,
        method,
        status,
        success: false,
        error: JSON.stringify(data).substring(0, 200),
        responseTime,
      };
    }

    return {
      route,
      method,
      status,
      success: true,
      responseTime,
    };
  } catch (error) {
    const err = error as Error;
    return {
      route,
      method,
      status: 0,
      success: false,
      error: err.message,
      responseTime: Date.now() - startTime,
    };
  }
}

async function testAllRoutes(config: EnvironmentConfig): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const season = 2025;

  console.log(`\nTesting environment: ${config.name} (${config.database})`);
  console.log(`Base URL: ${config.baseUrl}`);

  const routes = [
    {
      method: 'GET',
      route: `/api/games/${sportSlug}/${confSlug}?season=${season}`,
      body: undefined,
      description: 'GET games (read-only)',
    },
    {
      method: 'POST',
      route: `/api/games/${sportSlug}/${confSlug}`,
      body: { season, force: true },
      description: 'POST games (fetch from ESPN)',
    },
    {
      method: 'GET',
      route: `/api/standings/${sportSlug}/${confSlug}?season=${season}`,
      body: undefined,
      description: 'GET standings',
    },
    {
      method: 'POST',
      route: `/api/simulate/${sportSlug}/${confSlug}`,
      body: { season, overrides: {} },
      description: 'POST simulate',
    },
    {
      method: 'POST',
      route: `/api/games/${sportSlug}/${confSlug}/live`,
      body: { season, force: true },
      description: 'POST games/live',
    },
    {
      method: 'POST',
      route: `/api/games/${sportSlug}/${confSlug}/spreads`,
      body: { season, force: true },
      description: 'POST games/spreads',
    },
  ];

  for (const routeConfig of routes) {
    console.log(`  Testing ${routeConfig.description}...`);
    const result = await testRoute(config, routeConfig.method, routeConfig.route, routeConfig.body);
    results.push(result);

    if (result.success) {
      console.log(`    ✓ ${result.method} ${result.route} - ${result.status} (${result.responseTime}ms)`);
    } else {
      console.log(`    ✗ ${result.method} ${result.route} - ${result.status || 'ERROR'}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

async function main() {
  const environments: EnvironmentConfig[] = [
    getEnvironmentConfig('dev'),
    getEnvironmentConfig('preview'),
    getEnvironmentConfig('production'),
  ];

  console.log('================================================');
  console.log('API Routes Test - All Environments');
  console.log('================================================');
  console.log(`Sport: ${sportSlug}`);
  console.log(`Conference: ${confSlug}`);
  console.log(`Expected teams: ${conferenceMeta.teams}`);
  console.log('');

  const isDevEnvironment = environments[0].baseUrl.startsWith('http://localhost');
  let serverStarted = false;
  let exitCode = 0;
  const serverPidFile = path.join(process.cwd(), '.api-test-server.pid');

  if (isDevEnvironment) {
    try {
      const { startNextDevServer } = await import('../lib/helpers/nextjs-dev-server');
      console.log('Ensuring Next.js dev server is running...');
      const result = await startNextDevServer({
        url: environments[0].baseUrl,
        pidFile: serverPidFile,
        waitForReady: true,
        logPrefix: '[API Test Script]',
      });
      serverStarted = !result.wasAlreadyRunning;
      if (result.wasAlreadyRunning) {
        console.log('[API Test Script] Using existing dev server');
      } else {
        console.log(`[API Test Script] Started dev server (PID: ${result.pid})`);
      }
    } catch (error) {
      const err = error as Error;
      console.error(`[ERROR] Failed to start Next.js dev server: ${err.message}`);
      process.exit(1);
    }
  }

  try {
    const allResults: Array<{ env: string; results: TestResult[] }> = [];

    for (const envConfig of environments) {
      const results = await testAllRoutes(envConfig);
      allResults.push({ env: envConfig.name, results });

      const successCount = results.filter((r) => r.success).length;
      const totalCount = results.length;
      const successRate = ((successCount / totalCount) * 100).toFixed(1);

      console.log(`\n${envConfig.name.toUpperCase()} Summary: ${successCount}/${totalCount} passed (${successRate}%)`);

      if (successCount < totalCount) {
        exitCode = 1;
      }
    }

    console.log('\n================================================');
    console.log('Overall Summary');
    console.log('================================================');

    for (const { env, results } of allResults) {
      const successCount = results.filter((r) => r.success).length;
      const totalCount = results.length;
      const failed = results.filter((r) => !r.success);

      console.log(`\n${env.toUpperCase()}:`);
      console.log(`  Passed: ${successCount}/${totalCount}`);

      if (failed.length > 0) {
        console.log(`  Failed routes:`);
        for (const failure of failed) {
          console.log(`    - ${failure.method} ${failure.route}`);
          if (failure.error) {
            console.log(`      ${failure.error}`);
          }
        }
      }
    }

    const totalSuccess = allResults.reduce(
      (sum, { results }) => sum + results.filter((r) => r.success).length,
      0
    );
    const totalTests = allResults.reduce((sum, { results }) => sum + results.length, 0);

    console.log(`\nTotal: ${totalSuccess}/${totalTests} tests passed`);

    if (exitCode === 0) {
      console.log('\n✓ All API routes are working correctly across all environments');
    } else {
      console.log('\n✗ Some API routes failed. See details above.');
    }
  } catch (error) {
    console.error('');
    console.error('[ERROR] Test execution failed:');
    const err = error as Error;
    console.error(err.message);
    exitCode = 1;
  } finally {
    if (isDevEnvironment && serverStarted) {
      try {
        const { stopNextDevServer } = await import('../lib/helpers/nextjs-dev-server');
        console.log('\n[API Test Script] Stopping dev server...');
        await stopNextDevServer({
          pidFile: serverPidFile,
          logPrefix: '[API Test Script]',
        });
      } catch (error) {
        const err = error as Error;
        console.error(`[WARNING] Failed to stop dev server: ${err.message}`);
      }
    }
  }

  process.exit(exitCode);
}

void main();



