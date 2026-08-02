import { getVenuesFromCfbd, type CfbdVenue } from './cfbd-rest-client';
import { fetch, persistRedisKey } from '@/lib/redis';

const KEY = 'cfbd:cfb:venues';
export const VENUE_MEMO_MS = 6 * 60 * 60 * 1000;

let memo: { data: Map<number, CfbdVenue>; expiresAt: number } | null = null;

export const clearVenueMemo = (): void => {
  memo = null;
};

export const getVenueMap = async (): Promise<Map<number, CfbdVenue>> => {
  if (memo && Date.now() < memo.expiresAt) return memo.data;

  const venues = await fetch(KEY, () => getVenuesFromCfbd());
  await persistRedisKey(KEY);

  const map = new Map<number, CfbdVenue>();
  for (const venue of venues) {
    if (typeof venue.id === 'number') map.set(venue.id, venue);
  }

  memo = { data: map, expiresAt: Date.now() + VENUE_MEMO_MS };
  return map;
};
