import { getCalendarFromCfbd } from '../cfbd-rest-client';
import { getFixtureYear } from './fixture-year';
import { getRuntimeConfig } from '@/lib/admin/runtime-config';
import {
  calculateNextSaturdayRevalidate,
  calculateNextSundayRevalidate,
} from './calculate-next-weekday-revalidate';

export type SeasonPhase = 'preseason' | 'inseason' | 'postseason';

interface PhaseResult {
  phase: SeasonPhase;
  seasonStartMs: number;
  seasonEndMs: number;
  currentWeek: number | null;
}

let cached: { result: PhaseResult; expiresAt: number } | null = null;
const CACHE_MS = 60_000;

export const getSeasonPhase = async (): Promise<PhaseResult> => {
  if (cached && Date.now() < cached.expiresAt) return cached.result;

  const fixtureYear = await getFixtureYear();
  if (fixtureYear !== null) {
    const result: PhaseResult = {
      phase: 'inseason',
      seasonStartMs: 0,
      seasonEndMs: Infinity,
      currentWeek: null,
    };
    cached = { result, expiresAt: Date.now() + CACHE_MS };
    return result;
  }

  if (process.env.VERCEL_ENV !== 'production') {
    const config = await getRuntimeConfig();
    if (config.inSeasonOverride) {
      const result: PhaseResult = {
        phase: 'inseason',
        seasonStartMs: 0,
        seasonEndMs: Infinity,
        currentWeek: null,
      };
      cached = { result, expiresAt: Date.now() + CACHE_MS };
      return result;
    }
  }

  const now = Date.now();
  const currentYear = new Date().getFullYear();

  const resolve = async (year: number): Promise<PhaseResult | null> => {
    const calendar = await getCalendarFromCfbd(year);
    if (calendar.length === 0) return null;
    const seasonStartMs = new Date(calendar[0].startDate).getTime();
    const seasonEndMs = new Date(calendar[calendar.length - 1].endDate).getTime();

    if (now < seasonStartMs) {
      return { phase: 'preseason', seasonStartMs, seasonEndMs, currentWeek: null };
    }
    if (now > seasonEndMs) {
      return { phase: 'postseason', seasonStartMs, seasonEndMs, currentWeek: null };
    }

    let currentWeek: number | null = null;
    for (const entry of calendar) {
      const weekStart = new Date(entry.startDate).getTime();
      const weekEnd = new Date(entry.endDate).getTime();
      if (now >= weekStart && now <= weekEnd) {
        currentWeek = entry.week;
        break;
      }
    }

    return { phase: 'inseason', seasonStartMs, seasonEndMs, currentWeek };
  };

  const result = (await resolve(currentYear)) ??
    (await resolve(currentYear - 1)) ?? {
      phase: 'postseason' as const,
      seasonStartMs: 0,
      seasonEndMs: 0,
      currentWeek: null,
    };

  cached = { result, expiresAt: Date.now() + CACHE_MS };
  return result;
};

export const getSeasonAwareTtl = async (
  season?: number,
  type: 'saturday' | 'sunday' = 'saturday'
): Promise<number | undefined> => {
  const now = Date.now();
  const year = season ?? new Date().getFullYear();
  const calendar = await getCalendarFromCfbd(year);

  if (calendar.length === 0) {
    const prev = await getCalendarFromCfbd(year - 1);
    if (prev.length > 0) {
      const prevEnd = new Date(prev[prev.length - 1].endDate).getTime();
      if (now > prevEnd) {
        const nextStart = new Date(prev[0].startDate);
        nextStart.setFullYear(nextStart.getFullYear() + 1);
        return Math.max(1, Math.floor((nextStart.getTime() - now) / 1000));
      }
    }
    return undefined;
  }

  const seasonStartMs = new Date(calendar[0].startDate).getTime();
  const seasonEndMs = new Date(calendar[calendar.length - 1].endDate).getTime();

  if (now > seasonEndMs) return undefined;

  if (now < seasonStartMs) {
    return Math.max(1, Math.floor((seasonStartMs - now) / 1000));
  }

  return type === 'sunday' ? calculateNextSundayRevalidate() : calculateNextSaturdayRevalidate();
};
