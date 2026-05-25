'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  NFL_CONFERENCES,
  NFL_DIVISIONS,
  NFL_CONFERENCE_SLUGS,
  NFL_TEAM_SLUGS,
  NFL_TEAM_BY_ESPN_ID,
  getTeamsInDivision,
  getTeamsInConference,
  type NflConference,
  type NflDivisionId,
  type NflTeamMeta,
} from '@/lib/nfl/constants';
import { useNflGames, useNflSimulate } from '@/app/hooks/useNflGames';
import { organizeGames } from '@/lib/utils/organizeGames';
import { useUIState } from '@/app/store/useUI';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { clearAllPicks, type GamePick } from '@/app/store/gamePicksSlice';
import { useSyncGamePicksWithView } from '@/app/hooks/useSyncGamePicksWithView';
import CompactGameButton from '@/app/components/CompactGameButton';
import CompactWeekGrid from '@/app/components/CompactWeekGrid';
import CompletedWeeks from '@/app/components/CompletedWeeks';
import GameCard from '@/app/components/GameCard';
import RemainingWeeks from '@/app/components/RemainingWeeks';
import ViewModeButton from '@/app/components/ViewModeButton';
import HideCompletedButton from '@/app/components/HideCompletedButton';
import ResetButton from '@/app/components/ResetButton';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Button } from '@/app/components/Button';
import type { GameLean } from '@/lib/types';
import type { NflSimulateResponse, NflStandingEntry } from '@/lib/nfl/types';

const nflTeamLogo = (abbrev: string) =>
  `https://a.espncdn.com/i/teamlogos/nfl/500/${abbrev.toLowerCase()}.png`;

type FilterScope =
  | { level: 'league' }
  | { level: 'conference'; conference: NflConference }
  | { level: 'division'; conference: NflConference; division: string; divisionId: NflDivisionId }
  | {
      level: 'team';
      conference: NflConference;
      division: string;
      divisionId: NflDivisionId;
      team: NflTeamMeta;
    };

const parseFilter = (filter?: string[]): FilterScope | null => {
  if (!filter || filter.length === 0) return { level: 'league' };

  const confSlug = filter[0];
  const conference = NFL_CONFERENCE_SLUGS[confSlug as keyof typeof NFL_CONFERENCE_SLUGS];
  if (!conference) return null;

  if (filter.length === 1) return { level: 'conference', conference };

  const divName = filter[1];
  const divisionId =
    `${conference} ${divName.charAt(0).toUpperCase() + divName.slice(1)}` as NflDivisionId;
  if (!NFL_DIVISIONS.includes(divisionId)) return null;

  if (filter.length === 2) return { level: 'division', conference, division: divName, divisionId };

  const teamSlug = filter[2];
  const teamId = NFL_TEAM_SLUGS[teamSlug];
  if (!teamId) return null;
  const team = NFL_TEAM_BY_ESPN_ID.get(teamId);
  if (!team || team.divisionId !== divisionId) return null;

  return { level: 'team', conference, division: divName, divisionId, team };
};

const filterGames = (games: GameLean[], scope: FilterScope): GameLean[] => {
  if (scope.level === 'league') return games;
  if (scope.level === 'conference') {
    const teamIds = new Set(getTeamsInConference(scope.conference).map((t) => t.espnId));
    return games.filter((g) => teamIds.has(g.home.teamId) || teamIds.has(g.away.teamId));
  }
  if (scope.level === 'division') {
    const teamIds = new Set(getTeamsInDivision(scope.divisionId).map((t) => t.espnId));
    return games.filter((g) => teamIds.has(g.home.teamId) || teamIds.has(g.away.teamId));
  }
  return games.filter(
    (g) => g.home.teamId === scope.team.espnId || g.away.teamId === scope.team.espnId
  );
};

const SeedBadge = ({ seed, isDivWinner }: { seed: number; isDivWinner: boolean }) => (
  <span
    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isDivWinner ? 'bg-primary/20 text-primary' : 'text-base-content/60 bg-base-300'}`}
  >
    {seed}
  </span>
);

const StandingRow = ({ entry }: { entry: NflStandingEntry }) => (
  <div className="flex items-center gap-3 rounded-lg px-3 py-2">
    <SeedBadge seed={entry.seed} isDivWinner={entry.isDivisionWinner} />
    <Image
      src={entry.logo || nflTeamLogo(entry.abbrev)}
      alt={entry.displayName}
      width={28}
      height={28}
      className="h-7 w-7 object-contain"
      unoptimized
    />
    <div className="flex flex-1 items-center justify-between">
      <div>
        <span className="text-sm font-semibold text-base-content">{entry.abbrev}</span>
        {entry.isDivisionWinner && (
          <span className="ml-1.5 text-[10px] font-medium uppercase text-primary">DIV</span>
        )}
      </div>
      <div className="text-right">
        <span className="text-base-content/70 text-xs">
          {entry.record.wins}-{entry.record.losses}
          {entry.record.ties > 0 ? `-${entry.record.ties}` : ''}
        </span>
        {entry.explainPosition && (
          <p className="text-base-content/40 max-w-[200px] text-[10px] leading-tight">
            {entry.explainPosition}
          </p>
        )}
      </div>
    </div>
  </div>
);

const NflBracket = ({ result, scope }: { result: NflSimulateResponse; scope: FilterScope }) => {
  const conferences =
    scope.level === 'conference' ? [scope.conference] : (['AFC', 'NFC'] as NflConference[]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-lg font-bold text-base-content">Playoff Picture</h2>
      <div
        className={`grid gap-4 ${conferences.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
      >
        {conferences.map((conf) => {
          const seeds = result.bracket[conf.toLowerCase() as 'afc' | 'nfc'];
          if (!seeds || seeds.length === 0) return null;
          return (
            <div key={conf} className="rounded-xl border border-stroke bg-base-200 p-4">
              <h3 className="text-base-content/60 mb-3 text-sm font-bold uppercase tracking-wide">
                {conf} Seeds
              </h3>
              <div className="divide-base-content/5 flex flex-col divide-y">
                {seeds.map((entry) => (
                  <StandingRow key={entry.teamId} entry={entry} />
                ))}
              </div>
              <div className="border-base-content/10 text-base-content/40 mt-2 border-t border-dashed pt-2 text-center text-[10px]">
                Seed 1 gets first-round bye
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getDivisionIds = (scope: FilterScope): NflDivisionId[] => {
  if (scope.level === 'division') return [scope.divisionId];
  if (scope.level === 'conference')
    return NFL_DIVISIONS.filter((d) => d.startsWith(scope.conference));
  return [...NFL_DIVISIONS];
};

const NflDivStandings = ({
  result,
  scope,
}: {
  result: NflSimulateResponse;
  scope: FilterScope;
}) => {
  const divIds = getDivisionIds(scope);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center text-lg font-bold text-base-content">Division Standings</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {divIds.map((divId) => {
          const standings = result.divisionStandings[divId];
          if (!standings) return null;
          return (
            <div
              key={divId}
              className="rounded-xl border border-black/5 bg-gradient-to-b from-white to-black/[0.02] p-3 dark:border-white/10 dark:from-white/20 dark:to-white/15"
            >
              <h4 className="text-base-content/50 mb-2 text-xs font-semibold uppercase tracking-wide">
                {divId}
              </h4>
              {standings.map((entry, i) => (
                <div key={entry.teamId} className="flex items-center gap-2 py-1">
                  <span className="text-base-content/40 w-4 text-center text-[10px]">{i + 1}</span>
                  <Image
                    src={entry.logo || nflTeamLogo(entry.abbrev)}
                    alt={entry.abbrev}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                    unoptimized
                  />
                  <span className="text-base-content/80 flex-1 text-xs font-medium">
                    {entry.abbrev}
                  </span>
                  <span className="text-base-content/50 text-[10px]">
                    {entry.record.wins}-{entry.record.losses}
                    {entry.record.ties > 0 ? `-${entry.record.ties}` : ''}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PageHeader = ({ scope }: { scope: FilterScope }) => {
  if (scope.level === 'team') {
    return (
      <div className="flex items-center gap-4">
        <Image
          src={nflTeamLogo(scope.team.abbrev)}
          alt={scope.team.displayName}
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
        />
        <div>
          <h1 className="text-2xl font-bold text-base-content">{scope.team.displayName}</h1>
          <p className="text-base-content/50 text-sm">{scope.team.divisionId}</p>
        </div>
      </div>
    );
  }
  if (scope.level === 'division') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-base-content">{scope.divisionId}</h1>
        <p className="text-base-content/50 text-sm">
          {getTeamsInDivision(scope.divisionId).length} teams
        </p>
      </div>
    );
  }
  if (scope.level === 'conference') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-base-content">{scope.conference}</h1>
        <p className="text-base-content/50 text-sm">
          {getTeamsInConference(scope.conference).length} teams &middot; Playoff Simulator
        </p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-2xl font-bold text-base-content">NFL</h1>
      <p className="text-base-content/50 text-sm">32 teams &middot; Playoff Simulator</p>
    </div>
  );
};

const FilterChip = ({ label, href }: { label: string; href: string }) => (
  <Link
    href={href}
    className="bg-primary/10 border-primary/20 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold text-primary transition-colors"
  >
    {label}
    <span className="text-primary/60 text-[10px]">✕</span>
  </Link>
);

const FilterOption = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="text-base-content/60 hover:bg-base-content/5 flex items-center gap-1.5 rounded-lg border border-black/5 px-3 py-1.5 text-xs font-medium transition-colors hover:text-base-content dark:border-white/10"
  >
    {children}
  </Link>
);

const FilterNav = ({ scope }: { scope: FilterScope }) => {
  const activeFilters: { label: string; removeHref: string }[] = [];
  let subFilters: React.ReactNode = null;

  if (scope.level === 'conference' || scope.level === 'division' || scope.level === 'team') {
    activeFilters.push({ label: scope.conference, removeHref: '/nfl' });
  }
  if (scope.level === 'division' || scope.level === 'team') {
    activeFilters.push({
      label: scope.divisionId.replace(`${scope.conference} `, ''),
      removeHref: `/nfl/${scope.conference.toLowerCase()}`,
    });
  }
  if (scope.level === 'team') {
    activeFilters.push({
      label: scope.team.displayName,
      removeHref: `/nfl/${scope.conference.toLowerCase()}/${scope.division}`,
    });
  }

  if (scope.level === 'league') {
    subFilters = (
      <>
        {NFL_CONFERENCES.map((conf) => (
          <FilterOption key={conf} href={`/nfl/${conf.toLowerCase()}`}>
            {conf}
          </FilterOption>
        ))}
        {NFL_DIVISIONS.map((divId) => {
          const [conf, div] = divId.split(' ');
          return (
            <FilterOption key={divId} href={`/nfl/${conf.toLowerCase()}/${div.toLowerCase()}`}>
              {divId}
            </FilterOption>
          );
        })}
      </>
    );
  } else if (scope.level === 'conference') {
    const divisions = NFL_DIVISIONS.filter((d) => d.startsWith(scope.conference));
    subFilters = divisions.map((divId) => {
      const divName = divId.replace(`${scope.conference} `, '');
      return (
        <FilterOption
          key={divId}
          href={`/nfl/${scope.conference.toLowerCase()}/${divName.toLowerCase()}`}
        >
          {divId}
        </FilterOption>
      );
    });
  } else if (scope.level === 'division') {
    const teams = getTeamsInDivision(scope.divisionId);
    subFilters = teams.map((t) => (
      <FilterOption
        key={t.espnId}
        href={`/nfl/${scope.conference.toLowerCase()}/${scope.division}/${t.abbrev.toLowerCase()}`}
      >
        <Image
          src={nflTeamLogo(t.abbrev)}
          alt={t.abbrev}
          width={16}
          height={16}
          className="h-4 w-4 object-contain"
        />
        {t.abbrev}
      </FilterOption>
    ));
  }

  return (
    <div className="flex flex-col gap-3">
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base-content/40 text-xs font-medium uppercase tracking-wide">
            Filters:
          </span>
          {activeFilters.map((f) => (
            <FilterChip key={f.label} label={f.label} href={f.removeHref} />
          ))}
          <Link
            href="/nfl"
            className="text-base-content/40 hover:text-base-content/70 ml-1 text-xs transition-colors"
          >
            Clear all
          </Link>
        </div>
      )}
      {subFilters && <div className="flex flex-wrap gap-2">{subFilters}</div>}
    </div>
  );
};

interface GameContentProps {
  isLoading: boolean;
  isError: boolean;
  isTeam: boolean;
  view: string;
  games: GameLean[];
  completedWeeks: GameLean[][];
  remainingWeeks: GameLean[][];
  onReset: () => void;
}

const GameContent = ({
  isLoading,
  isError,
  isTeam,
  view,
  games,
  completedWeeks,
  remainingWeeks,
  onReset,
}: GameContentProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="h-12 w-12" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-base-content/50 rounded-xl border border-stroke bg-base-200 p-6 text-center text-sm">
        Error loading games. Check that Redis is available.
      </div>
    );
  }

  if (isTeam) {
    if (view === 'scores') {
      return (
        <div className="flex flex-wrap gap-4">
          {games.map((game) => (
            <GameCard key={game._id} game={game} />
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        {games.map((game) => (
          <CompactGameButton key={game._id} game={game} />
        ))}
      </div>
    );
  }

  if (view === 'picks') {
    return (
      <CompactWeekGrid
        completedWeeks={completedWeeks}
        remainingWeeks={remainingWeeks}
        onReset={onReset}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CompletedWeeks weeks={completedWeeks} onReset={onReset} />
      <RemainingWeeks weeks={remainingWeeks} onReset={onReset} />
    </div>
  );
};

const getSimulateLabel = (scope: FilterScope): string => {
  if (scope.level === 'team' || scope.level === 'division') return 'Simulate Division';
  if (scope.level === 'conference') return `Simulate ${scope.conference}`;
  return 'Simulate Season';
};

const NflPage = () => {
  const params = useParams();
  const filter = params.filter as string[] | undefined;
  const scope = parseFilter(filter);
  const { games, isLoading, isError } = useNflGames();
  const { result: simResult, isLoading: simLoading, simulate } = useNflSimulate();
  const [nflResult, setNflResult] = useState<NflSimulateResponse | null>(null);
  const dispatch = useAppDispatch();
  const { view, setTheme } = useUIState();
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);

  useEffect(() => {
    if (!scope) return;
    if (scope.level === 'team') {
      setTheme(`nfl-${scope.team.abbrev.toLowerCase()}`);
    } else {
      setTheme('nfl');
    }
  }, [scope, setTheme]);

  const filteredGames = useMemo(() => (scope ? filterGames(games, scope) : []), [games, scope]);

  useSyncGamePicksWithView({ games: filteredGames, view });

  const { completedWeeks, remainingWeeks } = organizeGames(filteredGames);

  const handleSimulate = async () => {
    const overrides: Record<string, { homeScore: number; awayScore: number }> = {};
    Object.entries(gamePicks).forEach(([gameId, pick]) => {
      const gp = pick as GamePick;
      overrides[gameId] = { homeScore: gp.homeScore, awayScore: gp.awayScore };
    });
    const result = await simulate(games, 2024, overrides);
    if (result) {
      setNflResult(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setNflResult(null);
    dispatch(clearAllPicks());
  };

  if (!scope) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-base-content">Page Not Found</h1>
        <Link href="/nfl" className="text-sm font-medium text-primary hover:underline">
          Back to NFL
        </Link>
      </div>
    );
  }

  const displayResult = nflResult || simResult;

  return (
    <div className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <PageHeader scope={scope} />
      <FilterNav scope={scope} />

      {displayResult && <NflBracket result={displayResult} scope={scope} />}
      {displayResult && <NflDivStandings result={displayResult} scope={scope} />}

      <div className="flex items-center justify-between gap-4 empty:hidden">
        <ViewModeButton />
        {filteredGames.some((g) => g.completed) && <HideCompletedButton />}
        <ResetButton
          games={filteredGames}
          hasSimulationResults={!!displayResult}
          onReset={handleReset}
          className="ml-auto w-fit"
        />
      </div>

      <GameContent
        isLoading={isLoading}
        isError={isError}
        isTeam={scope.level === 'team'}
        view={view}
        games={filteredGames}
        completedWeeks={completedWeeks}
        remainingWeeks={remainingWeeks}
        onReset={handleReset}
      />

      <div className="flex w-full flex-row justify-center gap-4 sm:w-auto sm:justify-between">
        <ResetButton
          games={filteredGames}
          hasSimulationResults={!!displayResult}
          onReset={handleReset}
          className="w-1/2 sm:w-fit"
        />
        <Button
          data-testid="simulate-button"
          size="md"
          color="primary"
          onClick={handleSimulate}
          disabled={games.length === 0}
          loading={simLoading}
          className="w-1/2 text-xs sm:w-fit"
        >
          {getSimulateLabel(scope)}
        </Button>
      </div>
    </div>
  );
};

export default NflPage;
