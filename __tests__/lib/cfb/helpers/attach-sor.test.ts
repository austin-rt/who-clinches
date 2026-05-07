import { attachSorToTeams } from '@/lib/cfb/helpers/attach-sor';
import { TeamLean } from '@/lib/types';
import type { TeamFPI } from 'cfbd';
import { createTeamLean } from '../../../api/cfb/tiebreaker-rules/common/test-helpers';

const makeTeam = (overrides: Partial<TeamLean> = {}): TeamLean => ({
  ...createTeamLean({ teamId: '1', abbrev: 'ALA', conferenceId: 'SEC' }),
  name: 'Alabama',
  displayName: 'Alabama Crimson Tide',
  shortDisplayName: 'Alabama',
  ...overrides,
});

const makeFpi = (team: string, sor: number): TeamFPI =>
  ({ team, resumeRanks: { strengthOfRecord: sor } }) as unknown as TeamFPI;

describe('attachSorToTeams', () => {
  it('returns undefined sor for all teams when ratings are empty', () => {
    const teams = [makeTeam()];
    const result = attachSorToTeams(teams, []);
    expect(result[0].sor).toBeUndefined();
  });

  it('matches by exact team name', () => {
    const teams = [makeTeam({ name: 'Alabama' })];
    const result = attachSorToTeams(teams, [makeFpi('Alabama', 5)]);
    expect(result[0].sor).toBe(5);
  });

  it('falls back to displayName, shortDisplayName, abbreviation', () => {
    const teams = [
      makeTeam({ name: 'NoMatch', displayName: 'NoMatch2', shortDisplayName: 'Alabama' }),
    ];
    const result = attachSorToTeams(teams, [makeFpi('Alabama', 10)]);
    expect(result[0].sor).toBe(10);
  });

  it('handles State to St fallback', () => {
    const teams = [makeTeam({ name: 'Mississippi State' })];
    const result = attachSorToTeams(teams, [makeFpi('Mississippi St', 15)]);
    expect(result[0].sor).toBe(15);
  });

  it('strips leading "The" for matching', () => {
    const teams = [makeTeam({ name: 'NoMatch' })];
    const fpi = [makeFpi('The Alabama', 20)];
    const result = attachSorToTeams(teams, fpi);
    expect(result[0].sor).toBe(20);
  });

  it('returns null when no match found', () => {
    const teams = [
      makeTeam({ name: 'NoMatch', displayName: 'None', shortDisplayName: 'X', abbreviation: 'Y' }),
    ];
    const result = attachSorToTeams(teams, [makeFpi('SomeOtherTeam', 25)]);
    expect(result[0].sor).toBeNull();
  });

  it('normalizes whitespace for matching', () => {
    const teams = [makeTeam({ name: 'San Diego  State' })];
    const result = attachSorToTeams(teams, [makeFpi('San Diego State', 30)]);
    expect(result[0].sor).toBe(30);
  });
});
