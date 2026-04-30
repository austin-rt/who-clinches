import { unstable_cache } from 'next/cache';
import { cfbdClient } from './cfbd-client';
import { calculateNextSaturdayRevalidate } from './helpers/calculate-next-weekday-revalidate';

/**
 * Server-side cached wrappers for CFBD client methods.
 * Each wrapper shares a single `unstable_cache` keyed by normalized params.
 * TTL: seconds until next Saturday 11 AM ET -- every entry expires right
 * before gameday so the first request of the weekend gets fresh data.
 */

export const getCachedGames = (params: {
  year: number;
  conference: string;
  seasonType: string;
  week?: number;
}) => {
  const revalidate = calculateNextSaturdayRevalidate();
  const keyParts = [
    'cfbd-games',
    String(params.year),
    params.conference,
    params.seasonType,
    params.week !== null && params.week !== undefined ? String(params.week) : 'all',
  ];
  return unstable_cache(
    () => cfbdClient.getGames(params),
    keyParts,
    { revalidate, tags: keyParts }
  )();
};

export const getCachedTeams = (params: { conference: string }) => {
  const revalidate = calculateNextSaturdayRevalidate();
  const keyParts = ['cfbd-teams', params.conference];
  return unstable_cache(
    () => cfbdClient.getTeams(params),
    keyParts,
    { revalidate, tags: keyParts }
  )();
};

export const getCachedRankings = (params: {
  year: number;
  week?: number;
  seasonType?: string;
}) => {
  const revalidate = calculateNextSaturdayRevalidate();
  const keyParts = [
    'cfbd-rankings',
    String(params.year),
    params.week !== null && params.week !== undefined ? String(params.week) : 'latest',
    params.seasonType ?? 'regular',
  ];
  return unstable_cache(
    () => cfbdClient.getRankings(params),
    keyParts,
    { revalidate, tags: keyParts }
  )();
};

export const getCachedSp = (params: { year: number; team?: string }) => {
  const revalidate = calculateNextSaturdayRevalidate();
  const keyParts = [
    'cfbd-sp',
    String(params.year),
    params.team ?? 'all',
  ];
  return unstable_cache(
    () => cfbdClient.getSp(params),
    keyParts,
    { revalidate, tags: keyParts }
  )();
};

export const getCachedFpi = (params: { year: number; team?: string }) => {
  const revalidate = calculateNextSaturdayRevalidate();
  const keyParts = [
    'cfbd-fpi',
    String(params.year),
    params.team ?? 'all',
  ];
  return unstable_cache(
    () => cfbdClient.getFpi(params),
    keyParts,
    { revalidate, tags: keyParts }
  )();
};
