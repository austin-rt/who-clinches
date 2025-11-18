'use client';

import { useMemo } from 'react';
import { useGetGamesQuery } from '@/app/store/apiSlice';
import { SEC_CONFERENCE_ID } from '@/lib/constants';

const LastUpdated = () => {
  const currentSeason = useMemo(() => new Date().getFullYear(), []);
  const { data } = useGetGamesQuery({
    season: currentSeason.toString(),
    conferenceId: SEC_CONFERENCE_ID.toString(),
  });

  const lastUpdated =
    data && typeof data === 'object' && 'lastUpdated' in data
      ? (data as { lastUpdated?: string }).lastUpdated
      : undefined;

  if (!lastUpdated) {
    return null;
  }

  return (
    <div className="text-base-content/50 text-lg">
      Game data last updated:{' '}
      {new Date(lastUpdated).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}
    </div>
  );
};

export default LastUpdated;
