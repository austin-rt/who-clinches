'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { IoChatbubblesOutline } from 'react-icons/io5';
import ChatDrawer from '@/app/components/Chat/ChatDrawer';
import ChatSearchBar from '@/app/components/Chat/ChatSearchBar';
import {
  NFL_DIVISIONS,
  NFL_CONFERENCE_SLUGS,
  NFL_TEAM_SLUGS,
  NFL_TEAM_BY_ESPN_ID,
  getTeamsInDivision,
  getTeamsInConference,
  type NflDivisionId,
} from '@/lib/nfl/constants';
import { useNflGames, useNflSimulate } from '@/app/hooks/useNflGames';
import { organizeGames } from '@/lib/utils/organizeGames';
import { useUIState } from '@/app/store/useUI';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { clearAllPicks, type GamePick } from '@/app/store/gamePicksSlice';
import { setStandingsOpen } from '@/app/store/uiSlice';
import { useSyncGamePicksWithView } from '@/app/hooks/useSyncGamePicksWithView';
import { CompactGameButton, CompactWeekGrid, GameCard } from '@/app/components/Game';
import {
  CompletedWeeks,
  RemainingWeeks,
  ViewModeButton,
  HideCompletedButton,
} from '@/app/components/Week';
import { ResetButton } from '@/app/components/Simulation';
import { LoadingSpinner } from '@/app/components/Common';
import { Button } from '@/app/components/Button';
import type { GameLean } from '@/lib/types';
import type { NflSimulateResponse } from '@/lib/nfl/types';
import type { FilterScope } from '../types';
import FilterNav from '../components/FilterNav';
import NflBracket from '../components/NflBracket';
import NflDivStandings from '../components/NflDivStandings';
import PageHeader from '../components/PageHeader';

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
  const season = useAppSelector((state) => state.app.season);
  const { result: simResult, isLoading: simLoading, simulate, reset: resetSim } = useNflSimulate();
  const [nflResult, setNflResult] = useState<NflSimulateResponse | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [forceNewChat, setForceNewChat] = useState(false);
  const persistedSessions = useAppSelector((s) => s.chat.sessions);
  const chatHistory = useAppSelector((s) => s.chat.history ?? []);
  const hasConversation =
    persistedSessions.some((s) => s.messages.length > 0) || chatHistory.length > 0;
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
    if (!season) return;

    const overrides: Record<string, { homeScore: number; awayScore: number }> = {};
    Object.entries(gamePicks).forEach(([gameId, pick]) => {
      const gp = pick as GamePick;
      overrides[gameId] = { homeScore: gp.homeScore, awayScore: gp.awayScore };
    });
    const result = await simulate(games, season, overrides);
    if (result) {
      setNflResult(result);
      dispatch(setStandingsOpen(true));
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleReset = () => {
    setNflResult(null);
    resetSim();
    dispatch(clearAllPicks());
  };

  if (!scope) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <h1 data-testid="nfl-error-heading" className="text-2xl font-bold text-base-content">
          Page Not Found
        </h1>
        <Link href="/nfl" className="text-sm font-medium text-primary hover:underline">
          Back to NFL
        </Link>
      </div>
    );
  }

  const displayResult = nflResult || simResult;

  return (
    <>
      <div className="container mx-auto flex min-h-full flex-col gap-8 px-4 py-8">
        <PageHeader scope={scope} />
        <ChatSearchBar
          onOpen={() => {
            setForceNewChat(true);
            setChatOpen(true);
          }}
          onSubmit={(msg) => {
            setForceNewChat(true);
            setInitialMessage(msg);
            setChatOpen(true);
          }}
        />
        <FilterNav scope={scope} />

        {displayResult && (
          <div data-testid="nfl-bracket">
            <NflBracket result={displayResult} scope={scope} />
          </div>
        )}
        {displayResult && (
          <div data-testid="nfl-standings">
            <NflDivStandings result={displayResult} scope={scope} />
          </div>
        )}

        <div className="flex items-center justify-between gap-4 empty:hidden">
          <ViewModeButton />
          {completedWeeks.length > 0 && <HideCompletedButton />}
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
            disabled={season === null || games.length === 0}
            loading={simLoading}
            className="w-1/2 text-xs sm:w-fit"
          >
            {getSimulateLabel(scope)}
          </Button>
        </div>
      </div>

      {hasConversation && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="chat-tab fixed right-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center justify-center rounded-l-xl px-2.5 py-10 shadow-lg transition-opacity hover:opacity-90"
          aria-label="Reopen chat"
        >
          <IoChatbubblesOutline className="h-4 w-4" />
        </button>
      )}

      <ChatDrawer
        open={chatOpen}
        onClose={() => {
          setChatOpen(false);
          setInitialMessage(null);
          setForceNewChat(false);
        }}
        conferenceHint="NFL"
        initialMessage={initialMessage}
        onInitialMessageSent={() => setInitialMessage(null)}
        onMessageSent={() => {}}
        forceNewChat={forceNewChat}
      />
    </>
  );
};

export default NflPage;
