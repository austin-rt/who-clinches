import {
  getCalendar,
  clearCalendarMemo,
  ACTIVE_SEASON_TTL_SECONDS,
} from '@/lib/cfb/calendar-cached';
import { getCalendarFromCfbd } from '@/lib/cfb/cfbd-rest-client';
import { fetch as redisFetch, persistRedisKey } from '@/lib/redis';
import type { CalendarWeek } from 'cfbd';

jest.mock('@/lib/cfb/cfbd-rest-client', () => ({
  getCalendarFromCfbd: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  fetch: jest.fn(),
  persistRedisKey: jest.fn(),
}));

const mockGetCalendarFromCfbd = getCalendarFromCfbd as jest.MockedFunction<
  typeof getCalendarFromCfbd
>;
const mockRedisFetch = redisFetch as jest.MockedFunction<typeof redisFetch>;
const mockPersistRedisKey = persistRedisKey as jest.MockedFunction<typeof persistRedisKey>;

const buildWeek = (week: number, startDate: string, endDate: string): CalendarWeek =>
  ({ week, startDate, endDate, seasonType: 'regular', year: 2025 }) as unknown as CalendarWeek;

const endedSeason = [buildWeek(1, '2025-08-30T00:00:00Z', '2025-09-02T00:00:00Z')];
const activeSeason = [buildWeek(1, '2099-08-30T00:00:00Z', '2099-09-02T00:00:00Z')];

describe('getCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCalendarMemo();
    mockRedisFetch.mockImplementation((_key, fetcher) => fetcher());
  });

  it('serves repeat calls for the same year from the memo without refetching', async () => {
    mockGetCalendarFromCfbd.mockResolvedValue(activeSeason);

    await getCalendar(2099);
    await getCalendar(2099);
    await getCalendar(2099);

    expect(mockRedisFetch).toHaveBeenCalledTimes(1);
    expect(mockGetCalendarFromCfbd).toHaveBeenCalledTimes(1);
  });

  it('memoizes per year rather than globally', async () => {
    mockGetCalendarFromCfbd.mockResolvedValue(activeSeason);

    await getCalendar(2099);
    await getCalendar(2098);

    expect(mockRedisFetch).toHaveBeenCalledTimes(2);
  });

  it('promotes a finished season to a permanent cache entry', async () => {
    mockGetCalendarFromCfbd.mockResolvedValue(endedSeason);

    await getCalendar(2025);

    expect(mockPersistRedisKey).toHaveBeenCalledWith('cfbd:cfb:calendar:2025');
  });

  it('leaves an in-progress season on its expiring entry', async () => {
    mockGetCalendarFromCfbd.mockResolvedValue(activeSeason);

    await getCalendar(2099);

    expect(mockPersistRedisKey).not.toHaveBeenCalled();
    expect(mockRedisFetch).toHaveBeenCalledWith(
      'cfbd:cfb:calendar:2099',
      expect.any(Function),
      ACTIVE_SEASON_TTL_SECONDS
    );
  });

  it('does not treat an empty calendar as a finished season', async () => {
    mockGetCalendarFromCfbd.mockResolvedValue([]);

    await getCalendar(2100);

    expect(mockPersistRedisKey).not.toHaveBeenCalled();
  });
});
