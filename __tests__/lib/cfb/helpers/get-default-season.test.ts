import { getDefaultSeasonFromCfbd } from '@/lib/cfb/helpers/get-default-season-cfbd';
import { getCalendarFromCfbd } from '@/lib/cfb/cfbd-rest-client';
import { createMockCalendarWeek } from '@/__tests__/mocks/cfbd-rest-client';

jest.mock('@/lib/cfb/cfbd-rest-client', () => ({
  getCalendarFromCfbd: jest.fn(),
}));

describe('getDefaultSeasonFromCfbd', () => {
  const mockGetCalendar = jest.mocked(getCalendarFromCfbd);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns current season year when date is within season', async () => {
    const currentYear = new Date().getFullYear();
    const now = new Date(`${currentYear}-09-15T12:00:00Z`);

    jest.useFakeTimers();
    jest.setSystemTime(now);

    mockGetCalendar.mockResolvedValue([
      createMockCalendarWeek({
        season: currentYear,
        week: 1,
        startDate: `${currentYear}-09-01T00:00:00Z`,
        endDate: `${currentYear}-09-07T23:59:59Z`,
      }),
      createMockCalendarWeek({
        season: currentYear,
        week: 2,
        startDate: `${currentYear}-09-08T00:00:00Z`,
        endDate: `${currentYear}-09-14T23:59:59Z`,
      }),
      createMockCalendarWeek({
        season: currentYear,
        week: 3,
        startDate: `${currentYear}-09-15T00:00:00Z`,
        endDate: `${currentYear}-09-21T23:59:59Z`,
      }),
    ]);

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(currentYear);
    expect(mockGetCalendar).toHaveBeenCalledWith(currentYear);

    jest.useRealTimers();
  });

  it('returns previous year when date is in previous year season', async () => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const now = new Date(`${currentYear}-01-15T12:00:00Z`);

    jest.useFakeTimers();
    jest.setSystemTime(now);

    mockGetCalendar
      .mockResolvedValueOnce([
        createMockCalendarWeek({
          season: currentYear,
          week: 1,
          startDate: `${currentYear}-09-01T00:00:00Z`,
          endDate: `${currentYear}-09-07T23:59:59Z`,
        }),
      ])
      .mockResolvedValueOnce([
        createMockCalendarWeek({
          season: previousYear,
          week: 15,
          startDate: `${previousYear}-12-15T00:00:00Z`,
          endDate: `${previousYear}-12-31T23:59:59Z`,
        }),
      ]);

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(previousYear);

    jest.useRealTimers();
  });

  it('falls back to current year when API throws error', async () => {
    const currentYear = new Date().getFullYear();

    mockGetCalendar.mockRejectedValue(new Error('API Error'));

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(currentYear);
  });

  it('returns current year when calendar is empty', async () => {
    const currentYear = new Date().getFullYear();

    mockGetCalendar.mockResolvedValue([]);

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(currentYear);
  });

  it('returns current year when before season starts', async () => {
    const currentYear = new Date().getFullYear();
    const now = new Date(`${currentYear}-06-15T12:00:00Z`);

    jest.useFakeTimers();
    jest.setSystemTime(now);

    mockGetCalendar.mockResolvedValue([
      createMockCalendarWeek({
        season: currentYear,
        week: 1,
        startDate: `${currentYear}-09-01T00:00:00Z`,
        endDate: `${currentYear}-09-07T23:59:59Z`,
      }),
    ]);

    const result = await getDefaultSeasonFromCfbd();

    expect(result).toBe(currentYear - 1);

    jest.useRealTimers();
  });
});

