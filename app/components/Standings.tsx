'use client';

import { useState, forwardRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setStandingsOpen } from '@/app/store/uiSlice';
import { SimulateResponse } from '@/lib/api-types';
import CurrentStandings from './CurrentStandings';
import SimulatedStandings from './SimulatedStandings';

interface StandingsProps {
  simulateResponse?: SimulateResponse | null;
}

const Standings = forwardRef<HTMLDivElement, StandingsProps>(
  ({ simulateResponse }, ref) => {
    const dispatch = useAppDispatch();
    const standingsOpen = useAppSelector((state) => state.ui.standingsOpen);
    const [currentStandingsOpen, setCurrentStandingsOpen] = useState(false);

    const isSimulated = !!simulateResponse;
    const isOpen = isSimulated ? standingsOpen : currentStandingsOpen;

    const handleToggle = (checked: boolean) => {
      if (isSimulated) {
        dispatch(setStandingsOpen(checked));
      } else {
        setCurrentStandingsOpen(checked);
      }
    };

    return (
      <div
        ref={ref}
        className={`collapse collapse-arrow ${
          isSimulated
            ? 'bg-base-200'
            : 'border border-base-400 bg-base-200 dark:border-accent-50'
        } shadow-md`}
      >
        <input type="checkbox" checked={isOpen} onChange={(e) => handleToggle(e.target.checked)} />
        <div className="collapse-title w-full justify-center text-base font-semibold">
          {isSimulated ? 'Simulated Standings' : 'Current Standings'}
        </div>
        <div className="collapse-content">
          {isSimulated ? (
            <SimulatedStandings simulateResponse={simulateResponse!} />
          ) : (
            <CurrentStandings isOpen={currentStandingsOpen} />
          )}
        </div>
      </div>
    );
  }
);

Standings.displayName = 'Standings';

export default Standings;

