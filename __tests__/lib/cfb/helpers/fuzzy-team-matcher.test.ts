import { createTeamMatcher, type TeamIndexEntry } from '@/lib/cfb/helpers/fuzzy-team-matcher';

const TEAMS: TeamIndexEntry[] = [
  {
    id: 1,
    school: 'Alabama',
    mascot: 'Crimson Tide',
    abbreviation: 'ALA',
    alternateNames: ['ALA', 'Alabama'],
    conference: 'SEC',
  },
  {
    id: 2,
    school: 'Ohio State',
    mascot: 'Buckeyes',
    abbreviation: 'OSU',
    alternateNames: ['OSU', 'Ohio State'],
    conference: 'Big Ten',
  },
  {
    id: 3,
    school: 'Ole Miss',
    mascot: 'Rebels',
    abbreviation: 'MISS',
    alternateNames: ['MISS', 'Ole Miss'],
    conference: 'SEC',
  },
  {
    id: 4,
    school: 'Texas',
    mascot: 'Longhorns',
    abbreviation: 'TEX',
    alternateNames: ['TEX', 'Texas'],
    conference: 'SEC',
  },
  {
    id: 5,
    school: 'Tennessee',
    mascot: 'Volunteers',
    abbreviation: 'TENN',
    alternateNames: ['TENN', 'Tennessee'],
    conference: 'SEC',
  },
  {
    id: 6,
    school: 'Texas A&M',
    mascot: 'Aggies',
    abbreviation: 'TAMU',
    alternateNames: ['TAMU', 'Texas A&M'],
    conference: 'SEC',
  },
];

describe('createTeamMatcher', () => {
  const matcher = createTeamMatcher(TEAMS);

  it('matches by school name', () => {
    const result = matcher.bestMatch('Alabama');
    expect(result).not.toBeNull();
    expect(result!.team.school).toBe('Alabama');
  });

  it('matches by mascot', () => {
    const result = matcher.bestMatch('Buckeyes');
    expect(result).not.toBeNull();
    expect(result!.team.school).toBe('Ohio State');
  });

  it('matches by abbreviation', () => {
    const result = matcher.bestMatch('OSU');
    expect(result).not.toBeNull();
    expect(result!.team.school).toBe('Ohio State');
  });

  it('handles typos', () => {
    const result = matcher.bestMatch('Alabma');
    expect(result).not.toBeNull();
    expect(result!.team.school).toBe('Alabama');
  });

  it('matches Ole Miss', () => {
    const result = matcher.bestMatch('Ole Miss');
    expect(result).not.toBeNull();
    expect(result!.team.school).toBe('Ole Miss');
  });

  it('returns null for completely unrelated queries', () => {
    const result = matcher.bestMatch('xyzzyplugh');
    expect(result).toBeNull();
  });

  it('returns multiple results with search', () => {
    const results = matcher.search('Texas', 3);
    expect(results.length).toBeGreaterThanOrEqual(2);
    const schools = results.map((r) => r.team.school);
    expect(schools).toContain('Texas');
    expect(schools).toContain('Texas A&M');
  });

  it('detects ambiguity between similar names', () => {
    const ambiguous = matcher.isAmbiguous('Texas', 0.15);
    expect(ambiguous).toBe(true);
  });

  it('does not flag unambiguous queries as ambiguous', () => {
    const ambiguous = matcher.isAmbiguous('Ohio State', 0.05);
    expect(ambiguous).toBe(false);
  });
});
