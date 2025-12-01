'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGetSeasonGameDataQuery } from '@/app/store/apiSlice';
import { useParams } from 'next/navigation';
import { SimulateResponse } from '@/lib/api-types';
import SimulatedStandings from './SimulatedStandings';
import LoadingSpinner from './LoadingSpinner';
import Divider from './Divider';
import { cn } from '@/lib/utils';

interface CurrentStandingsProps {
  season: number;
  simulateResponse?: SimulateResponse | null;
  hasSimulated?: boolean;
}

const CurrentStandings = ({ season, simulateResponse }: CurrentStandingsProps) => {
  const [currentStandingsOpen, setCurrentStandingsOpen] = useState(false);
  const params = useParams();
  const sport = params.sport as string;
  const conf = params.conf as string;

  const { data, isLoading, refetch } = useGetSeasonGameDataQuery(
    {
      sport,
      conf,
      season: season.toString(),
      force: true,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    if (currentStandingsOpen) {
      void refetch();
    }
  }, [currentStandingsOpen, refetch]);

  const sortedStandings = useMemo(() => {
    if (!data?.teams) return [];

    return data.teams
      .map((team) => ({
        team,
        rank: team.rank ?? Infinity,
      }))
      .sort((a, b) => a.rank - b.rank)
      .map((item) => item.team);
  }, [data]);

  if (simulateResponse) {
    return <SimulatedStandings simulateResponse={simulateResponse} />;
  }

  return (
    <div className="collapse collapse-arrow border-2 border-base-300 bg-base-200 shadow-md dark:border-base-400">
      <input
        type="checkbox"
        checked={currentStandingsOpen}
        onChange={(e) => setCurrentStandingsOpen(e.target.checked)}
      />
      <div className="collapse-title w-full justify-center text-base font-semibold">
        Current Standings
      </div>
      <div className="collapse-content">
        {isLoading || !data || sortedStandings.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner size="h-6 w-6" />
          </div>
        ) : (
          <>
            <Divider className="-mt-4 pb-4" />
            <div className="flex flex-col gap-4">
              <div className="columns-1 gap-x-4 gap-y-1 text-xs sm:columns-2 md:columns-4">
                {sortedStandings.map((team) => {
                  const isTopTwo = team.rank === 1 || team.rank === 2;
                  return (
                    <div
                      key={team.id}
                      className={cn(
                        'flex items-center gap-1 whitespace-nowrap text-left',
                        isTopTwo ? 'font-bold' : ''
                      )}
                    >
                      <span>{team.rank}.</span>
                      <span>{team.shortDisplayName}</span>
                      <span className="text-base-content/70">
                        ({team.conferenceRecord})
                        {isTopTwo && <span className="text-base-content/70">*</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Divider />
              <div className="text-base-content/60 text-xxs w-full text-right font-bold">
                * - in Title Game
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CurrentStandings;
