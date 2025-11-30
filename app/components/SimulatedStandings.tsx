'use client';

import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { setStandingsOpen } from '@/app/store/uiSlice';
import { SimulateResponse } from '@/lib/api-types';
import { useMemo, useEffect } from 'react';
import ChampionshipMatchup from './ChampionshipMatchup';
import StandingsExplanations from './StandingsExplanations';
import TiebreakerDetails from './TiebreakerDetails';

interface SimulatedStandingsProps {
  simulateResponse: SimulateResponse;
}

const SimulatedStandings = ({ simulateResponse }: SimulatedStandingsProps) => {
  const dispatch = useAppDispatch();
  const standingsOpen = useAppSelector((state) => state.ui.standingsOpen);

  useEffect(() => {
    dispatch(setStandingsOpen(true));
  }, [dispatch]);

  const championshipTeams = useMemo(() => {
    if (!simulateResponse?.championship) return null;
    const [team1Id, team2Id] = simulateResponse.championship;
    const team1 = simulateResponse.standings.find((s) => s.teamId === team1Id);
    const team2 = simulateResponse.standings.find((s) => s.teamId === team2Id);
    return team1 && team2 ? [team1, team2] : null;
  }, [simulateResponse]);

  const handleToggle = (checked: boolean) => {
    dispatch(setStandingsOpen(checked));
  };

  return (
    <div className="collapse collapse-arrow bg-base-200 shadow-md">
      <input
        type="checkbox"
        checked={standingsOpen}
        onChange={(e) => handleToggle(e.target.checked)}
      />
      <div className="collapse-title w-full justify-center text-base font-semibold">
        Simulated Standings
      </div>
      <div className="collapse-content">
        <div className="flex flex-col gap-4">
          {championshipTeams && (
            <ChampionshipMatchup team1={championshipTeams[0]} team2={championshipTeams[1]} />
          )}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold">Standings</div>
            <StandingsExplanations standings={simulateResponse.standings} />
          </div>
          {simulateResponse.tieLogs && <TiebreakerDetails tieLogs={simulateResponse.tieLogs} />}
        </div>
      </div>
    </div>
  );
};

export default SimulatedStandings;
