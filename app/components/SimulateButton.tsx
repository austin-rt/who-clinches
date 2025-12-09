'use client';
import { useParams } from 'next/navigation';
import { useAppSelector } from '../store/hooks';
import {
  SimulateResponse,
  SimulateRequestBody,
  useSimulateMutation,
} from '../store/api';
import {
  isValidSport,
  isValidConference,
  type SportSlug,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';
import { GamePick } from '../store/gamePicksSlice';
import { Button } from './Button';
import { useUIState } from '../store/useUI';

interface SimulateButtonProps {
  onSimulateComplete?: (response: SimulateResponse) => void;
}

const SimulateButton = ({ onSimulateComplete }: SimulateButtonProps) => {
  const params = useParams();
  const sportParam = params.sport as string;
  const confParam = params.conf as string;
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);
  const season = useAppSelector((state) => state.app.season);
  const { mode } = useUIState();
  const [simulate, { isLoading }] = useSimulateMutation();

  if (!isValidSport(sportParam) || !isValidConference(confParam)) {
    return null;
  }

  const sport = sportParam as SportSlug;
  const conf = confParam as CFBConferenceAbbreviation;

  const handleSimulate = async () => {
    if (!season) {
      return;
    }

    const overrides: SimulateRequestBody['overrides'] = {};

    Object.entries(gamePicks).forEach(([gameId, pick]) => {
      const gamePick = pick as GamePick;
      overrides[gameId] = {
        homeScore: gamePick.homeScore,
        awayScore: gamePick.awayScore,
      };
    });

    const simulateRequestBody: SimulateRequestBody = {
      season,
      overrides,
    };

    try {
      const response = await simulate({
        sport,
        conf,
        simulateRequestBody,
      }).unwrap();

      if (onSimulateComplete) {
        onSimulateComplete(response);
      }
    } catch {
      // Error handled silently
    }
  };

  const hasPicks = Object.keys(gamePicks).length > 0;

  return (
    <Button
      size="md"
      color={mode === 'dark' ? 'accent' : 'primary'}
      onClick={handleSimulate}
      disabled={!hasPicks || isLoading || season === null}
      loading={isLoading}
      className="w-1/2 text-xs sm:w-fit"
    >
      Calculate Standings
    </Button>
  );
};

export default SimulateButton;
