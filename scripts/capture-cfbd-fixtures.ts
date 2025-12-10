import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getGames, getTeams, client } from 'cfbd';
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

const main = async () => {
  const args = process.argv.slice(2);
  const conference = args[0] as CFBConferenceAbbreviation | undefined;
  const year = args[1] ? parseInt(args[1], 10) : new Date().getFullYear();
  const week = args[2] ? parseInt(args[2], 10) : undefined;

  if (!conference) {
    console.error('Usage: tsx scripts/capture-cfbd-fixtures.ts <conference> [year] [week]');
    console.error(`Available conferences: ${CFB_CONFERENCE_ABBREVIATIONS.join(', ')}`);
    process.exit(1);
  }

  if (!CFB_CONFERENCE_ABBREVIATIONS.includes(conference)) {
    console.error(`Invalid conference: ${conference}`);
    console.error(`Available conferences: ${CFB_CONFERENCE_ABBREVIATIONS.join(', ')}`);
    process.exit(1);
  }

  if (!process.env.CFBD_API_KEY) {
    console.error('CFBD_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    await captureGames(conference, year, week);
    await captureTeams(conference);
    console.log('✅ Fixtures captured successfully');
  } catch (error) {
    console.error('❌ Error capturing fixtures:', error);
    process.exit(1);
  }
};

void main();

