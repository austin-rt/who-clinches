'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import GamesList from '@/app/components/GamesList';
import ViewModeButton from '@/app/components/ViewModeButton';
import HideCompletedButton from '@/app/components/HideCompletedButton';
import ResetButton from '@/app/components/ResetButton';
import SimulateButton from '@/app/components/SimulateButton';
import { CONFERENCE_METADATA, type ConferenceSlug } from '@/lib/cfb/constants';
import { useUIState } from '@/app/store/useUI';

const ConferencePage = () => {
  const params = useParams();
  const sport = params.sport as string;
  const conf = params.conf as ConferenceSlug;
  const currentSeason = useMemo(() => new Date().getFullYear(), []);
  const { mode } = useUIState();

  const conferenceName = CONFERENCE_METADATA[conf]?.name;
  const conferenceId = CONFERENCE_METADATA[conf]?.espnId;

  if (!conferenceName || !conferenceId || !['cfb'].includes(sport)) {
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
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1
            className={`text-4xl font-bold transition-colors ${
              mode === 'dark' ? 'text-accent' : 'text-primary'
            }`}
          >
            {conferenceName} Tiebreaker Calculator
          </h1>
          <p className="text-base-content/70 text-lg">
            Predict game outcomes and see how they affect {conferenceName} conference standings
          </p>
        </div>
        <ViewModeButton />
      </div>

      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <HideCompletedButton />
          <ResetButton />
        </div>
        <SimulateButton season={currentSeason} />
      </div>

      <GamesList season={currentSeason} />
    </div>
  );
};

export default ConferencePage;

