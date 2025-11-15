/**
 * Fix ESPN Scoreboard Test Data Index
 *
 * Drops old unique index on season and creates new compound index on season+week
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function fixIndex() {
  try {
    const { default: dbConnectTest } = await import('../lib/mongodb-test');
    const conn = await dbConnectTest();
    const db = conn.db;

    if (!db) {
      throw new Error('Database connection failed');
    }

    // Drop old index if it exists
    try {
      await db.collection('espn_scoreboard_test_data').dropIndex('season_1');
      process.stdout.write('Dropped old index: season_1\n');
    } catch {
      process.stdout.write('Old index may not exist (this is OK)\n');
    }

    // Create new compound index
    try {
      await db
        .collection('espn_scoreboard_test_data')
        .createIndex({ season: 1, week: 1 }, { unique: true, name: 'season_1_week_1' });
      process.stdout.write('Created new compound index: season_1_week_1\n');
    } catch {
      process.stdout.write('Index may already exist (this is OK)\n');
    }

    process.exit(0);
  } catch (error) {
    process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

void fixIndex();
