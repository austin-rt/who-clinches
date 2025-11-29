'use client';

import { useParams } from 'next/navigation';
import { useUIState } from '@/app/store/useUI';
import { useGamesData } from '@/app/hooks/useGamesData';
import { organizeGames } from '@/lib/utils/organizeGames';
import FinalWeeks from './FinalWeeks';
import RemainingWeeks from './RemainingWeeks';
import CompactWeekGrid from './CompactWeekGrid';
import LoadingSpinner from './LoadingSpinner';

interface GamesListProps {
  season: number;
}

const GamesList = ({ season }: GamesListProps) => {
  const params = useParams();
  const sport = params.sport as string;
  const conf = params.conf as string;
  const { view } = useUIState();

  const { enrichedGames, isLoading, isError, isUninitialized } = useGamesData({
    sport,
    conf,
    season,
  });

  const { finalWeeks, remainingWeeks } = organizeGames(enrichedGames);

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
