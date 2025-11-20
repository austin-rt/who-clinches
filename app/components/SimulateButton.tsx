'use client';

import { useAppSelector } from '../store/hooks';
import { SimulateRequest } from '@/lib/api-types';
import { SEC_CONFERENCE_ID } from '@/lib/constants';
import { xLog } from '@/lib/xLog';
import { GamePick } from '../store/gamePicksSlice';
import { Button } from './Button';
import { useUIState } from '../store/useUI';
import { useSimulateMutation } from '../store/apiSlice';

interface SimulateButtonProps {
  season: number;
  conferenceId?: number;
}

const SimulateButton = ({ season, conferenceId = SEC_CONFERENCE_ID }: SimulateButtonProps) => {
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);

  const { mode } = useUIState();

  const [simulate, { isLoading }] = useSimulateMutation();

  const handleSimulate = async () => {
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

    try {
      const response = await simulate(payload).unwrap();

      // Format response for readable testing
      xLog('=== SIMULATE RESPONSE ===');
      xLog('Championship Matchup:', response.championship);
      xLog('');
      xLog('Standings:');
      response.standings.forEach((standing) => {
        xLog(
          `  ${standing.rank}. ${standing.abbrev} - ${standing.confRecord.wins}-${standing.confRecord.losses} (${standing.explainPosition})`
        );
      });
      xLog('');
      if (response.tieLogs && response.tieLogs.length > 0) {
        xLog('Tie Logs:');
        response.tieLogs.forEach((tieLog, index) => {
          xLog(`  Tie ${index + 1} - Teams: ${tieLog.teams.join(', ')}`);
          tieLog.steps.forEach((step) => {
            xLog(`    Rule ${step.rule}: ${step.detail}`);
            xLog(`    Survivors: ${step.survivors.join(', ')}`);
          });
        });
      } else {
        xLog('Tie Logs: None');
      }
      xLog('');
      xLog('Full Response JSON:', JSON.stringify(response, null, 2));
      xLog('=== END SIMULATE RESPONSE ===');
    } catch (err) {
      xLog('=== SIMULATE ERROR ===');
      xLog('Error:', err);
      if (err && typeof err === 'object' && 'data' in err) {
        xLog('Error Data:', err.data);
      }
      xLog('=== END SIMULATE ERROR ===');
    }
  };

  const hasPicks = Object.keys(gamePicks).length > 0;

  return (
    <Button.Stroked
      color={mode === 'dark' ? 'accent' : 'primary'}
      onClick={handleSimulate}
      disabled={!hasPicks || isLoading}
      loading={isLoading}
    >
      Simulate Standings
    </Button.Stroked>
  );
};

export default SimulateButton;
