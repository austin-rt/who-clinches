import {
  buildSubscriptionPayload,
  isBroadcastableGame,
} from '@/lib/cfb/build-subscription-payload';
import type { GqlGameNode } from '@/lib/cfb/graphql/map-to-cfbd';
import type { ReshapedTeam } from '@/lib/types';

const team = (id: string, name: string): ReshapedTeam => ({
  _id: id,
  name,
  displayName: name,
  shortDisplayName: name,
  abbreviation: name.slice(0, 3).toUpperCase(),
  mascot: null,
  alternateNames: [],
  logo: 'https://cdn.test/logo.png',
  color: '111111',
  alternateColor: '222222',
  conference: 'SEC',
  division: null,
  record: { overall: '0-0', conference: '0-0', home: '0-0', away: '0-0', stats: {} },
  conferenceStanding: '',
});

const node = (overrides: Partial<GqlGameNode> = {}): GqlGameNode =>
  ({
    id: 1,
    season: 2025,
    week: 5,
    seasonType: 'regular',
    startDate: '2025-10-11T19:00:00',
    startTimeTbd: false,
    status: 'completed',
    neutralSite: false,
    conferenceGame: true,
    notes: null,
    venueId: 7,
    attendance: null,
    excitement: null,
    homeTeamId: 61,
    homeTeam: 'Georgia',
    homeConference: 'SEC',
    homeClassification: 'fbs',
    homePoints: 30,
    homeLineScores: null,
    homeStartElo: null,
    homeEndElo: null,
    homePostgameWinProb: null,
    awayTeamId: 333,
    awayTeam: 'Alabama',
    awayConference: 'SEC',
    awayClassification: 'fbs',
    awayPoints: 14,
    awayLineScores: null,
    awayStartElo: null,
    awayEndElo: null,
    awayPostgameWinProb: null,
    lines: null,
    ...overrides,
  }) as GqlGameNode;

const teams = [team('61', 'Georgia'), team('333', 'Alabama')];

describe('isBroadcastableGame', () => {
  it('excludes non-conference games', () => {
    expect(isBroadcastableGame({ conferenceGame: false, notes: null })).toBe(false);
  });

  it('excludes championship games', () => {
    expect(isBroadcastableGame({ conferenceGame: true, notes: 'SEC Championship Game' })).toBe(
      false
    );
  });

  it('includes a regular conference game', () => {
    expect(isBroadcastableGame({ conferenceGame: true, notes: null })).toBe(true);
  });
});

describe('buildSubscriptionPayload', () => {
  it('attaches team branding so live updates are not blank', () => {
    const payload = buildSubscriptionPayload([node()], teams, new Map(), 2025);

    expect(payload.events[0].home.logo).toBe('https://cdn.test/logo.png');
    expect(payload.events[0].home.color).toBe('111111');
  });

  it('emits the conference roster alongside the games', () => {
    const payload = buildSubscriptionPayload([node()], teams, new Map(), 2025);

    expect(payload.teams.map((t) => t.id).sort()).toEqual(['333', '61']);
  });

  it('filters the same games the rest route filters', () => {
    const payload = buildSubscriptionPayload(
      [
        node({ id: 1 }),
        node({ id: 2, conferenceGame: false }),
        node({ id: 3, notes: 'SEC Championship Game' }),
      ],
      teams,
      new Map(),
      2025
    );

    expect(payload.events.map((e) => e.id)).toEqual(['1']);
  });

  it('resolves venue metadata from the venue map', () => {
    const venueMap = new Map([
      [7, { name: 'Sanford Stadium', city: 'Athens', state: 'GA', timezone: 'America/New_York' }],
    ]);

    const payload = buildSubscriptionPayload([node()], teams, venueMap, 2025);

    expect(payload.events[0].venue).toEqual({
      fullName: 'Sanford Stadium',
      city: 'Athens',
      state: 'GA',
      timezone: 'America/New_York',
    });
  });
});
