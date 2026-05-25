import path from 'path';
import { promises as fs } from 'fs';
import type { Game } from '@/lib/types';
import type { EspnScoreboardGenerated } from '@/lib/espn/nfl/espn-scoreboard-generated';
import { nflWinPct, type NflTieLog } from '@/lib/nfl/types';
import { reshapeEspnGames } from '@/lib/nfl/reshape-espn';
import { calculatePlayoffPicture } from '@/lib/nfl/tiebreaker-rules/core/calculatePlayoffPicture';
import { getWeekCount, resolveNflAbbrev } from '@/lib/nfl/constants';

const FIXTURE_DIR = path.join(process.cwd(), '__fixtures__', 'espn', 'nfl');

const loadSeasonGames = async (season: number): Promise<Game[]> => {
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

const findTieLog = (
  logs: NflTieLog[],
  procedure: 'division' | 'wildcard',
  teamAbbrevs: string[]
): NflTieLog | undefined =>
  logs.find(
    (log) =>
      log.procedure === procedure &&
      teamAbbrevs.every((a) => log.teams.includes(resolveNflAbbrev(a)))
  );

describe('NFL Historical Tiebreaker Scenarios', () => {
  describe('2006 AFC: Same-division wild card — KC over DEN via division tiebreaker', () => {
    let games: Game[];

    beforeAll(async () => {
      games = await loadSeasonGames(2006);
    });

    it('engine applies Same Division rule, not wild card rules', () => {
      const result = calculatePlayoffPicture(games, 2006);
      const log = findTieLog(result.tieLogs, 'wildcard', ['KC', 'DEN']);
      expect(log).toBeDefined();
      const sameDivStep = log!.steps.find((s) => s.rule === 'Same Division');
      expect(sameDivStep).toBeDefined();
      expect(sameDivStep!.tieBroken).toBe(true);
    });

    it('KC earns 6th seed, DEN eliminated (pre-2020: 6 per conference)', () => {
      const result = calculatePlayoffPicture(games, 2006);
      const afc = result.bracket.afc.map((e) => e.abbrev);
      expect(afc[5]).toBe('KC');
      expect(afc).not.toContain('DEN');
      expect(afc).toHaveLength(6);
    });
  });

  describe('2020 AFC: Multi-team wild card with division elimination — BAL/CLE/IND', () => {
    let games: Game[];

    beforeAll(async () => {
      games = await loadSeasonGames(2020);
    });

    it('BAL ranks above CLE in division standings, enabling division elimination', () => {
      const result = calculatePlayoffPicture(games, 2020);
      const afcNorth = result.divisionStandings['AFC North'];
      const balIdx = afcNorth.findIndex((e) => e.abbrev === 'BAL');
      const cleIdx = afcNorth.findIndex((e) => e.abbrev === 'CLE');
      expect(balIdx).toBeLessThan(cleIdx);
    });

    it('seeds BAL=5, CLE=6, IND=7 in 7-team bracket', () => {
      const result = calculatePlayoffPicture(games, 2020);
      const afc = result.bracket.afc.map((e) => e.abbrev);
      expect(afc[4]).toBe('BAL');
      expect(afc[5]).toBe('CLE');
      expect(afc[6]).toBe('IND');
      expect(afc).toHaveLength(7);
    });
  });

  describe('2023 AFC: Conference record breaks cross-division wild card tie — CLE over MIA', () => {
    let games: Game[];

    beforeAll(async () => {
      games = await loadSeasonGames(2023);
    });

    it('tie log shows Conference Record as the breaking rule', () => {
      const result = calculatePlayoffPicture(games, 2023);
      const log = findTieLog(result.tieLogs, 'wildcard', ['CLE', 'MIA']);
      expect(log).toBeDefined();
      const confStep = log!.steps.find((s) => s.rule === 'Conference Record' && s.tieBroken);
      expect(confStep).toBeDefined();
    });

    it('CLE seeds above MIA in final bracket', () => {
      const result = calculatePlayoffPicture(games, 2023);
      const afc = result.bracket.afc.map((e) => e.abbrev);
      expect(afc.indexOf('CLE')).toBeLessThan(afc.indexOf('MIA'));
    });
  });

  describe('2010 NFC: Three-way wild card resolved by SOV — GB over NYG and TB', () => {
    let games: Game[];

    beforeAll(async () => {
      games = await loadSeasonGames(2010);
    });

    it('GB earns a wild card seed, NYG and TB do not', () => {
      const result = calculatePlayoffPicture(games, 2010);
      const nfc = result.bracket.nfc.map((e) => e.abbrev);
      expect(nfc).toContain('GB');
      expect(nfc).not.toContain('NYG');
      expect(nfc).not.toContain('TB');
    });
  });

  describe('2011 AFC: Wild card H2H between cross-division teams — CIN over TEN', () => {
    let games: Game[];

    beforeAll(async () => {
      games = await loadSeasonGames(2011);
    });

    it('CIN earns the 6th seed', () => {
      const result = calculatePlayoffPicture(games, 2011);
      const afc = result.bracket.afc.map((e) => e.abbrev);
      expect(afc[5]).toBe('CIN');
      expect(afc).not.toContain('TEN');
    });
  });

  describe('2019 NFC: Division winner seeding — GB over NO via conference record', () => {
    let games: Game[];

    beforeAll(async () => {
      games = await loadSeasonGames(2019);
    });

    it('GB seeds 2nd, NO seeds 3rd among division winners', () => {
      const result = calculatePlayoffPicture(games, 2019);
      const nfc = result.bracket.nfc.map((e) => e.abbrev);
      expect(nfc[1]).toBe('GB');
      expect(nfc[2]).toBe('NO');
    });

    it('both are division winners', () => {
      const result = calculatePlayoffPicture(games, 2019);
      const gb = result.bracket.nfc.find((e) => e.abbrev === 'GB');
      const no = result.bracket.nfc.find((e) => e.abbrev === 'NO');
      expect(gb!.isDivisionWinner).toBe(true);
      expect(no!.isDivisionWinner).toBe(true);
    });
  });

  describe('Playoff size branching', () => {
    it('pre-2020 produces 6-team brackets', async () => {
      const games = await loadSeasonGames(2019);
      const result = calculatePlayoffPicture(games, 2019);
      expect(result.bracket.afc).toHaveLength(6);
      expect(result.bracket.nfc).toHaveLength(6);
    });

    it('post-2020 produces 7-team brackets', async () => {
      const games = await loadSeasonGames(2021);
      const result = calculatePlayoffPicture(games, 2021);
      expect(result.bracket.afc).toHaveLength(7);
      expect(result.bracket.nfc).toHaveLength(7);
    });
  });

  describe('Division standings drive wildcard ordering', () => {
    it('division winners are flagged correctly', async () => {
      const games = await loadSeasonGames(2024);
      const result = calculatePlayoffPicture(games, 2024);

      for (const divId of Object.keys(result.divisionStandings)) {
        const standings = result.divisionStandings[divId];
        expect(standings[0].isDivisionWinner).toBe(true);
        for (let i = 1; i < standings.length; i++) {
          expect(standings[i].isDivisionWinner).toBe(false);
        }
      }
    });

    it('division winner win% >= non-winner win% within each division', async () => {
      const games = await loadSeasonGames(2024);
      const result = calculatePlayoffPicture(games, 2024);

      for (const divId of Object.keys(result.divisionStandings)) {
        const standings = result.divisionStandings[divId];
        const winnerPct = nflWinPct(standings[0].record);
        for (let i = 1; i < standings.length; i++) {
          expect(winnerPct).toBeGreaterThanOrEqual(nflWinPct(standings[i].record) - 0.0001);
        }
      }
    });
  });
});
