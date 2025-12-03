'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import GamesList from '@/app/components/GamesList';
import ViewModeButton from '@/app/components/ViewModeButton';
import HideCompletedButton from '@/app/components/HideCompletedButton';
import ResetButton from '@/app/components/ResetButton';
import SimulateButton from '@/app/components/SimulateButton';
import Standings from '@/app/components/Standings';
import { useGamesData } from '@/app/hooks/useGamesData';
import { sports, type SportSlug, type ConferenceSlug } from '@/lib/constants';
import { SimulateResponse } from '@/lib/api-types';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { clearAllPicks } from '@/app/store/gamePicksSlice';
import { setStandingsOpen, setSeason } from '@/app/store/uiSlice';
import { getDefaultSeasonFromESPN } from '@/lib/cfb/helpers/get-default-season';

const ConferencePage = () => {
  const params = useParams();
  const sport = params.sport as SportSlug;
  const conf = params.conf as ConferenceSlug;
  const dispatch = useAppDispatch();
  const standingsRef = useRef<HTMLDivElement>(null);
  const season = useAppSelector((state) => state.ui.season);

  useEffect(() => {
    if (season === null) {
      void getDefaultSeasonFromESPN(sport, conf).then((defaultSeason) => {
        dispatch(setSeason(defaultSeason));
      });
    }
  }, [sport, conf, season, dispatch]);

  useGamesData({
    sport,
    conf,
  });

  const [simulateResponse, setSimulateResponse] = useState<SimulateResponse | null>(null);

  const handleSimulateComplete = (response: SimulateResponse) => {
    setSimulateResponse(response);
    dispatch(setStandingsOpen(true));
    setTimeout(() => {
      standingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleReset = () => {
    setSimulateResponse(null);
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold transition-colors">{conferenceName} Championship</h1>
          <p className="text-base-content/70 text-sm">
            Predict outcomes to see who clinches the {conferenceName} title bids
          </p>
        </div>
        <div className="hidden sm:flex sm:justify-end">
          <ViewModeButton />
        </div>
      </div>

      <div className="flex w-full sm:hidden">
        <ViewModeButton />
      </div>

      <Standings ref={standingsRef} simulateResponse={simulateResponse} />

      <div className="flex items-center justify-between gap-4">
        <HideCompletedButton />
        <ResetButton onReset={handleReset} className="w-fit" />
      </div>

      <GamesList />

      <div className="flex w-full flex-row justify-center gap-4 sm:w-auto sm:justify-between">
        <ResetButton onReset={handleReset} className="w-1/2 sm:w-fit" />
        <SimulateButton onSimulateComplete={handleSimulateComplete} />
      </div>
    </div>
  );
};

export default ConferencePage;
