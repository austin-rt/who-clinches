'use client';

import GamesList from './components/GamesList';
import { SEC_CONFERENCE_ID } from '@/lib/constants';

const Home = () => {
  const currentSeason = 2025; // TODO: Get from API or make configurable

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-primary">SEC Tiebreaker Calculator</h1>
        <p className="text-base-content/70 text-lg">
          Predict game outcomes and see how they affect SEC conference standings
        </p>
      </div>

      <GamesList season={currentSeason} conferenceId={SEC_CONFERENCE_ID} />
    </div>
  );
};

export default Home;
