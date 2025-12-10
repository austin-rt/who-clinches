import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { parse } from 'url';
import { CFB_CONFERENCE_METADATA } from '../lib/constants';

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

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = parse(req.url || '', true);
  const { pathname, query } = parsedUrl;

  if (pathname === '/games') {
    const { year, week, conference } = query;
    if (!year || !conference) {
      return sendJSON(res, 400, { error: 'year and conference are required' });
    }

    const confSlug = getConfSlug(conference as string);
    const yearStr = String(year);
    const weekStr = week ? String(week) : undefined;
    const fixturePath = join(
      process.cwd(),
      '__fixtures__',
      'cfbd',
      'games',
      confSlug,
      `${yearStr}${weekStr ? `-week${weekStr}` : ''}.json`
    );

    if (existsSync(fixturePath)) {
      const data = JSON.parse(readFileSync(fixturePath, 'utf-8'));
      sendJSON(res, 200, data);
    } else {
      console.error(`[JSON Server] Fixture not found: ${fixturePath}`);
      sendJSON(res, 404, {
        error: 'Fixture not found',
        path: fixturePath,
        message: `Run 'npm run capture-fixtures ${confSlug} ${yearStr}${weekStr ? ` ${weekStr}` : ''}' to generate this fixture.`,
      });
    }
  } else if (pathname === '/teams') {
    const { conference } = query;
    if (!conference) {
      return sendJSON(res, 400, { error: 'conference is required' });
    }

    const confSlug = getConfSlug(conference as string);
    const fixturePath = join(process.cwd(), '__fixtures__', 'cfbd', 'teams', `${confSlug}.json`);

    if (existsSync(fixturePath)) {
      const data = JSON.parse(readFileSync(fixturePath, 'utf-8'));
      sendJSON(res, 200, data);
    } else {
      console.error(`[JSON Server] Fixture not found: ${fixturePath}`);
      sendJSON(res, 404, {
        error: 'Fixture not found',
        path: fixturePath,
        message: `Run 'npm run capture-fixtures ${confSlug}' to generate this fixture.`,
      });
    }
  } else {
    sendJSON(res, 404, { error: 'Not found' });
  }
});

const PORT = process.env.JSON_SERVER_PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});
