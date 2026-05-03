import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { config } from 'dotenv';
import {
  CFB_CONFERENCE_METADATA,
  CFB_CONFERENCE_ABBREVIATIONS,
  type CFBConferenceAbbreviation,
} from '../lib/constants';

const FIXTURES_DIR = join(process.cwd(), '__fixtures__', 'cfbd');

const main = async () => {
  config({ path: resolve(process.cwd(), '.env.local') });
  delete process.env.FIXTURE_YEAR;

  if (!(process.env.CFBD_API_KEY ?? '').trim()) {
    throw new Error('CFBD_API_KEY is required (comma-separated for multiple preprod keys)');
  }

  const { getGamesFromCfbd, getTeamsFromCfbd, getRankingsFromCfbd } = await import(
    '../lib/cfb/cfbd-rest-client'
  );

  const captureGames = async (
    conference: CFBConferenceAbbreviation,
    year: number,
    week?: number
  ): Promise<void> => {
    const confMeta = CFB_CONFERENCE_METADATA[conference];
    if (!confMeta) {
      throw new Error(`Invalid conference: ${conference}`);
    }

    const games = await getGamesFromCfbd({
      year,
      week,
      conference: confMeta.cfbdId,
    });

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

    const teams = await getTeamsFromCfbd({
      conference: confMeta.cfbdId,
    });

    const dir = join(FIXTURES_DIR, 'teams');
    await mkdir(dir, { recursive: true });
    const filepath = join(dir, `${conference}.json`);

    await writeFile(filepath, JSON.stringify(teams, null, 2), 'utf-8');
    console.log(`Captured ${teams.length} teams to ${filepath}`);
  };

  const captureRankings = async (year: number, week?: number): Promise<void> => {
    const rankings = await getRankingsFromCfbd({
      year,
      ...(week !== undefined && { week }),
    });

    const filename = `${year}${week ? `-week${week}` : ''}.json`;
    const dir = join(FIXTURES_DIR, 'rankings');
    await mkdir(dir, { recursive: true });
    const filepath = join(dir, filename);

    await writeFile(filepath, JSON.stringify(rankings, null, 2), 'utf-8');
    console.log(`Captured ${rankings.length} ranking weeks to ${filepath}`);
  };

  const args = process.argv.slice(2);
  const command = args[0];
  const year = args[1] ? parseInt(args[1], 10) : new Date().getFullYear();
  const week = args[2] ? parseInt(args[2], 10) : undefined;

  try {
    if (command === 'rankings') {
      await captureRankings(year, week);
      console.log('✅ Rankings fixture captured successfully');
    } else {
      const conference = command as CFBConferenceAbbreviation | undefined;
      if (!conference) {
        console.error('Usage:');
        console.error('  tsx scripts/capture-cfbd-fixtures.ts <conference> [year] [week]');
        console.error('  tsx scripts/capture-cfbd-fixtures.ts rankings [year] [week]');
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
