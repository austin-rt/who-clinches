import { http, HttpResponse, passthrough, type JsonBodyType } from 'msw';
import { join } from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { CFB_CONFERENCE_METADATA } from '@/lib/cfb/constants';

const CFBD_FIXTURES = join(process.cwd(), '__fixtures__', 'cfbd');
const ESPN_FIXTURES = join(process.cwd(), '__fixtures__', 'espn', 'nfl');

const getConfSlug = (cfbdId: string): string => {
  for (const [slug, meta] of Object.entries(CFB_CONFERENCE_METADATA)) {
    if (meta.cfbdId === cfbdId) return slug;
  }
  return cfbdId.toLowerCase();
};

const readJson = (filePath: string): JsonBodyType =>
  JSON.parse(readFileSync(filePath, 'utf-8')) as JsonBodyType;

const resolveCfbdFixture = (pathname: string, params: URLSearchParams): string => {
  const dir = pathname.replace(/^\//, '');
  const year = params.get('year') ?? undefined;
  const week = params.get('week') ?? undefined;
  const conference = params.get('conference') ? getConfSlug(params.get('conference')!) : undefined;

  let filename: string | undefined;
  if (week && year) filename = `${year}-week${week}.json`;
  else if (year) filename = `${year}.json`;

  const segments: string[] = [CFBD_FIXTURES, dir];

  if (conference && filename) {
    segments.push(conference, filename);
  } else if (filename) {
    segments.push(filename);
  } else if (conference) {
    segments.push(`${conference}.json`);
  } else {
    segments.push('index.json');
  }

  return join(...segments);
};

const cfbdHandlers = [
  http.get('https://api.collegefootballdata.com/*', ({ request }) => {
    const url = new URL(request.url);
    const fixturePath = resolveCfbdFixture(url.pathname, url.searchParams);

    if (existsSync(fixturePath)) {
      return HttpResponse.json(readJson(fixturePath));
    }

    if (url.searchParams.has('week')) {
      const fallbackParams = new URLSearchParams(url.searchParams);
      fallbackParams.delete('week');
      const fallbackPath = resolveCfbdFixture(url.pathname, fallbackParams);
      if (existsSync(fallbackPath)) {
        return HttpResponse.json(readJson(fallbackPath));
      }
    }

    return HttpResponse.json({ error: 'Fixture not found', path: fixturePath }, { status: 404 });
  }),
];

const espnHandlers = [
  http.get(
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    ({ request }) => {
      const url = new URL(request.url);
      const season = url.searchParams.get('season') ?? url.searchParams.get('dates');
      const week = url.searchParams.get('week');

      if (!season) return passthrough();

      if (week) {
        const filePath = join(ESPN_FIXTURES, 'scoreboard', season, `week-${week}.json`);
        if (existsSync(filePath)) {
          return HttpResponse.json(readJson(filePath));
        }
      }

      const dir = join(ESPN_FIXTURES, 'scoreboard', season);
      if (existsSync(dir)) {
        const weekFiles = readdirSync(dir)
          .filter((f) => f.startsWith('week-') && f.endsWith('.json'))
          .sort((a, b) => {
            const numA = parseInt(a.replace('week-', '').replace('.json', ''), 10);
            const numB = parseInt(b.replace('week-', '').replace('.json', ''), 10);
            return numA - numB;
          });
        const scoreboards = weekFiles.map((f) => readJson(join(dir, f)) as { events: unknown[] });
        if (scoreboards.length > 0) {
          const allEvents = scoreboards.flatMap((sb) => sb.events);
          return HttpResponse.json({ ...scoreboards[0], events: allEvents });
        }
      }

      return HttpResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }
  ),

  http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams', () => {
    const filePath = join(ESPN_FIXTURES, 'teams.json');
    if (existsSync(filePath)) {
      return HttpResponse.json(readJson(filePath));
    }
    return HttpResponse.json({ error: 'Fixture not found' }, { status: 404 });
  }),

  http.get(
    'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/:season/types/2/teams/:teamId/statistics',
    ({ params }) => {
      const filePath = join(
        ESPN_FIXTURES,
        'team-statistics',
        String(params.season),
        `${params.teamId}.json`
      );
      if (existsSync(filePath)) {
        return HttpResponse.json(readJson(filePath));
      }
      return HttpResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }
  ),
];

export const handlers = [...cfbdHandlers, ...espnHandlers];
