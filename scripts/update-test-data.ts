import { startNextDevServer, stopNextDevServer } from '../lib/helpers/nextjs-dev-server';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const DEFAULT_PORT = 3000;
const DEFAULT_URL = 'http://localhost:3000';

async function updateTestData() {
  let serverStarted = false;

  try {
    console.log('[Update Test Data] Starting Next.js dev server...');
    const server = await startNextDevServer({
      port: DEFAULT_PORT,
      url: DEFAULT_URL,
      killExisting: true,
      waitForReady: true,
      timeout: 60000,
      logPrefix: '[Update Test Data]',
    });

    serverStarted = !server.wasAlreadyRunning;

    if (!server.isRunning) {
      throw new Error('Failed to start Next.js dev server');
    }

    console.log('[Update Test Data] Server ready, calling update-test-data endpoint...');

    const CRON_SECRET = process.env.CRON_SECRET;
    if (!CRON_SECRET) {
      throw new Error('CRON_SECRET environment variable is required');
    }

    const response = await fetch(`${DEFAULT_URL}/api/cron/update-test-data`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API call failed: ${response.status} ${text}`);
    }

    const result = await response.json();
    console.log('[Update Test Data] Result:', JSON.stringify(result, null, 2));

    if (result.updated === result.total) {
      console.log('[Update Test Data] ✅ All test data updated successfully');
      process.exit(0);
    } else {
      console.log(
        `[Update Test Data] ⚠️  Only ${result.updated}/${result.total} types updated successfully`
      );
      result.results.forEach((r: { type: string; success: boolean; error?: string }) => {
        if (!r.success) {
          console.error(`[Update Test Data] ❌ ${r.type}: ${r.error || 'Unknown error'}`);
        }
      });
      process.exit(1);
    }
  } catch (error) {
    console.error('[Update Test Data] Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    if (serverStarted) {
      console.log('[Update Test Data] Stopping Next.js dev server...');
      await stopNextDevServer({ logPrefix: '[Update Test Data]' });
    }
  }
}

void updateTestData();

