import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { parse } from 'url';
import { CFB_CONFERENCE_METADATA, JSON_SERVER_URL } from '../lib/constants';

const FIXTURES_ROOT = join(process.cwd(), '__fixtures__', 'cfbd');

const getConfSlug = (cfbdId: string): string => {
  for (const [slug, meta] of Object.entries(CFB_CONFERENCE_METADATA)) {
    if (meta.cfbdId === cfbdId) {
      return slug;
    }
  }
  return cfbdId.toLowerCase();
};

const sendJSON = (res: ServerResponse, status: number, data: unknown) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
};

const resolveFixturePath = (
  pathname: string,
  query: Record<string, string | string[] | undefined>
): string => {
  const dir = pathname.replace(/^\//, '');
  const year = query.year ? String(query.year) : undefined;
  const week = query.week ? String(query.week) : undefined;
  const conference = query.conference ? getConfSlug(String(query.conference)) : undefined;
  const filename = week && year ? `${year}-week${week}.json` : year ? `${year}.json` : undefined;

  const segments: string[] = [FIXTURES_ROOT, dir];

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

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = parse(req.url || '', true);
  const { pathname, query } = parsedUrl;

  if (!pathname || pathname === '/') {
    return sendJSON(res, 404, { error: 'Not found' });
  }

  const fixturePath = resolveFixturePath(pathname, query);

  if (existsSync(fixturePath)) {
    const data = JSON.parse(readFileSync(fixturePath, 'utf-8'));
    return sendJSON(res, 200, data);
  }

  if (query.week) {
    const fallbackPath = resolveFixturePath(pathname, { ...query, week: undefined });
    if (existsSync(fallbackPath)) {
      const data = JSON.parse(readFileSync(fallbackPath, 'utf-8'));
      return sendJSON(res, 200, data);
    }
  }

  console.error(`[JSON Server] Fixture not found: ${fixturePath}`);
  sendJSON(res, 404, {
    error: 'Fixture not found',
    path: fixturePath,
    message: `Capture this fixture and place it at: ${fixturePath}`,
  });
});

const port = new URL(JSON_SERVER_URL).port;
server.listen(Number(port), () => {
  console.log(`JSON Server is running on ${JSON_SERVER_URL}`);
});
