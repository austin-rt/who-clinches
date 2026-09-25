import { formatScenarioContext } from '@/lib/cfb/chat/context-assembly';
import type { GameLean, TeamLean } from '@/lib/types';

const teams = [
  { _id: 'lsu', shortDisplayName: 'LSU' },
  { _id: 'bama', shortDisplayName: 'Alabama' },
] as unknown as TeamLean[];

const games = [
  {
    _id: 'g1',
    completed: false,
    conferenceGame: true,
    home: { teamId: 'lsu', abbrev: 'LSU' },
    away: { teamId: 'bama', abbrev: 'ALA' },
  },
] as unknown as GameLean[];

describe('formatScenarioContext', () => {
  it('does not claim elimination when the search was partial', () => {
    const text = formatScenarioContext(
      'LSU',
      { pathCount: 0, exhaustive: false, samplePaths: [] },
      games,
      teams
    );
    expect(text).not.toMatch(/has been eliminated/);
    expect(text).toMatch(/undetermined/);
  });

  it('claims elimination only after an exhaustive search', () => {
    const text = formatScenarioContext(
      'LSU',
      { pathCount: 0, exhaustive: true, samplePaths: [] },
      games,
      teams
    );
    expect(text).toMatch(/has been eliminated/);
  });

  it('never exposes scenario counts as odds', () => {
    const text = formatScenarioContext(
      'LSU',
      {
        pathCount: 338,
        exhaustive: false,
        samplePaths: [[{ gameId: 'g1', winnerTeamId: 'lsu' }]],
      },
      games,
      teams
    );
    expect(text).not.toMatch(/338/);
    expect(text).not.toMatch(/10,?000/);
    expect(text).toMatch(/not a probability/);
    expect(text).toMatch(/LSU beats Alabama/);
  });
});
