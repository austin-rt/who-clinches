import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getGames, getTeams, getRankings, getAdvancedSeasonStats, client } from 'cfbd';
import {
  CFB_CONFERENCE_METADATA,
  CFB_CONFERENCE_ABBREVIATIONS,
  type CFBConferenceAbbreviation,
} from '../lib/constants';

client.setConfig({
  headers: {
    Authorization: `Bearer ${process.env.CFBD_API_KEY}`,
  },
});

const FIXTURES_DIR = join(process.cwd(), '__fixtures__', 'cfbd');

const captureGames = async (
  conference: CFBConferenceAbbreviation,
  year: number,
  week?: number
): Promise<void> => {
  const confMeta = CFB_CONFERENCE_METADATA[conference];
  if (!confMeta) {
    throw new Error(`Invalid conference: ${conference}`);
  }

  const result = await getGames({
    query: {
      year,
      week,
      conference: confMeta.cfbdId,
    },
  });

  const games = result.data ?? [];
  const filename = `${year}${week ? `-week${week}` : ''}.json`;
  const dir = join(FIXTURES_DIR, 'games', conference);
  await mkdir(dir, { recursive: true });
  const filepath = join(dir, filename);

  await writeFile(filepath, JSON.stringify(games, null, 2), 'utf-8');
  console.log(`Captured ${games.length} games to ${filepath}`);
};

const captureTeams = async (conference: CFBConferenceAbbreviation): Promise<void> => {
  const confMeta = CFB_CONFERENCE_METADATA[conference];
  if (!confMeta) {
    throw new Error(`Invalid conference: ${conference}`);
  }

  const result = await getTeams({
    query: {
      conference: confMeta.cfbdId,
    },
  });

  const teams = result.data ?? [];
  const dir = join(FIXTURES_DIR, 'teams');
  await mkdir(dir, { recursive: true });
  const filepath = join(dir, `${conference}.json`);

  await writeFile(filepath, JSON.stringify(teams, null, 2), 'utf-8');
  console.log(`Captured ${teams.length} teams to ${filepath}`);
};

const captureRankings = async (year: number, week?: number): Promise<void> => {
  const result = await getRankings({
    query: {
      year,
      ...(week !== undefined && { week }),
    },
  });

  const rankings = result.data ?? [];
  const filename = `${year}${week ? `-week${week}` : ''}.json`;
  const dir = join(FIXTURES_DIR, 'rankings');
  await mkdir(dir, { recursive: true });
  const filepath = join(dir, filename);

  await writeFile(filepath, JSON.stringify(rankings, null, 2), 'utf-8');
  console.log(`Captured ${rankings.length} ranking weeks to ${filepath}`);
};

const captureAdvancedStats = async (year: number): Promise<void> => {
  const result = await getAdvancedSeasonStats({
    query: {
      year,
    },
  });

  const stats = result.data ?? [];
  const dir = join(FIXTURES_DIR, 'stats', 'season', 'advanced');
  await mkdir(dir, { recursive: true });
  const filepath = join(dir, `${year}.json`);

  await writeFile(filepath, JSON.stringify(stats, null, 2), 'utf-8');
  console.log(`Captured ${stats.length} team advanced stats to ${filepath}`);
};

const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  const year = args[1] ? parseInt(args[1], 10) : new Date().getFullYear();
  const week = args[2] ? parseInt(args[2], 10) : undefined;

  if (!process.env.CFBD_API_KEY) {
    console.error('CFBD_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    if (command === 'rankings') {
      // Capture rankings: npm run capture-fixtures rankings [year] [week]
      await captureRankings(year, week);
      console.log('✅ Rankings fixture captured successfully');
    } else if (command === 'advanced-stats') {
      // Capture advanced stats: npm run capture-fixtures advanced-stats [year]
      await captureAdvancedStats(year);
      console.log('✅ Advanced stats fixture captured successfully');
    } else {
      // Original behavior: capture games and teams for a conference
      const conference = command as CFBConferenceAbbreviation | undefined;
      if (!conference) {
        console.error('Usage:');
        console.error('  tsx scripts/capture-cfbd-fixtures.ts <conference> [year] [week]');
        console.error('  tsx scripts/capture-cfbd-fixtures.ts rankings [year] [week]');
        console.error('  tsx scripts/capture-cfbd-fixtures.ts advanced-stats [year]');
        console.error(`Available conferences: ${CFB_CONFERENCE_ABBREVIATIONS.join(', ')}`);
        process.exit(1);
      }

      if (!CFB_CONFERENCE_ABBREVIATIONS.includes(conference)) {
        console.error(`Invalid conference: ${conference}`);
        console.error(`Available conferences: ${CFB_CONFERENCE_ABBREVIATIONS.join(', ')}`);
        process.exit(1);
      }

      await captureGames(conference, year, week);
      await captureTeams(conference);
      console.log('✅ Fixtures captured successfully');
    }
  } catch (error) {
    console.error('❌ Error capturing fixtures:', error);
    process.exit(1);
  }
};

void main();

