/**
 * Unit Tests: Application Constants
 *
 * Tests for constants validation and data integrity.
 * Verifies SEC teams list, conference IDs, and record type definitions.
 */

import {
  SEC_TEAMS,
  SEC_CONFERENCE_ID,
  RECORD_TYPE_OVERALL,
  RECORD_TYPE_HOME,
  RECORD_TYPE_AWAY,
  RECORD_TYPE_CONFERENCE,
  STAT_AVG_POINTS_FOR,
  STAT_AVG_POINTS_AGAINST,
  STAT_WINS,
  STAT_LOSSES,
  STAT_DIFFERENTIAL,
  ALL_TEAMS,
  CONFERENCE_TEAMS_MAP,
} from '@/lib/constants';

describe('SEC Teams Constant', () => {
  it('contains all 16 SEC teams', () => {
    expect(SEC_TEAMS).toHaveLength(16);
  });

  it('contains correct team abbreviations', () => {
    const expectedTeams = [
      'ALA',
      'ARK',
      'AUB',
      'FLA',
      'UGA',
      'UK',
      'LSU',
      'MISS',
      'MSST',
      'MIZ',
      'OU',
      'SC',
      'TENN',
      'TEX',
      'TA&M',
      'VAN',
    ];

    expectedTeams.forEach((team) => {
      expect(SEC_TEAMS).toContain(team);
    });
  });

  it('has no duplicate team abbreviations', () => {
    const uniqueTeams = new Set(SEC_TEAMS);
    expect(uniqueTeams.size).toBe(SEC_TEAMS.length);
  });

  it('contains only uppercase abbreviations', () => {
    SEC_TEAMS.forEach((team) => {
      expect(team).toBe(team.toUpperCase());
    });
  });

  it('all abbreviations are strings', () => {
    SEC_TEAMS.forEach((team) => {
      expect(typeof team).toBe('string');
      expect(team.length).toBeGreaterThan(0);
    });
  });

  it('includes Alabama (ALA)', () => {
    expect(SEC_TEAMS).toContain('ALA');
  });

  it('includes LSU', () => {
    expect(SEC_TEAMS).toContain('LSU');
  });

  it('includes Texas (TEX)', () => {
    expect(SEC_TEAMS).toContain('TEX');
  });

  it('includes Oklahoma (OU)', () => {
    expect(SEC_TEAMS).toContain('OU');
  });

  it('includes new additions (Texas and Oklahoma)', () => {
    expect(SEC_TEAMS).toContain('TEX');
    expect(SEC_TEAMS).toContain('OU');
  });
});

describe('SEC Conference ID', () => {
  it('is 8 for ESPN API queries', () => {
    expect(SEC_CONFERENCE_ID).toBe(8);
  });

  it('is a number', () => {
    expect(typeof SEC_CONFERENCE_ID).toBe('number');
  });

  it('is greater than 0', () => {
    expect(SEC_CONFERENCE_ID).toBeGreaterThan(0);
  });

  it('matches ESPN scoreboard API convention', () => {
    // ESPN uses 8 for SEC in queries
    expect(SEC_CONFERENCE_ID).toBe(8);
  });
});

describe('Record Type Constants', () => {
  it('RECORD_TYPE_OVERALL is "overall"', () => {
    expect(RECORD_TYPE_OVERALL).toBe('overall');
  });

  it('RECORD_TYPE_HOME is "homerecord"', () => {
    expect(RECORD_TYPE_HOME).toBe('homerecord');
  });

  it('RECORD_TYPE_AWAY is "awayrecord"', () => {
    expect(RECORD_TYPE_AWAY).toBe('awayrecord');
  });

  it('RECORD_TYPE_CONFERENCE is "vsconf"', () => {
    expect(RECORD_TYPE_CONFERENCE).toBe('vsconf');
  });

  it('record types are unique', () => {
    const types = [
      RECORD_TYPE_OVERALL,
      RECORD_TYPE_HOME,
      RECORD_TYPE_AWAY,
      RECORD_TYPE_CONFERENCE,
    ];
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(4);
  });

  it('record types are non-empty strings', () => {
    [RECORD_TYPE_OVERALL, RECORD_TYPE_HOME, RECORD_TYPE_AWAY, RECORD_TYPE_CONFERENCE].forEach(
      (type) => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      }
    );
  });
});

describe('Stat Name Constants', () => {
  it('STAT_AVG_POINTS_FOR is "avgPointsFor"', () => {
    expect(STAT_AVG_POINTS_FOR).toBe('avgPointsFor');
  });

  it('STAT_AVG_POINTS_AGAINST is "avgPointsAgainst"', () => {
    expect(STAT_AVG_POINTS_AGAINST).toBe('avgPointsAgainst');
  });

  it('STAT_WINS is "wins"', () => {
    expect(STAT_WINS).toBe('wins');
  });

  it('STAT_LOSSES is "losses"', () => {
    expect(STAT_LOSSES).toBe('losses');
  });

  it('STAT_DIFFERENTIAL is "differential"', () => {
    expect(STAT_DIFFERENTIAL).toBe('differential');
  });

  it('stat names are unique', () => {
    const stats = [
      STAT_AVG_POINTS_FOR,
      STAT_AVG_POINTS_AGAINST,
      STAT_WINS,
      STAT_LOSSES,
      STAT_DIFFERENTIAL,
    ];
    const uniqueStats = new Set(stats);
    expect(uniqueStats.size).toBe(5);
  });

  it('stat names use camelCase', () => {
    const stats = [
      STAT_AVG_POINTS_FOR,
      STAT_AVG_POINTS_AGAINST,
      STAT_WINS,
      STAT_LOSSES,
      STAT_DIFFERENTIAL,
    ];
    stats.forEach((stat) => {
      // Should not contain underscores (camelCase)
      expect(stat).not.toMatch(/_/);
    });
  });
});

describe('ALL_TEAMS Constant', () => {
  it('includes all SEC teams', () => {
    SEC_TEAMS.forEach((team) => {
      expect(ALL_TEAMS).toContain(team);
    });
  });

  it('has length equal to SEC_TEAMS', () => {
    expect(ALL_TEAMS).toHaveLength(SEC_TEAMS.length);
  });

  it('contains exactly 16 teams', () => {
    expect(ALL_TEAMS).toHaveLength(16);
  });

  it('has no duplicates', () => {
    const uniqueTeams = new Set(ALL_TEAMS);
    expect(uniqueTeams.size).toBe(ALL_TEAMS.length);
  });
});

describe('CONFERENCE_TEAMS_MAP', () => {
  it('includes SEC conference', () => {
    expect(CONFERENCE_TEAMS_MAP).toHaveProperty(String(SEC_CONFERENCE_ID));
  });

  it('SEC conference has 16 teams', () => {
    expect(CONFERENCE_TEAMS_MAP[SEC_CONFERENCE_ID]).toHaveLength(16);
  });

  it('SEC teams match SEC_TEAMS constant', () => {
    expect(CONFERENCE_TEAMS_MAP[SEC_CONFERENCE_ID]).toEqual(SEC_TEAMS);
  });

  it('map keys are numbers', () => {
    Object.keys(CONFERENCE_TEAMS_MAP).forEach((key) => {
      const keyNum = parseInt(key, 10);
      expect(keyNum).toBeGreaterThan(0);
    });
  });

  it('map values are string arrays', () => {
    Object.values(CONFERENCE_TEAMS_MAP).forEach((teams) => {
      expect(Array.isArray(teams)).toBe(true);
      teams.forEach((team) => {
        expect(typeof team).toBe('string');
      });
    });
  });

  it('all conference teams are uppercase', () => {
    Object.values(CONFERENCE_TEAMS_MAP).forEach((teams) => {
      teams.forEach((team) => {
        expect(team).toBe(team.toUpperCase());
      });
    });
  });
});

describe('Constant Consistency', () => {
  it('RECORD_TYPE values should be useful for filtering ESPN records', () => {
    // These values are used to filter ESPN API record arrays
    const mockRecords = [
      { type: RECORD_TYPE_OVERALL, summary: '10-2' },
      { type: RECORD_TYPE_HOME, summary: '5-0' },
      { type: RECORD_TYPE_AWAY, summary: '5-2' },
      { type: RECORD_TYPE_CONFERENCE, summary: '7-1' },
    ];

    // Should be able to find each type
    mockRecords.forEach((record) => {
      const found = mockRecords.find((r) => r.type === record.type);
      expect(found).toEqual(record);
    });
  });

  it('STAT names should be ESPN API field names', () => {
    const mockStats = [
      { name: STAT_WINS, value: 10 },
      { name: STAT_LOSSES, value: 2 },
      { name: STAT_AVG_POINTS_FOR, value: 31.5 },
      { name: STAT_AVG_POINTS_AGAINST, value: 20.3 },
      { name: STAT_DIFFERENTIAL, value: 200 },
    ];

    // Should be able to find each stat by name
    mockStats.forEach((stat) => {
      const found = mockStats.find((s) => s.name === stat.name);
      expect(found).toEqual(stat);
    });
  });

  it('SEC_CONFERENCE_ID should match expected ESPN value', () => {
    // ESPN uses 8 for SEC conference queries
    const espnConferenceId = 8;
    expect(SEC_CONFERENCE_ID).toBe(espnConferenceId);
  });

  it('team count should match SEC expansion to 16 teams', () => {
    // As of 2024, SEC has 16 teams (added Texas and Oklahoma)
    expect(SEC_TEAMS).toHaveLength(16);
  });
});
