'use client';

import { useAppSelector } from '../store/hooks';
import { SimulateRequest } from '@/lib/api-types';
import { SEC_CONFERENCE_ID } from '@/lib/constants';
import { xLog } from '@/lib/xLog';
import { GamePick } from '../store/gamePicksSlice';
import { Button } from './Button';
import { useUIState } from '../store/useUI';

interface SimulateButtonProps {
  season: number;
  conferenceId?: number;
}

const SimulateButton = ({ season, conferenceId = SEC_CONFERENCE_ID }: SimulateButtonProps) => {
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);

  const { mode } = useUIState();

  const handleSimulate = () => {
    const overrides: SimulateRequest['overrides'] = {};

    Object.entries(gamePicks).forEach(([gameId, pick]) => {
      const gamePick = pick as GamePick;
      overrides[gameId] = {
        homeScore: gamePick.homeScore,
        awayScore: gamePick.awayScore,
      };
    });

    const payload: SimulateRequest = {
      season,
      conferenceId: conferenceId.toString(),
      overrides,
    };

    xLog('Simulate Request Payload:', payload);
  };

  const hasPicks = Object.keys(gamePicks).length > 0;

  return (
    <Button.Stroked
      color={mode === 'dark' ? 'accent' : 'primary'}
      onClick={handleSimulate}
      disabled={!hasPicks}
    >
      Simulate Standings
    </Button.Stroked>
  );
};

export default SimulateButton;
