'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import GamesList from '@/app/components/GamesList';
import ViewModeButton from '@/app/components/ViewModeButton';
import HideCompletedButton from '@/app/components/HideCompletedButton';
import ResetButton from '@/app/components/ResetButton';
import SimulateButton from '@/app/components/SimulateButton';
import Standings from '@/app/components/Standings';
import ChampionshipMatchup from '@/app/components/ChampionshipMatchup';
import ShareButton from '@/app/components/ShareButton';
import SimulationDisclaimer from '@/app/components/SimulationDisclaimer';
import ChatDrawer from '@/app/components/Chat/ChatDrawer';
import ChatSearchBar from '@/app/components/Chat/ChatSearchBar';
import { useGeoTeam } from '@/app/components/Chat/GeoTeamProvider';
import { useGamesData } from '@/app/hooks/useGamesData';
import { useInSeason } from '@/app/hooks/useInSeason';
import type { CFBConferenceAbbreviation } from '@/lib/cfb/constants';
import {
  getConferenceMetadata,
  isValidSport,
  isValidConference,
  type SportSlug,
} from '@/lib/constants';
import { SimulateResponse } from '@/app/store/api';
import { useAppDispatch } from '@/app/store/hooks';
import { clearAllPicks } from '@/app/store/gamePicksSlice';
import { setStandingsOpen } from '@/app/store/uiSlice';
const ConferencePage = () => {
  const params = useParams();
  const sportParam = params.sport as string;
  const confParam = params.conf as string;
  const dispatch = useAppDispatch();

  const [simulateResponse, setSimulateResponse] = useState<SimulateResponse | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const geoTeam = useGeoTeam();

  const isValid = isValidSport(sportParam) && isValidConference(confParam);
  const sport = isValid ? (sportParam as SportSlug) : null;
  const conf = isValid ? (confParam as CFBConferenceAbbreviation) : null;

  const { games, teams } = useGamesData({
    sport: sport!,
    conf: conf!,
  });

  useInSeason();

  const handleSimulateComplete = (response: SimulateResponse) => {
    setSimulateResponse(response);
    dispatch(setStandingsOpen(true));
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleReset = () => {
    setSimulateResponse(null);
    dispatch(clearAllPicks());
  };

  if (!isValid || !sport || !conf) {
    return (
      <div className="container mx-auto flex min-h-full flex-col gap-8 px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 data-testid="error-heading" className="text-4xl font-bold text-error">
            Conference Not Found
          </h1>
          <p data-testid="error-message" className="text-base-content/70 text-lg">
            {!isValidSport(sportParam)
              ? `The sport &quot;${sportParam}&quot; is not supported.`
              : `The conference &quot;${confParam}&quot; for sport &quot;${sportParam}&quot; is not supported.`}
          </p>
        </div>
      </div>
    );
  }

  const conferenceMeta = getConferenceMetadata(conf);
  const conferenceName = conferenceMeta?.name;
  const conferenceId = conferenceMeta?.cfbdId;

  if (!conferenceName || !conferenceId) {
    return (
      <div className="container mx-auto flex min-h-full flex-col gap-8 px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 data-testid="error-heading" className="text-4xl font-bold text-error">
            Conference Not Found
          </h1>
          <p data-testid="error-message" className="text-base-content/70 text-lg">
            The conference &quot;{confParam}&quot; for sport &quot;{sportParam}&quot; is not
            supported.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-full flex-col gap-8 px-4 py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 data-testid="conference-heading" className="text-2xl font-bold transition-colors">
            {conferenceName} Championship
          </h1>
          <p className="text-base-content/70 text-sm">
            Predict outcomes to see who clinches the {conferenceName} title bids
          </p>
        </div>
        <ChatSearchBar
          geoTeamName={geoTeam.teamName}
          fallbackTeamName={teams[0]?.shortDisplayName ?? null}
          onOpen={() => setChatOpen(true)}
          onSubmit={(msg) => {
            setInitialMessage(msg);
            setChatOpen(true);
          }}
        />
      </div>

      {simulateResponse && <SimulationDisclaimer />}

      {simulateResponse && (
        <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6">
          <ChampionshipMatchup
            team1={
              simulateResponse.standings.find((s) => s.teamId === simulateResponse.championship[0])!
            }
            team2={
              simulateResponse.standings.find((s) => s.teamId === simulateResponse.championship[1])!
            }
          />
          <ShareButton simulateResponse={simulateResponse} games={games} />
        </div>
      )}

      <Standings simulateResponse={simulateResponse} />

      <div className="flex items-center justify-between gap-4 empty:hidden">
        <ViewModeButton />
        {games.some((g) => g.completed) && <HideCompletedButton />}
        <ResetButton
          games={games}
          hasSimulationResults={!!simulateResponse}
          onReset={handleReset}
          className="ml-auto w-fit"
        />
      </div>

      <GamesList onReset={handleReset} />

      <div className="flex w-full flex-row justify-center gap-4 sm:w-auto sm:justify-between">
        <ResetButton
          games={games}
          hasSimulationResults={!!simulateResponse}
          onReset={handleReset}
          className="w-1/2 sm:w-fit"
        />
        <SimulateButton games={games} teams={teams} onSimulateComplete={handleSimulateComplete} />
      </div>

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        conferenceHint={conf}
        initialMessage={initialMessage}
        onInitialMessageSent={() => setInitialMessage(null)}
      />
    </div>
  );
};

export default ConferencePage;
