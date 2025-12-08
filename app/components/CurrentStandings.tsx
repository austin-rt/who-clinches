'use client';

import { useMemo, useEffect } from 'react';
import { useGetSeasonGameDataQuery, TeamMetadata } from '@/app/store/apiSlice';
import { useParams } from 'next/navigation';
import { isValidSport, isValidConference, type SportSlug, type ConferenceAbbreviation } from '@/lib/constants';
import { useAppSelector } from '@/app/store/hooks';
import LoadingSpinner from './LoadingSpinner';
import Divider from './Divider';
import { cn } from '@/lib/utils';

interface CurrentStandingsProps {
  isOpen: boolean;
}

const CurrentStandings = ({ isOpen }: CurrentStandingsProps) => {
  const params = useParams();
  const sportParam = params.sport as string;
  const confParam = params.conf as string;
  const season = useAppSelector((state) => state.app.season);

  const isValid = isValidSport(sportParam) && isValidConference(confParam);
  const sport = isValid ? (sportParam as SportSlug) : null;
  const conf = isValid ? (confParam as ConferenceAbbreviation) : null;

  const { data, isLoading, refetch } = useGetSeasonGameDataQuery(
    {
      sport: sport!,
      conf: conf!,
      season: season!,
    },
    {
      refetchOnMountOrArgChange: true,
      skip: season === null || !isValid || !sport || !conf,
    }
  );

  useEffect(() => {
    if (isOpen) {
      void refetch();
    }
  }, [isOpen, refetch]);

  const sortedStandings = useMemo((): TeamMetadata[] => {
    if (!data?.teams) return [];

    return data.teams
      .map((team: TeamMetadata) => ({
        team,
        rank: team.rank ?? Infinity,
      }))
      .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
      .map((item: { team: TeamMetadata }) => item.team);
  }, [data]);

  if (!isValid || !sport || !conf) {
    return null;
  }

  return (
    <>
      {isLoading || !data || sortedStandings.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="h-6 w-6" />
        </div>
      ) : (
        <>
          <Divider className="-mt-4 pb-4" />
          <div className="flex flex-col gap-4">
            <div className="columns-1 gap-x-4 gap-y-1 text-xs sm:columns-2 md:columns-4">
              {sortedStandings.map((team: TeamMetadata) => {
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
            <div className="text-base-content/60 w-full text-right text-xxs font-bold">
              * - in Title Game
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CurrentStandings;
