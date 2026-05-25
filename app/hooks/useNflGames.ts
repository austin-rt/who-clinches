import { useState, useReducer, useEffect, useCallback } from 'react';
import type { GameLean, TeamMetadata } from '@/app/store/api';
import type { NflSimulateResponse } from '@/lib/nfl/types';

interface NflGamesState {
  games: GameLean[];
  teams: TeamMetadata[];
  season: number | null;
  isLoading: boolean;
  isError: boolean;
}

type GamesAction =
  | { type: 'fetch' }
  | { type: 'success'; games: GameLean[]; teams: TeamMetadata[]; season: number }
  | { type: 'error' };

const gamesReducer = (state: NflGamesState, action: GamesAction): NflGamesState => {
  switch (action.type) {
    case 'fetch':
      return { ...state, isLoading: true, isError: false };
    case 'success':
      return {
        games: action.games,
        teams: action.teams,
        season: action.season,
        isLoading: false,
        isError: false,
      };
    case 'error':
      return { ...state, isLoading: false, isError: true };
  }
};

interface NflSimulateState {
  result: NflSimulateResponse | null;
  isLoading: boolean;
}

export const useNflGames = (season: number = 2024) => {
  const [state, dispatch] = useReducer(gamesReducer, {
    games: [],
    teams: [],
    season: null,
    isLoading: true,
    isError: false,
  });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'fetch' });

    fetch(`/api/games/nfl?season=${season}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          dispatch({
            type: 'success',
            games: data.events ?? [],
            teams: data.teams ?? [],
            season: data.season ?? season,
          });
        }
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [season]);

  return state;
};

export const useNflSimulate = () => {
  const [state, setState] = useState<NflSimulateState>({
    result: null,
    isLoading: false,
  });

  const simulate = useCallback(
    async (
      games: GameLean[],
      season: number,
      overrides: Record<string, { homeScore: number; awayScore: number }>
    ) => {
      setState({ result: null, isLoading: true });
      try {
        const res = await fetch('/api/simulate/nfl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ season, games, overrides }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setState({ result: data, isLoading: false });
        return data as NflSimulateResponse;
      } catch {
        setState({ result: null, isLoading: false });
        return null;
      }
    },
    []
  );

  return { ...state, simulate };
};
