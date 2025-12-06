'use client';
import { useParams } from 'next/navigation';
import { useAppSelector } from '../store/hooks';
import { SimulateRequest, SimulateResponse } from '@/lib/api-types';
import { GamePick } from '../store/gamePicksSlice';
import { Button } from './Button';
import { useUIState } from '../store/useUI';
import { useSimulateMutation } from '../store/apiSlice';
import type { Conference } from 'cfbd';

interface SimulateButtonProps {
  onSimulateComplete?: (response: SimulateResponse) => void;
}

const SimulateButton = ({ onSimulateComplete }: SimulateButtonProps) => {
  const params = useParams();
  const sport = params.sport as string;
  const conf = params.conf as NonNullable<Conference['abbreviation']>;
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);
  const season = useAppSelector((state) => state.app.season);

  const { mode } = useUIState();

  const [simulate, { isLoading }] = useSimulateMutation();

  const handleSimulate = async () => {
    if (!season) {
      return;
    }

    const overrides: SimulateRequest['overrides'] = {};

    Object.entries(gamePicks).forEach(([gameId, pick]) => {
      const gamePick = pick as GamePick;
      overrides[gameId] = {
        homeScore: gamePick.homeScore,
        awayScore: gamePick.awayScore,
      };
    });

    const payload: SimulateRequest = {
      overrides,
    };

    try {
      const response = await simulate({ ...payload, sport, conf, season }).unwrap();

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
