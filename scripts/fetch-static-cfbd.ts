import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const CFBD_BASE = 'https://apinext.collegefootballdata.com';
const OUT_DIR = join(process.cwd(), 'docs', 'cfbd-static');
const API_KEY = process.env.CFBD_API_KEY?.split(',')[0];

if (!API_KEY) {
  console.error('CFBD_API_KEY required');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' };

const get = async (path: string, params?: Record<string, string>) => {
  const url = new URL(`${CFBD_BASE}${path}`);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
};

const year = String(new Date().getFullYear());

const run = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  const venues = await get('/venues');
  const lines = (venues as Array<Record<string, unknown>>)
    .filter((v) => v.capacity && (v.capacity as number) > 10000)
    .sort((a, b) => (b.capacity as number) - (a.capacity as number))
    .map(
      (v) =>
        `${v.name} (${v.city}, ${v.state}) — Capacity: ${(v.capacity as number).toLocaleString()}` +
        `${v.grass ? ', Grass' : ', Turf'}${v.dome ? ', Dome' : ', Outdoor'}` +
        `\n  Teams: ${Array.isArray(v.teams) ? (v.teams as string[]).join(', ') : 'N/A'}`
    );
  writeFileSync(
    join(OUT_DIR, 'venues.txt'),
    `College Football Venues (FBS stadiums with 10,000+ capacity)\n\n${lines.join('\n\n')}\n`
  );
  console.log(`venues: ${lines.length} stadiums`);

  const conferences = await get('/conferences');
  const confLines = (conferences as Array<Record<string, unknown>>).map(
    (c) => `${c.name} (${c.abbreviation}) — Classification: ${c.classification}`
  );
  writeFileSync(
    join(OUT_DIR, 'conferences.txt'),
    `College Football Conferences\n\n${confLines.join('\n')}\n`
  );
  console.log(`conferences: ${confLines.length}`);

  const teams = await get('/teams/fbs');
  const teamLines = (teams as Array<Record<string, unknown>>)
    .sort((a, b) => String(a.conference ?? '').localeCompare(String(b.conference ?? '')))
    .map((t) => {
      const loc = t.location as Record<string, unknown> | undefined;
      return (
        `${t.school} (${t.abbreviation}) — ${t.conference ?? 'Independent'}` +
        `\n  Mascot: ${t.mascot ?? 'N/A'} | Location: ${loc?.city ?? '?'}, ${loc?.state ?? '?'}` +
        `\n  Venue: ${loc?.name ?? 'N/A'}${loc?.capacity ? ` (${(loc.capacity as number).toLocaleString()})` : ''}`
      );
    });
  writeFileSync(join(OUT_DIR, 'teams.txt'), `FBS Teams (${year})\n\n${teamLines.join('\n\n')}\n`);
  console.log(`teams: ${teamLines.length}`);

  const coachYear = String(Number(year) - 1);
  const coaches = await get('/coaches', {
    year: coachYear,
    minYear: coachYear,
    maxYear: coachYear,
  });
  const coachLines = (coaches as Array<Record<string, unknown>>)
    .map((c) => {
      const seasons = c.seasons as Array<Record<string, unknown>> | undefined;
      const season = seasons?.[0];
      if (!season) return null;
      const record = `${season.wins ?? 0}-${season.losses ?? 0}`;
      return `${c.first_name} ${c.last_name} — ${season.school} (${record} in ${coachYear})`;
    })
    .filter(Boolean)
    .sort();
  writeFileSync(
    join(OUT_DIR, 'coaches.txt'),
    `FBS Head Coaches (as of ${coachYear} season)\n\n${(coachLines as string[]).join('\n')}\n`
  );
  console.log(`coaches: ${coachLines.length}`);

  console.log(`\nFiles written to ${OUT_DIR}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
