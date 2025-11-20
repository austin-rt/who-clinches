'use client';

import { useMemo } from 'react';
import GamesList from './components/GamesList';
import ViewModeButton from './components/ViewModeButton';
import HideCompletedButton from './components/HideCompletedButton';
import ResetButton from './components/ResetButton';
import SimulateButton from './components/SimulateButton';
import { SEC_CONFERENCE_ID } from '@/lib/constants';
import { useUIState } from '@/app/store/useUI';

const Home = () => {
  const currentSeason = useMemo(() => new Date().getFullYear(), []);
  const { mode } = useUIState();

  return (
    <div className="container mx-auto flex min-h-full flex-col gap-8 px-4 py-8">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1
            className={`text-4xl font-bold transition-colors ${
              mode === 'dark' ? 'text-accent' : 'text-primary'
            }`}
          >
            SEC Tiebreaker Calculator
          </h1>
          <p className="text-base-content/70 text-lg">
            Predict game outcomes and see how they affect SEC conference standings
          </p>
        </div>
        <ViewModeButton />
      </div>

      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <HideCompletedButton />
          <ResetButton />
        </div>
        <SimulateButton season={currentSeason} conferenceId={SEC_CONFERENCE_ID} />
      </div>

      <GamesList season={currentSeason} conferenceId={SEC_CONFERENCE_ID} />
    </div>
  );
};

export default Home;
