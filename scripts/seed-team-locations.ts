import 'dotenv/config';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { getTeamsFromCfbd } from '@/lib/cfb/cfbd-rest-client';
import { CFBD_CONFERENCE_NAME_TO_ABBR } from '@/lib/cfb/constants';

const main = async () => {
  delete process.env.FIXTURE_YEAR;

  const teams = await getTeamsFromCfbd({ classification: 'fbs' });

  const entries: string[] = [];

  for (const team of teams) {
    if (!team.location?.latitude || !team.location?.longitude) continue;
    const confAbbr = team.conference ? CFBD_CONFERENCE_NAME_TO_ABBR[team.conference] : null;
    if (!confAbbr) continue;

    const state = (team.location as { state?: string | null }).state ?? '';
    entries.push(
      `  { teamId: '${team.id}', school: '${team.school.replace(/'/g, "\\'")}', abbreviation: '${team.abbreviation ?? ''}', state: '${state}', latitude: ${team.location.latitude}, longitude: ${team.location.longitude}, conference: '${confAbbr}' },`
    );
  }

  const output = `export interface TeamLocation {
  teamId: string;
  school: string;
  abbreviation: string;
  state: string;
  latitude: number;
  longitude: number;
  conference: string;
}

export const TEAM_LOCATIONS: TeamLocation[] = [
${entries.join('\n')}
];
`;

  const outPath = resolve(process.cwd(), 'lib/geo/team-locations.ts');
  writeFileSync(outPath, output, 'utf-8');
  console.log(`Wrote ${entries.length} team locations to ${outPath}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
