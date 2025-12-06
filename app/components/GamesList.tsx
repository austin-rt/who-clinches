'use client';

import { useParams } from 'next/navigation';
import { isValidSport, isValidConference, type SportSlug, type ConferenceAbbreviation } from '@/lib/constants';
import { useUIState } from '@/app/store/useUI';
import { useGamesData } from '@/app/hooks/useGamesData';
import { useSyncGamePicksWithView } from '@/app/hooks/useSyncGamePicksWithView';
import { organizeGames } from '@/lib/utils/organizeGames';
import FinalWeeks from './FinalWeeks';
import RemainingWeeks from './RemainingWeeks';
import CompactWeekGrid from './CompactWeekGrid';
import LoadingSpinner from './LoadingSpinner';

const GamesList = () => {
  const params = useParams();
  const sportParam = params.sport as string;
  const confParam = params.conf as string;
  const { view } = useUIState();

  const isValid = isValidSport(sportParam) && isValidConference(confParam);
  const sport = isValid ? (sportParam as SportSlug) : null;
  const conf = isValid ? (confParam as ConferenceAbbreviation) : null;

  const { games, isLoading, isError, isUninitialized } = useGamesData({
    sport: sport!,
    conf: conf!,
  });

  useSyncGamePicksWithView({ games, view });

  if (!isValid || !sport || !conf) {
    return null;
  }

  const { finalWeeks, remainingWeeks } = organizeGames(games);

  if (isLoading || isUninitialized) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <LoadingSpinner size="h-12 w-12" />
      </div>
    );
  }

  if (isError) {
    return <div>Error loading games</div>;
  }

  const totalGames =
    finalWeeks.reduce((sum, week) => sum + week.length, 0) +
    remainingWeeks.reduce((sum, week) => sum + week.length, 0);

  if (totalGames === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-base-content/70">No games found</p>
      </div>
    );
  }

  if (view === 'picks') {
    return <CompactWeekGrid finalWeeks={finalWeeks} remainingWeeks={remainingWeeks} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <FinalWeeks weeks={finalWeeks} />
      <RemainingWeeks weeks={remainingWeeks} />
    </div>
  );
};

export default GamesList;
