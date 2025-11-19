'use client';

import { useAppSelector } from '../store/hooks';
import { SimulateRequest } from '@/lib/api-types';
import { SEC_CONFERENCE_ID } from '@/lib/constants';
import { xLog } from '@/lib/xLog';
import { GamePick } from '../store/gamePicksSlice';

interface SimulateButtonProps {
  season: number;
  conferenceId?: number;
}

const SimulateButton = ({ season, conferenceId = SEC_CONFERENCE_ID }: SimulateButtonProps) => {
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);

  const handleSimulate = () => {
    // Format picks as overrides for simulate request
    // The API expects gameId (espnId) as the key
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
    <button
      type="button"
      onClick={handleSimulate}
      className="btn btn-primary"
      disabled={!hasPicks}
    >
      Simulate Standings
    </button>
  );
};

export default SimulateButton;

