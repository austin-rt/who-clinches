'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import GamesList from '@/app/components/GamesList';
import ViewModeButton from '@/app/components/ViewModeButton';
import HideCompletedButton from '@/app/components/HideCompletedButton';
import ResetButton from '@/app/components/ResetButton';
import SimulateButton from '@/app/components/SimulateButton';
import CurrentStandings from '@/app/components/CurrentStandings';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { useUIState } from '@/app/store/useUI';
import { SimulateResponse } from '@/lib/api-types';
import { useAppDispatch } from '@/app/store/hooks';
import { clearAllPicks } from '@/app/store/gamePicksSlice';

const ConferencePage = () => {
  const params = useParams();
  const sport = params.sport as SportSlug;
  const conf = params.conf as ConferenceSlug;
  const currentSeason = useMemo(() => new Date().getFullYear(), []);
  const { mode } = useUIState();
  const dispatch = useAppDispatch();

  const [simulateResponse, setSimulateResponse] = useState<SimulateResponse | null>(null);
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);

  const handleSimulateComplete = (response: SimulateResponse) => {
    setSimulateResponse(response);
    setHasSimulated(true);
  };

  const handleReset = () => {
    setSimulateResponse(null);
    setHasSimulated(false);
    dispatch(clearAllPicks());
  };

  const { conferences } = sports[sport];
  const conferenceMeta = conferences[conf];
  const conferenceName = conferenceMeta?.name;
  const conferenceId = conferenceMeta?.espnId;

  if (!conferenceName || !conferenceId || !(sport in sports)) {
    return (
      <div className="container mx-auto flex min-h-full flex-col gap-8 px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-error">Conference Not Found</h1>
          <p className="text-base-content/70 text-lg">
            The conference &quot;{conf}&quot; for sport &quot;{sport}&quot; is not supported.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-full flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1
              className={`text-3xl font-bold transition-colors ${
                mode === 'dark' ? 'text-accent' : 'text-primary'
              }`}
            >
              {conferenceName} Tiebreaker Calculator
            </h1>
            <p className="text-base-content/70 text-base">
              Predict game outcomes and see how they affect {conferenceName} conference standings
            </p>
          </div>
          <ViewModeButton />
        </div>
      </div>

      <CurrentStandings
        season={currentSeason}
        simulateResponse={simulateResponse}
        hasSimulated={hasSimulated}
      />

      <div className="flex items-center justify-between gap-4">
        <HideCompletedButton />
        <ResetButton onReset={handleReset} />
      </div>

      <GamesList season={currentSeason} />

      <div className="flex flex-row justify-end gap-4">
        <SimulateButton season={currentSeason} onSimulateComplete={handleSimulateComplete} />
      </div>
    </div>
  );
};

export default ConferencePage;
