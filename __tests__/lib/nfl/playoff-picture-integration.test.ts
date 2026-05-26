import path from 'path';
import { promises as fs } from 'fs';
import type { EspnScoreboardGenerated } from '@/lib/espn/nfl/espn-scoreboard-generated';
import { reshapeEspnGames } from '@/lib/nfl/reshape-espn';
import { runNflSimulation } from '@/lib/nfl/runNflSimulation';
import { getWeekCount, resolveNflAbbrev } from '@/lib/nfl/constants';

const FIXTURE_DIR = path.join(process.cwd(), '__fixtures__', 'espn', 'nfl');

const loadSeasonGames = async (season: number) => {
  const weekCount = getWeekCount(season);
  const events = [];
  const seen = new Set<string>();

  for (let week = 1; week <= weekCount; week++) {
    const filePath = path.join(FIXTURE_DIR, 'scoreboard', String(season), `week-${week}.json`);
    const raw = await fs.readFile(filePath, 'utf-8');
    const scoreboard = JSON.parse(raw) as EspnScoreboardGenerated;
    for (const e of scoreboard.events) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        events.push(e);
      }
    }
  }

  return reshapeEspnGames(events, season);
};

const loadExpectedSeedings = async (season: number): Promise<{ afc: string[]; nfc: string[] }> => {
  const filePath = path.join(FIXTURE_DIR, 'expected-seedings', `${season}.json`);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
};

const SEASONS = Array.from({ length: 24 }, (_, i) => 2002 + i);

describe('NFL Playoff Picture Integration', () => {
  for (const season of SEASONS) {
    it(`produces correct playoff seedings for ${season}`, async () => {
      const games = await loadSeasonGames(season);
      const expected = await loadExpectedSeedings(season);

      const result = runNflSimulation(games, season);

      const actualAfc = result.bracket.afc.map((e) => e.abbrev);
      const actualNfc = result.bracket.nfc.map((e) => e.abbrev);

      const expectedAfc = expected.afc.map(resolveNflAbbrev);
      const expectedNfc = expected.nfc.map(resolveNflAbbrev);

      expect(actualAfc).toEqual(expectedAfc);
      expect(actualNfc).toEqual(expectedNfc);
    }, 30000);
  }
});
