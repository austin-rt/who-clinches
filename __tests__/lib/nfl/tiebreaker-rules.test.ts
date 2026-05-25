import { createNflGame } from './test-helpers';
import { applyH2H } from '@/lib/nfl/tiebreaker-rules/rules/h2h';
import { applyH2HSweep } from '@/lib/nfl/tiebreaker-rules/rules/h2h-sweep';
import {
  applyCommonGamesDivision,
  applyCommonGamesWildCard,
} from '@/lib/nfl/tiebreaker-rules/rules/common-games';
import { applySOV } from '@/lib/nfl/tiebreaker-rules/rules/sov';
import { applySOS } from '@/lib/nfl/tiebreaker-rules/rules/sos';
import {
  applyCombinedRankingConference,
  applyCombinedRankingAll,
} from '@/lib/nfl/tiebreaker-rules/rules/combined-ranking';
import {
  applyNetPointsAll,
  applyNetPointsConference,
  applyNetPointsCommon,
} from '@/lib/nfl/tiebreaker-rules/rules/net-points';
import { applyNetTDs } from '@/lib/nfl/tiebreaker-rules/rules/net-tds';
import { breakTie } from '@/lib/nfl/tiebreaker-rules/core/breakTie';
import { DIVISION_TIEBREAKER_CONFIG } from '@/lib/nfl/tiebreaker-rules/division-config';
import { WILDCARD_TIEBREAKER_CONFIG } from '@/lib/nfl/tiebreaker-rules/wildcard-config';
import { getTeamRecord, formatRecord } from '@/lib/nfl/tiebreaker-rules/helpers';
import { nflWinPct } from '@/lib/nfl/types';
import { applyNflOverrides } from '@/lib/nfl/runNflSimulation';
import type { NflRankedTeam } from '@/lib/nfl/tiebreaker-rules/core/calculateStandings';

describe('NFL helpers', () => {
  describe('getTeamRecord', () => {
    it('counts wins losses and ties', () => {
      const games = [
        createNflGame({
          homeId: 'A',
          homeAbbrev: 'A',
          awayId: 'B',
          awayAbbrev: 'B',
          homeScore: 24,
          awayScore: 17,
        }),
        createNflGame({
          homeId: 'C',
          homeAbbrev: 'C',
          awayId: 'A',
          awayAbbrev: 'A',
          homeScore: 21,
          awayScore: 21,
        }),
        createNflGame({
          homeId: 'A',
          homeAbbrev: 'A',
          awayId: 'D',
          awayAbbrev: 'D',
          homeScore: 10,
          awayScore: 20,
        }),
      ];
      const record = getTeamRecord('A', games);
      expect(record).toEqual({ wins: 1, losses: 1, ties: 1 });
    });

    it('skips games with null scores', () => {
      const games = [
        createNflGame({
          homeId: 'A',
          homeAbbrev: 'A',
          awayId: 'B',
          awayAbbrev: 'B',
          homeScore: 24,
          awayScore: 17,
        }),
        createNflGame({
          homeId: 'A',
          homeAbbrev: 'A',
          awayId: 'C',
          awayAbbrev: 'C',
          homeScore: null,
          awayScore: null,
          completed: false,
        }),
      ];
      const record = getTeamRecord('A', games);
      expect(record).toEqual({ wins: 1, losses: 0, ties: 0 });
    });
  });

  describe('nflWinPct', () => {
    it('computes (W + 0.5T) / total', () => {
      expect(nflWinPct({ wins: 10, losses: 5, ties: 2 })).toBeCloseTo(0.6471, 4);
    });

    it('returns 0 for empty record', () => {
      expect(nflWinPct({ wins: 0, losses: 0, ties: 0 })).toBe(0);
    });
  });

  describe('formatRecord', () => {
    it('includes ties when present', () => {
      expect(formatRecord({ wins: 10, losses: 5, ties: 2 })).toBe('10-5-2');
    });

    it('omits ties when zero', () => {
      expect(formatRecord({ wins: 10, losses: 5, ties: 0 })).toBe('10-5');
    });
  });
});

describe('Head-to-Head (Division)', () => {
  it('picks the team with better H2H record', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'A',
        awayAbbrev: 'A',
        homeScore: 14,
        awayScore: 21,
      }),
    ];
    const result = applyH2H(['A', 'B'], games, games);
    expect(result.winners).toEqual(['A']);
  });

  it('is inconclusive when H2H split', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'A',
        awayAbbrev: 'A',
        homeScore: 28,
        awayScore: 21,
      }),
    ];
    const result = applyH2H(['A', 'B'], games, games);
    expect(result.winners).toEqual(expect.arrayContaining(['A', 'B']));
    expect(result.winners).toHaveLength(2);
  });

  it('treats ties as 0.5 win in H2H calculation', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 24,
        awayScore: 24,
      }),
    ];
    const result = applyH2H(['A', 'B'], games, games);
    expect(result.winners).toHaveLength(2);
  });

  it('is inconclusive when no H2H games exist', () => {
    const result = applyH2H(['A', 'B'], [], []);
    expect(result.winners).toEqual(['A', 'B']);
    expect(result.detail).toContain('No head-to-head');
  });
});

describe('Head-to-Head Sweep (Wild Card)', () => {
  it('identifies a team that beat all others', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'C',
        awayAbbrev: 'C',
        homeScore: 21,
        awayScore: 14,
      }),
    ];
    const result = applyH2HSweep(['A', 'B', 'C'], games, games);
    expect(result.winners).toEqual(['A']);
    expect(result.detail).toContain('swept');
  });

  it('is inconclusive when no team swept', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'C',
        homeAbbrev: 'C',
        awayId: 'A',
        awayAbbrev: 'A',
        homeScore: 28,
        awayScore: 21,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'C',
        awayAbbrev: 'C',
        homeScore: 21,
        awayScore: 14,
      }),
    ];
    const result = applyH2HSweep(['A', 'B', 'C'], games, games);
    expect(result.winners).toHaveLength(3);
    expect(result.detail).toContain('No team swept');
  });

  it('requires beating ALL opponents — missing matchup blocks sweep', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 24,
        awayScore: 17,
      }),
    ];
    const result = applyH2HSweep(['A', 'B', 'C'], games, games);
    expect(result.winners).toHaveLength(3);
  });

  it('tied game prevents sweep', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'C',
        awayAbbrev: 'C',
        homeScore: 21,
        awayScore: 21,
      }),
    ];
    const result = applyH2HSweep(['A', 'B', 'C'], games, games);
    expect(result.winners).toHaveLength(3);
  });
});

describe('Common Games', () => {
  it('division variant breaks tie with any common opponents', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'X',
        awayAbbrev: 'X',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'X',
        awayAbbrev: 'X',
        homeScore: 14,
        awayScore: 21,
      }),
    ];
    const result = applyCommonGamesDivision(['A', 'B'], games, games);
    expect(result.winners).toEqual(['A']);
  });

  it('wild card variant requires 4+ common opponents', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'X',
        awayAbbrev: 'X',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'X',
        awayAbbrev: 'X',
        homeScore: 14,
        awayScore: 21,
      }),
    ];
    const result = applyCommonGamesWildCard(['A', 'B'], games, games);
    expect(result.winners).toHaveLength(2);
    expect(result.detail).toContain('need 4');
  });
});

describe('SOV', () => {
  it('picks team whose beaten opponents have better combined record', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'X',
        awayAbbrev: 'X',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'Y',
        awayAbbrev: 'Y',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'X',
        homeAbbrev: 'X',
        awayId: 'Z',
        awayAbbrev: 'Z',
        homeScore: 30,
        awayScore: 10,
      }),
      createNflGame({
        homeId: 'Y',
        homeAbbrev: 'Y',
        awayId: 'Z',
        awayAbbrev: 'Z',
        homeScore: 10,
        awayScore: 30,
      }),
    ];
    const result = applySOV(['A', 'B'], games, games);
    expect(result.winners).toEqual(['A']);
  });

  it('returns 0 SOV for team with no wins', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 10,
        awayScore: 24,
      }),
      createNflGame({
        homeId: 'C',
        homeAbbrev: 'C',
        awayId: 'D',
        awayAbbrev: 'D',
        homeScore: 10,
        awayScore: 24,
      }),
    ];
    const result = applySOV(['A', 'C'], games, games);
    expect(result.winners).toHaveLength(2);
    expect(result.detail).toContain('.000');
  });
});

describe('SOS', () => {
  it('picks team whose opponents have better combined record', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'X',
        awayAbbrev: 'X',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'Y',
        awayAbbrev: 'Y',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'X',
        homeAbbrev: 'X',
        awayId: 'Z',
        awayAbbrev: 'Z',
        homeScore: 30,
        awayScore: 10,
      }),
      createNflGame({
        homeId: 'Y',
        homeAbbrev: 'Y',
        awayId: 'Z',
        awayAbbrev: 'Z',
        homeScore: 10,
        awayScore: 30,
      }),
    ];
    const result = applySOS(['A', 'B'], games, games);
    expect(result.winners).toEqual(['A']);
  });
});

describe('Combined Ranking', () => {
  it('picks team with best PF rank + PA rank sum within conference', () => {
    const games = [
      createNflGame({
        homeId: '12',
        homeAbbrev: 'KC',
        awayId: '7',
        awayAbbrev: 'DEN',
        homeScore: 30,
        awayScore: 10,
      }),
      createNflGame({
        homeId: '13',
        homeAbbrev: 'LV',
        awayId: '24',
        awayAbbrev: 'LAC',
        homeScore: 20,
        awayScore: 25,
      }),
    ];
    const result = applyCombinedRankingConference(['12', '7'], games, games);
    expect(result.winners).toEqual(['12']);
  });

  it('uses all 32-team scope for all-teams variant', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 40,
        awayScore: 10,
      }),
      createNflGame({
        homeId: 'C',
        homeAbbrev: 'C',
        awayId: 'D',
        awayAbbrev: 'D',
        homeScore: 20,
        awayScore: 30,
      }),
    ];
    const result = applyCombinedRankingAll(['A', 'C'], games, games);
    expect(result.winners).toEqual(['A']);
    expect(result.detail).toContain('all teams');
  });
});

describe('Net Points', () => {
  it('picks team with highest point differential across all games', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'X',
        awayAbbrev: 'X',
        homeScore: 30,
        awayScore: 10,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'Y',
        awayAbbrev: 'Y',
        homeScore: 24,
        awayScore: 21,
      }),
    ];
    const result = applyNetPointsAll(['A', 'B'], games, games);
    expect(result.winners).toEqual(['A']);
    expect(result.detail).toContain('+20');
  });

  it('scopes to conference games for conference variant', () => {
    const games = [
      createNflGame({
        homeId: '12',
        homeAbbrev: 'KC',
        awayId: '7',
        awayAbbrev: 'DEN',
        homeScore: 30,
        awayScore: 10,
      }),
      createNflGame({
        homeId: '12',
        homeAbbrev: 'KC',
        awayId: '6',
        awayAbbrev: 'DAL',
        homeScore: 10,
        awayScore: 40,
      }),
      createNflGame({
        homeId: '13',
        homeAbbrev: 'LV',
        awayId: '24',
        awayAbbrev: 'LAC',
        homeScore: 20,
        awayScore: 17,
      }),
    ];
    const result = applyNetPointsConference(['12', '13'], games, games);
    expect(result.detail).toContain('conference');
    expect(result.winners).toEqual(['12']);
  });

  it('scopes to common opponents for common variant', () => {
    const commonOpp = 'X';
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: commonOpp,
        awayAbbrev: 'X',
        homeScore: 30,
        awayScore: 10,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: commonOpp,
        awayAbbrev: 'X',
        homeScore: 20,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'Y',
        awayAbbrev: 'Y',
        homeScore: 3,
        awayScore: 50,
      }),
    ];
    const result = applyNetPointsCommon(['A', 'B'], games, games);
    expect(result.winners).toEqual(['A']);
    expect(result.detail).toContain('common');
  });

  it('is inconclusive when no common opponents exist', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'X',
        awayAbbrev: 'X',
        homeScore: 30,
        awayScore: 10,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'Y',
        awayAbbrev: 'Y',
        homeScore: 20,
        awayScore: 17,
      }),
    ];
    const result = applyNetPointsCommon(['A', 'B'], games, games);
    expect(result.winners).toHaveLength(2);
    expect(result.detail).toContain('No common');
  });
});

describe('Net TDs', () => {
  it('is always unresolvable in simulation', () => {
    const result = applyNetTDs(['A', 'B']);
    expect(result.winners).toEqual(['A', 'B']);
    expect(result.detail).toContain('unresolvable');
  });
});

describe('breakTie core', () => {
  it('returns single team without steps', () => {
    const result = breakTie(['A'], [], [], DIVISION_TIEBREAKER_CONFIG);
    expect(result.ranked).toEqual(['A']);
    expect(result.steps).toHaveLength(0);
  });

  it('resolves 2-team tie via first applicable rule', () => {
    const games = [
      createNflGame({
        homeId: '12',
        homeAbbrev: 'KC',
        awayId: '13',
        awayAbbrev: 'LV',
        homeScore: 27,
        awayScore: 20,
      }),
      createNflGame({
        homeId: '13',
        homeAbbrev: 'LV',
        awayId: '12',
        awayAbbrev: 'KC',
        homeScore: 17,
        awayScore: 24,
      }),
    ];
    const result = breakTie(['12', '13'], games, games, DIVISION_TIEBREAKER_CONFIG);
    expect(result.ranked[0]).toBe('12');
    const breakingStep = result.steps.find((s) => s.tieBroken);
    expect(breakingStep?.rule).toBe(DIVISION_TIEBREAKER_CONFIG.rules[0].name);
  });

  it('restarts from step 1 after eliminating one team from 3-way tie', () => {
    const games = [
      createNflGame({
        homeId: 'A',
        homeAbbrev: 'A',
        awayId: 'B',
        awayAbbrev: 'B',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: 'B',
        homeAbbrev: 'B',
        awayId: 'C',
        awayAbbrev: 'C',
        homeScore: 28,
        awayScore: 14,
      }),
      createNflGame({
        homeId: 'C',
        homeAbbrev: 'C',
        awayId: 'A',
        awayAbbrev: 'A',
        homeScore: 10,
        awayScore: 21,
      }),
    ];
    const result = breakTie(['A', 'B', 'C'], games, games, DIVISION_TIEBREAKER_CONFIG);
    expect(result.ranked).toHaveLength(3);
    expect(result.ranked[0]).toBe('A');
  });

  it('falls through to coin toss when no rule breaks the tie', () => {
    const result = breakTie(['A', 'B'], [], [], DIVISION_TIEBREAKER_CONFIG);
    expect(result.ranked).toHaveLength(2);
    expect(result.steps[result.steps.length - 1].rule).toBe('Coin Toss');
  });

  it('resolves same-division teams by division rankings when divisionRankings provided', () => {
    const divisionRankings = new Map<string, NflRankedTeam[]>([
      [
        'AFC West',
        [
          { teamId: '24', rank: 1 },
          { teamId: '12', rank: 2 },
          { teamId: '7', rank: 3 },
          { teamId: '13', rank: 4 },
        ],
      ],
    ]);
    const result = breakTie(['7', '12'], [], [], WILDCARD_TIEBREAKER_CONFIG, divisionRankings);
    expect(result.ranked).toEqual(['12', '7']);
    expect(result.steps[0].rule).toBe('Same Division');
    expect(result.steps[0].tieBroken).toBe(true);
  });

  it('does not apply same-division shortcut when teams are from different divisions', () => {
    const divisionRankings = new Map<string, NflRankedTeam[]>([
      ['AFC West', [{ teamId: '12', rank: 2 }]],
      ['AFC North', [{ teamId: '23', rank: 2 }]],
    ]);
    const result = breakTie(['12', '23'], [], [], WILDCARD_TIEBREAKER_CONFIG, divisionRankings);
    expect(result.steps[0].rule).not.toBe('Same Division');
  });

  it('eliminates all but best-per-division in 3+ team wildcard tie', () => {
    const games = [
      createNflGame({
        homeId: '12',
        homeAbbrev: 'KC',
        awayId: '23',
        awayAbbrev: 'PIT',
        homeScore: 24,
        awayScore: 17,
      }),
      createNflGame({
        homeId: '7',
        homeAbbrev: 'DEN',
        awayId: '23',
        awayAbbrev: 'PIT',
        homeScore: 21,
        awayScore: 14,
      }),
    ];
    const divisionRankings = new Map<string, NflRankedTeam[]>([
      [
        'AFC West',
        [
          { teamId: '24', rank: 1 },
          { teamId: '12', rank: 2 },
          { teamId: '7', rank: 3 },
          { teamId: '13', rank: 4 },
        ],
      ],
      [
        'AFC North',
        [
          { teamId: '33', rank: 1 },
          { teamId: '23', rank: 2 },
          { teamId: '4', rank: 3 },
          { teamId: '5', rank: 4 },
        ],
      ],
    ]);
    const result = breakTie(
      ['12', '7', '23'],
      games,
      games,
      WILDCARD_TIEBREAKER_CONFIG,
      divisionRankings
    );
    expect(result.ranked[0]).toBe('12');
    const divElimStep = result.steps.find((s) => s.rule === 'Division Elimination');
    expect(divElimStep).toBeDefined();
    expect(divElimStep!.tieBroken).toBe(true);
  });
});

describe('config validation', () => {
  it(`division config has ${DIVISION_TIEBREAKER_CONFIG.rules.length} rules`, () => {
    expect(DIVISION_TIEBREAKER_CONFIG.rules.length).toBe(11);
  });

  it('division config starts with H2H, not sweep', () => {
    expect(DIVISION_TIEBREAKER_CONFIG.rules[0].name).toBe('Head-to-Head');
  });

  it('wildcard config starts with sweep, not H2H', () => {
    expect(WILDCARD_TIEBREAKER_CONFIG.rules[0].name).toBe('Head-to-Head Sweep');
  });
});

describe('applyNflOverrides', () => {
  it('throws when game has no scores, no overrides, and no predictedScore', () => {
    const game = createNflGame({
      homeId: 'A',
      homeAbbrev: 'A',
      awayId: 'B',
      awayAbbrev: 'B',
      homeScore: null,
      awayScore: null,
      completed: false,
    });
    game.predictedScore = null as unknown as typeof game.predictedScore;

    expect(() => applyNflOverrides([game], {})).toThrow(
      'no scores, no overrides, and no predictedScore'
    );
  });

  it('fills unplayed games from predictedScore when no override', () => {
    const game = createNflGame({
      homeId: 'A',
      homeAbbrev: 'A',
      awayId: 'B',
      awayAbbrev: 'B',
      homeScore: null,
      awayScore: null,
      completed: false,
    });
    const result = applyNflOverrides([game], {});
    expect(result[0].home.score).toBe(game.predictedScore!.home);
    expect(result[0].away.score).toBe(game.predictedScore!.away);
    expect(result[0].completed).toBe(true);
  });

  it('applies explicit override over existing scores', () => {
    const game = createNflGame({
      homeId: 'A',
      homeAbbrev: 'A',
      awayId: 'B',
      awayAbbrev: 'B',
      homeScore: 24,
      awayScore: 17,
    });
    const result = applyNflOverrides([game], { [game.id]: { homeScore: 10, awayScore: 10 } });
    expect(result[0].home.score).toBe(10);
    expect(result[0].away.score).toBe(10);
  });

  it('allows tied scores (NFL games can tie)', () => {
    const game = createNflGame({
      homeId: 'A',
      homeAbbrev: 'A',
      awayId: 'B',
      awayAbbrev: 'B',
      homeScore: null,
      awayScore: null,
      completed: false,
    });
    const result = applyNflOverrides([game], { [game.id]: { homeScore: 17, awayScore: 17 } });
    expect(result[0].home.score).toBe(17);
    expect(result[0].away.score).toBe(17);
  });
});
