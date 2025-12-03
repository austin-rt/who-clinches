import { getDefaultSeasonFromESPN } from '@/lib/cfb/helpers/get-default-season';
import { createESPNClient, ESPNClient } from '@/lib/cfb/espn-client';
import type { EspnScoreboardGenerated } from '@/lib/espn/espn-scoreboard-generated';
import type { ConferenceSlug } from '@/lib/constants';

jest.mock('@/lib/cfb/espn-client', () => ({
  createESPNClient: jest.fn(),
}));

describe('getDefaultSeasonFromESPN', () => {
  const mockGetScoreboard = jest.fn();
  const mockCreateESPNClient = jest.mocked(createESPNClient);

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateESPNClient.mockReturnValue({
      getScoreboard: mockGetScoreboard,
    } as unknown as ESPNClient);
  });

  it('returns current season year when date is before or equal to endDate', async () => {
    const currentYear = new Date().getFullYear();
    const endDate = new Date(`${currentYear}-12-31T23:59:59Z`);
    const now = new Date(`${currentYear}-06-15T12:00:00Z`);

    jest.useFakeTimers();
    jest.setSystemTime(now);

    mockGetScoreboard.mockResolvedValue({
      leagues: [
        {
          season: {
            year: currentYear,
            endDate: endDate.toISOString(),
          },
        },
      ],
    } as EspnScoreboardGenerated);

    const result = await getDefaultSeasonFromESPN('cfb', 'sec');

    expect(result).toBe(currentYear);

    jest.useRealTimers();
  });

  it('returns next season year when date is after endDate', async () => {
    const currentYear = new Date().getFullYear();
    const endDate = new Date(`${currentYear}-01-15T23:59:59Z`);
    const now = new Date(`${currentYear}-06-15T12:00:00Z`);

    jest.useFakeTimers();
    jest.setSystemTime(now);

    mockGetScoreboard.mockResolvedValue({
      leagues: [
        {
          season: {
            year: currentYear - 1,
            endDate: endDate.toISOString(),
          },
        },
      ],
    } as EspnScoreboardGenerated);

    const result = await getDefaultSeasonFromESPN('cfb', 'sec');

    expect(result).toBe(currentYear);

    jest.useRealTimers();
  });

  it('falls back to current year when API throws error', async () => {
    const currentYear = new Date().getFullYear();

    mockGetScoreboard.mockRejectedValue(new Error('API Error'));

    const result = await getDefaultSeasonFromESPN('cfb', 'sec');

    expect(result).toBe(currentYear);
  });

  it('falls back to current year when conference is not found', async () => {
    const currentYear = new Date().getFullYear();

    const result = await getDefaultSeasonFromESPN('cfb', 'invalid' as ConferenceSlug);

    expect(result).toBe(currentYear);
    expect(mockGetScoreboard).not.toHaveBeenCalled();
  });

  it('falls back to current year when endDate is missing', async () => {
    const currentYear = new Date().getFullYear();

    mockGetScoreboard.mockResolvedValue({
      leagues: [
        {
          season: {
            year: currentYear,
          },
        },
      ],
    } as EspnScoreboardGenerated);

    const result = await getDefaultSeasonFromESPN('cfb', 'sec');

    expect(result).toBe(currentYear);
  });

  it('falls back to current year when leagues array is empty', async () => {
    const currentYear = new Date().getFullYear();

    mockGetScoreboard.mockResolvedValue({
      leagues: [],
    } as unknown as EspnScoreboardGenerated);

    const result = await getDefaultSeasonFromESPN('cfb', 'sec');

    expect(result).toBe(currentYear);
  });

  it('falls back to current year when leagues is missing', async () => {
    const currentYear = new Date().getFullYear();

    mockGetScoreboard.mockResolvedValue({} as unknown as EspnScoreboardGenerated);

    const result = await getDefaultSeasonFromESPN('cfb', 'sec');

    expect(result).toBe(currentYear);
  });
});

