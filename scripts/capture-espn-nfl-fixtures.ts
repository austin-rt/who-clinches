import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const FIXTURES_DIR = join(process.cwd(), '__fixtures__', 'espn', 'nfl');

const SITE_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const CORE_API = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

const FIRST_SEASON = 2002;
const LAST_SEASON = 2025;

const DELAY_MS = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchJSON = async (url: string, retries = 5): Promise<unknown> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 503 || res.status === 429) {
        throw new Error(`${res.status} ${res.statusText}: ${url}`);
      }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      const backoff = 2000 * attempt;
      console.warn(`  Retry ${attempt}/${retries} (waiting ${backoff}ms) for ${url}`);
      await sleep(backoff);
    }
  }
  throw new Error('unreachable');
};

interface WeekMeta {
  number: number;
  startDate: string;
  endDate: string;
}

const getWeeksForSeason = async (year: number): Promise<WeekMeta[]> => {
  const data = (await fetchJSON(`${CORE_API}/seasons/${year}/types/2/weeks`)) as {
    count: number;
    items: { $ref: string }[];
  };

  const weeks: WeekMeta[] = [];
  for (const item of data.items) {
    await sleep(DELAY_MS);
    const weekData = (await fetchJSON(item.$ref)) as WeekMeta;
    weeks.push({
      number: weekData.number,
      startDate: weekData.startDate,
      endDate: weekData.endDate,
    });
  }
  return weeks;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

const captureScoreboard = async (year: number, week: WeekMeta): Promise<void> => {
  const start = formatDate(week.startDate);
  const end = formatDate(week.endDate);
  const url = `${SITE_API}/scoreboard?dates=${start}-${end}&limit=100`;

  const data = await fetchJSON(url);
  const dir = join(FIXTURES_DIR, 'scoreboard', String(year));
  await mkdir(dir, { recursive: true });
  const filepath = join(dir, `week-${week.number}.json`);
  await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

  const events = (data as { events?: unknown[] }).events ?? [];
  console.log(`  Week ${week.number}: ${events.length} games`);
};

const captureTeams = async (): Promise<void> => {
  const data = await fetchJSON(`${SITE_API}/teams`);
  await mkdir(FIXTURES_DIR, { recursive: true });
  const filepath = join(FIXTURES_DIR, 'teams.json');
  await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

  const teams =
    ((data as { sports: { leagues: { teams: unknown[] }[] }[] }).sports?.[0]?.leagues?.[0]
      ?.teams as unknown[]) ?? [];
  console.log(`Teams: ${teams.length}`);
};

const captureTeamStatistics = async (year: number): Promise<void> => {
  const teamsData = JSON.parse(await readFile(join(FIXTURES_DIR, 'teams.json'), 'utf-8')) as {
    sports: { leagues: { teams: { team: { id: string } }[] }[] }[];
  };

  const teams = teamsData.sports[0].leagues[0].teams;
  const dir = join(FIXTURES_DIR, 'team-statistics', String(year));
  await mkdir(dir, { recursive: true });

  const BATCH_SIZE = 8;
  for (let i = 0; i < teams.length; i += BATCH_SIZE) {
    const batch = teams.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (t) => {
        const id = t.team.id;
        const url = `${CORE_API}/seasons/${year}/types/2/teams/${id}/statistics`;
        const data = await fetchJSON(url);
        await writeFile(join(dir, `${id}.json`), JSON.stringify(data, null, 2), 'utf-8');
      })
    );
    if (i + BATCH_SIZE < teams.length) await sleep(DELAY_MS);
  }
  console.log(`  Team statistics: ${teams.length} teams`);
};

const EXPECTED_SEEDINGS: Record<number, { afc: string[]; nfc: string[] }> = {
  2002: {
    afc: ['OAK', 'TEN', 'MIA', 'PIT', 'IND', 'NYJ'],
    nfc: ['PHI', 'TB', 'GB', 'SF', 'ATL', 'NYG'],
  },
  2003: {
    afc: ['NE', 'KC', 'IND', 'TEN', 'BAL', 'DEN'],
    nfc: ['PHI', 'STL', 'GB', 'CAR', 'DAL', 'SEA'],
  },
  2004: {
    afc: ['PIT', 'NE', 'IND', 'SD', 'NYJ', 'DEN'],
    nfc: ['PHI', 'ATL', 'GB', 'SEA', 'STL', 'MIN'],
  },
  2005: {
    afc: ['IND', 'DEN', 'CIN', 'NE', 'JAX', 'PIT'],
    nfc: ['SEA', 'CHI', 'NYG', 'TB', 'CAR', 'WSH'],
  },
  2006: {
    afc: ['SD', 'BAL', 'IND', 'NE', 'NYJ', 'KC'],
    nfc: ['CHI', 'NO', 'PHI', 'SEA', 'DAL', 'NYG'],
  },
  2007: {
    afc: ['NE', 'IND', 'SD', 'PIT', 'JAX', 'TEN'],
    nfc: ['DAL', 'GB', 'SEA', 'TB', 'NYG', 'WSH'],
  },
  2008: {
    afc: ['TEN', 'PIT', 'MIA', 'IND', 'SD', 'BAL'],
    nfc: ['NYG', 'CAR', 'MIN', 'ARI', 'ATL', 'PHI'],
  },
  2009: {
    afc: ['IND', 'SD', 'NE', 'CIN', 'NYJ', 'BAL'],
    nfc: ['NO', 'MIN', 'DAL', 'ARI', 'GB', 'PHI'],
  },
  2010: {
    afc: ['NE', 'PIT', 'IND', 'KC', 'BAL', 'NYJ'],
    nfc: ['ATL', 'CHI', 'PHI', 'SEA', 'NO', 'GB'],
  },
  2011: {
    afc: ['NE', 'BAL', 'HOU', 'DEN', 'PIT', 'CIN'],
    nfc: ['GB', 'SF', 'NO', 'NYG', 'ATL', 'DET'],
  },
  2012: {
    afc: ['DEN', 'NE', 'HOU', 'BAL', 'IND', 'CIN'],
    nfc: ['ATL', 'SF', 'GB', 'WSH', 'SEA', 'MIN'],
  },
  2013: {
    afc: ['DEN', 'NE', 'CIN', 'IND', 'KC', 'SD'],
    nfc: ['SEA', 'CAR', 'PHI', 'GB', 'SF', 'NO'],
  },
  2014: {
    afc: ['NE', 'DEN', 'IND', 'PIT', 'CIN', 'BAL'],
    nfc: ['SEA', 'GB', 'DAL', 'CAR', 'DET', 'ARI'],
  },
  2015: {
    afc: ['DEN', 'NE', 'CIN', 'HOU', 'KC', 'PIT'],
    nfc: ['CAR', 'ARI', 'MIN', 'WSH', 'GB', 'SEA'],
  },
  2016: {
    afc: ['NE', 'KC', 'PIT', 'HOU', 'OAK', 'MIA'],
    nfc: ['DAL', 'ATL', 'SEA', 'NYG', 'GB', 'DET'],
  },
  2017: {
    afc: ['NE', 'PIT', 'JAX', 'KC', 'TEN', 'BUF'],
    nfc: ['PHI', 'MIN', 'LAR', 'NO', 'CAR', 'ATL'],
  },
  2018: {
    afc: ['KC', 'NE', 'HOU', 'BAL', 'LAC', 'IND'],
    nfc: ['NO', 'LAR', 'CHI', 'DAL', 'SEA', 'PHI'],
  },
  2019: {
    afc: ['BAL', 'KC', 'NE', 'HOU', 'BUF', 'TEN'],
    nfc: ['SF', 'GB', 'NO', 'PHI', 'MIN', 'SEA'],
  },
  2020: {
    afc: ['KC', 'BUF', 'PIT', 'TEN', 'BAL', 'CLE', 'IND'],
    nfc: ['GB', 'NO', 'SEA', 'WSH', 'TB', 'LAR', 'CHI'],
  },
  2021: {
    afc: ['TEN', 'KC', 'BUF', 'CIN', 'LV', 'NE', 'PIT'],
    nfc: ['GB', 'TB', 'DAL', 'LAR', 'ARI', 'SF', 'PHI'],
  },
  2022: {
    afc: ['KC', 'BUF', 'CIN', 'JAX', 'LAC', 'BAL', 'MIA'],
    nfc: ['PHI', 'SF', 'MIN', 'TB', 'DAL', 'NYG', 'SEA'],
  },
  2023: {
    afc: ['BAL', 'BUF', 'KC', 'HOU', 'CLE', 'MIA', 'PIT'],
    nfc: ['SF', 'DAL', 'DET', 'TB', 'PHI', 'LAR', 'GB'],
  },
  2024: {
    afc: ['KC', 'BUF', 'BAL', 'HOU', 'LAC', 'PIT', 'DEN'],
    nfc: ['DET', 'PHI', 'TB', 'LAR', 'MIN', 'WSH', 'GB'],
  },
  2025: {
    afc: ['DEN', 'NE', 'JAX', 'PIT', 'HOU', 'BUF', 'LAC'],
    nfc: ['SEA', 'CHI', 'PHI', 'CAR', 'LAR', 'SF', 'GB'],
  },
};

const writeExpectedSeedings = async (): Promise<void> => {
  const dir = join(FIXTURES_DIR, 'expected-seedings');
  await mkdir(dir, { recursive: true });

  for (const [year, seedings] of Object.entries(EXPECTED_SEEDINGS)) {
    const filepath = join(dir, `${year}.json`);
    await writeFile(filepath, JSON.stringify(seedings, null, 2), 'utf-8');
  }
  console.log(`Expected seedings: ${Object.keys(EXPECTED_SEEDINGS).length} seasons`);
};

const captureSeason = async (year: number): Promise<void> => {
  console.log(`\n=== ${year} Season ===`);

  const scoreboardDir = join(FIXTURES_DIR, 'scoreboard', String(year));
  if (existsSync(join(scoreboardDir, 'week-1.json'))) {
    console.log(`  Scoreboard already captured, skipping`);
  } else {
    const weeks = await getWeeksForSeason(year);
    console.log(`  ${weeks.length} weeks`);

    for (const week of weeks) {
      await captureScoreboard(year, week);
      await sleep(DELAY_MS);
    }
  }

  const statsDir = join(FIXTURES_DIR, 'team-statistics', String(year));
  if (existsSync(statsDir) && existsSync(join(statsDir, '1.json'))) {
    console.log(`  Team statistics already captured, skipping`);
  } else {
    await captureTeamStatistics(year);
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  const singleYear = args[0] ? parseInt(args[0], 10) : undefined;

  if (singleYear && (singleYear < FIRST_SEASON || singleYear > LAST_SEASON)) {
    console.error(`Year must be between ${FIRST_SEASON} and ${LAST_SEASON}`);
    process.exit(1);
  }

  console.log('Capturing NFL fixtures from ESPN...');

  if (!existsSync(join(FIXTURES_DIR, 'teams.json'))) {
    await captureTeams();
  } else {
    console.log('Teams already captured, skipping');
  }

  if (singleYear) {
    await captureSeason(singleYear);
  } else {
    for (let year = FIRST_SEASON; year <= LAST_SEASON; year++) {
      await captureSeason(year);
    }
  }

  await writeExpectedSeedings();

  console.log('\nDone!');
};

void main();
