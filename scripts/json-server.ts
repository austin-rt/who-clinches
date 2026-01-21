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
  } else if (pathname === '/rankings') {
    const { year, week } = query;
    if (!year) {
      return sendJSON(res, 400, { error: 'year is required' });
    }

    const yearStr = String(year);
    const weekStr = week ? String(week) : 'latest';
    const fixturePath = join(
      process.cwd(),
      '__fixtures__',
      'cfbd',
      'rankings',
      `${yearStr}${weekStr !== 'latest' ? `-week${weekStr}` : ''}.json`
    );

    if (existsSync(fixturePath)) {
      const data = JSON.parse(readFileSync(fixturePath, 'utf-8'));
      sendJSON(res, 200, data);
    } else {
      // Try without week if week-specific not found
      const fallbackPath = join(process.cwd(), '__fixtures__', 'cfbd', 'rankings', `${yearStr}.json`);
      if (existsSync(fallbackPath)) {
        const data = JSON.parse(readFileSync(fallbackPath, 'utf-8'));
        sendJSON(res, 200, data);
      } else {
        console.error(`[JSON Server] Fixture not found: ${fixturePath}`);
        sendJSON(res, 404, {
          error: 'Fixture not found',
          path: fixturePath,
          message: `Run 'npm run capture-fixtures rankings ${yearStr}${weekStr !== 'latest' ? ` ${weekStr}` : ''}' to generate this fixture.`,
        });
      }
    }
  } else if (pathname === '/stats/season/advanced') {
    const { year } = query;
    if (!year) {
      return sendJSON(res, 400, { error: 'year is required' });
    }

    const yearStr = String(year);
    // Advanced stats fixture is per-season (all teams), conference filter is handled client-side
    const fixturePath = join(
      process.cwd(),
      '__fixtures__',
      'cfbd',
      'stats',
      'season',
      'advanced',
      `${yearStr}.json`
    );

    if (existsSync(fixturePath)) {
      const data = JSON.parse(readFileSync(fixturePath, 'utf-8'));
      sendJSON(res, 200, data);
    } else {
      console.error(`[JSON Server] Fixture not found: ${fixturePath}`);
      sendJSON(res, 404, {
        error: 'Fixture not found',
        path: fixturePath,
        message: `Run 'npm run capture-fixtures advanced-stats ${yearStr}' to generate this fixture.`,
      });
    }
  } else if (pathname === '/ratings/sp') {
    // SP+ ratings - proxy to real API if fixture not available
    const { year } = query;
    if (!year) {
      return sendJSON(res, 400, { error: 'year is required' });
    }
    
    // For now, return 404 to let it fall through to real API
    // TODO: Add fixture support for SP+ ratings
    sendJSON(res, 404, { error: 'SP+ ratings not available in fixtures - use real API' });
  } else if (pathname === '/ratings/fpi') {
    // FPI ratings - proxy to real API if fixture not available
    const { year } = query;
    if (!year) {
      return sendJSON(res, 400, { error: 'year is required' });
    }
    
    // For now, return 404 to let it fall through to real API
    // TODO: Add fixture support for FPI ratings
    sendJSON(res, 404, { error: 'FPI ratings not available in fixtures - use real API' });
  } else {
    sendJSON(res, 404, { error: 'Not found' });
  }
});

const PORT = process.env.JSON_SERVER_PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});
