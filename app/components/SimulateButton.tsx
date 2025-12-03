'use client';
import { useParams } from 'next/navigation';
import { useAppSelector } from '../store/hooks';
import { SimulateRequest, SimulateResponse, TieLog } from '@/lib/api-types';
import { xLog } from '@/lib/xLog';
import { GamePick } from '../store/gamePicksSlice';
import { Button } from './Button';
import { useUIState } from '../store/useUI';
import { useSimulateMutation } from '../store/apiSlice';
import { type SportSlug, type ConferenceSlug } from '@/lib/constants';

interface SimulateButtonProps {
  onSimulateComplete?: (response: SimulateResponse) => void;
}

const SimulateButton = ({ onSimulateComplete }: SimulateButtonProps) => {
  const params = useParams();
  const sport = params.sport as SportSlug;
  const conf = params.conf as ConferenceSlug;
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);
  const season = useAppSelector((state) => state.ui.season);

  const { mode } = useUIState();

  const [simulate, { isLoading }] = useSimulateMutation();

  const handleSimulate = async () => {
    if (!season) {
      xLog('Cannot simulate: season is not set');
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

    xLog('Simulate Request Payload:', payload);

    try {
      const response = await simulate({ ...payload, sport, conf, season }).unwrap();

      xLog('=== SIMULATE RESPONSE ===');
      xLog('Championship Matchup:', response.championship);
      xLog('');
      xLog('Standings:');
      response.standings.forEach((standing: { rank: number; abbrev: string; confRecord: { wins: number; losses: number }; explainPosition: string }) => {
        xLog(
          `  ${standing.rank}. ${standing.abbrev} - ${standing.confRecord.wins}-${standing.confRecord.losses} (${standing.explainPosition})`
        );
      });
      xLog('');
      if (response.tieLogs && response.tieLogs.length > 0) {
        xLog('Tie Logs:');
        response.tieLogs.forEach((tieLog: TieLog, index: number) => {
          xLog(`  Tie ${index + 1} - Teams: ${tieLog.teams.join(', ')}`);
          tieLog.steps.forEach((step: { rule: string; detail: string; survivors: string[] }) => {
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

      if (onSimulateComplete) {
        onSimulateComplete(response);
      }
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
