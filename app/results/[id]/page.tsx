import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import type { Metadata } from 'next';
import type { SimulateResponse } from '@/app/store/api';
import type { TeamLean, GameLean } from '@/lib/types';
import ChampionshipMatchup from '@/app/components/ChampionshipMatchup';
import SimulatedStandings from '@/app/components/SimulatedStandings';
import { LinkButton } from '@/app/components/LinkButton';

interface SnapshotPayload {
  input: { overrides: Record<string, { homeScore: number; awayScore: number }> };
  output: SimulateResponse;
  teams: TeamLean[];
  games: GameLean[];
}

interface Props {
  params: Promise<{ id: string }>;
}

const getSnapshot = (id: string) => {
  return db.simulationSnapshot.findUnique({ where: { id } });
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { id } = await params;
  const snapshot = await getSnapshot(id);
  if (!snapshot) return { title: 'Not Found' };

  const payload = snapshot.payload as unknown as SnapshotPayload;
  const [team1Id, team2Id] = payload.output.championship;
  const team1 = payload.output.standings.find((s) => s.teamId === team1Id);
  const team2 = payload.output.standings.find((s) => s.teamId === team2Id);
  const matchup = team1 && team2 ? `${team1.abbrev} vs ${team2.abbrev}` : '';

  return {
    title: `${snapshot.conf.toUpperCase()} ${snapshot.season} Simulation | Who Clinches`,
    description: `Championship: ${matchup}. See the full simulated standings.`,
  };
};

const isNormalized = (homeScore: number, awayScore: number): boolean =>
  (homeScore === 1 && awayScore === 0) || (homeScore === 0 && awayScore === 1);

const GameResultsContent = ({
  overrides,
  games,
}: {
  overrides: Record<string, { homeScore: number; awayScore: number }>;
  games: GameLean[];
}) => {
  const gameMap = new Map(games.map((g) => [g.id, g]));
  const entries = Object.entries(overrides);
  if (entries.length === 0) return null;

  const weeks = new Map<number, { game: GameLean; homeScore: number; awayScore: number }[]>();
  for (const [gameId, scores] of entries) {
    const game = gameMap.get(gameId);
    if (!game) continue;
    const week = game.week ?? 0;
    if (!weeks.has(week)) weeks.set(week, []);
    weeks.get(week)!.push({ game, ...scores });
  }

  const sortedWeeks = Array.from(weeks.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {sortedWeeks.map(([weekNum, weekGames]) => (
        <div
          key={weekNum}
          className="flex flex-col rounded-lg border border-stroke bg-base-200 px-2"
        >
          <div className="p-2 text-xs font-semibold">Week {weekNum}</div>
          <div className="border-t border-stroke" />
          <div className="flex flex-wrap gap-1 px-1 py-3">
            {weekGames.map(({ game, homeScore, awayScore }) => {
              const normalized = isNormalized(homeScore, awayScore);
              const homeWon = homeScore > awayScore;
              const winnerColor = homeWon ? game.home.color : game.away.color;

              return (
                <div
                  key={game.id}
                  className="flex h-14 w-24 items-center justify-around rounded-lg bg-base-300 px-1"
                  style={
                    winnerColor
                      ? { backgroundColor: `${winnerColor}33`, border: `2px solid ${winnerColor}` }
                      : undefined
                  }
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-xs ${!homeWon ? 'font-black' : 'text-base-content/60'}`}>
                      {game.away.abbrev}
                    </span>
                    <span
                      className={`font-mono text-xxs ${!homeWon ? 'font-black' : 'text-base-content/70'}`}
                    >
                      {normalized ? (homeWon ? 'L' : 'W') : awayScore}
                    </span>
                  </div>
                  <span className="text-base-content/40 text-xxs">-</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`text-xs ${homeWon ? 'font-black' : 'text-base-content/60'}`}>
                      {game.home.abbrev}
                    </span>
                    <span
                      className={`font-mono text-xxs ${homeWon ? 'font-black' : 'text-base-content/70'}`}
                    >
                      {normalized ? (homeWon ? 'W' : 'L') : homeScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const ResultsPage = async ({ params }: Props) => {
  const { id } = await params;
  const snapshot = await getSnapshot(id);
  if (!snapshot) notFound();

  const payload = snapshot.payload as unknown as SnapshotPayload;
  const { output } = payload;
  const [team1Id, team2Id] = output.championship;
  const team1 = output.standings.find((s) => s.teamId === team1Id);
  const team2 = output.standings.find((s) => s.teamId === team2Id);

  return (
    <div className="container mx-auto flex min-h-full flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">
            {snapshot.conf.toUpperCase()} {snapshot.season} Simulation
          </h1>
        </div>
        <div className="hidden sm:flex sm:justify-end">
          <LinkButton.Stroked href={`/cfb/${snapshot.conf}`} target="_blank" size="md">
            Try it yourself
          </LinkButton.Stroked>
        </div>
      </div>
      <div className="flex w-full sm:hidden">
        <LinkButton.Stroked
          href={`/cfb/${snapshot.conf}`}
          target="_blank"
          size="md"
          className="w-full"
        >
          Try it yourself
        </LinkButton.Stroked>
      </div>

      {team1 && team2 && <ChampionshipMatchup team1={team1} team2={team2} />}

      <div className="collapse collapse-arrow bg-base-200 shadow-md">
        <input type="checkbox" defaultChecked />
        <div className="collapse-title w-full justify-center text-base font-semibold">
          Simulated Standings
        </div>
        <div className="collapse-content">
          <SimulatedStandings simulateResponse={output} />
        </div>
      </div>

      <div className="collapse collapse-arrow bg-base-300">
        <input type="checkbox" defaultChecked />
        <div className="collapse-title min-h-0 py-2 text-sm font-semibold">
          Simulated Game Results
        </div>
        <div className="collapse-content">
          <GameResultsContent overrides={payload.input.overrides} games={payload.games} />
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
