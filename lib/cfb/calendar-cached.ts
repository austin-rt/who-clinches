import { getCalendarFromCfbd } from './cfbd-rest-client';
import { fetch, persistRedisKey } from '@/lib/redis';
import type { CalendarWeek } from 'cfbd';

const KEY_PREFIX = 'cfbd:cfb:calendar';
export const CALENDAR_MEMO_MS = 6 * 60 * 60 * 1000;
export const ACTIVE_SEASON_TTL_SECONDS = 24 * 60 * 60;

const memo = new Map<number, { data: CalendarWeek[]; expiresAt: number }>();

export const clearCalendarMemo = (): void => {
  memo.clear();
};

const hasSeasonEnded = (calendar: CalendarWeek[]): boolean => {
  if (calendar.length === 0) return false;
  const seasonEndMs = new Date(calendar[calendar.length - 1].endDate).getTime();
  return Number.isFinite(seasonEndMs) && Date.now() > seasonEndMs;
};

export const getCalendar = async (year: number): Promise<CalendarWeek[]> => {
  const memoized = memo.get(year);
  if (memoized && Date.now() < memoized.expiresAt) return memoized.data;

  const key = `${KEY_PREFIX}:${year}`;
  const calendar = await fetch(key, () => getCalendarFromCfbd(year), ACTIVE_SEASON_TTL_SECONDS);

  if (hasSeasonEnded(calendar)) {
    await persistRedisKey(key);
  }

  memo.set(year, { data: calendar, expiresAt: Date.now() + CALENDAR_MEMO_MS });
  return calendar;
};
