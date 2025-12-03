import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { GamesResponse, SimulateRequest, SimulateResponse } from '@/lib/api-types';
import { setLastUpdated } from './uiSlice';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Games', 'Standings', 'Teams'],
  endpoints: (builder) => ({
    getSeasonGameDataFromCache: builder.query<
      GamesResponse,
      {
        sport: string;
        conf: string;
        season?: number | null;
        week?: string | number;
        state?: string;
        from?: string;
        to?: string;
      }
    >({
      queryFn: async ({ sport, conf, season, week, state: gameState, from, to }) => {
        const params = new URLSearchParams();
        if (week) {
          if (!season) {
            return { error: { status: 400, data: 'Season is required when week is provided' } };
          }
          params.set('season', season.toString());
          params.set('week', week.toString());
        } else if (season) {
          params.set('season', season.toString());
        }
        if (gameState) params.set('state', gameState);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const queryString = params.toString();
        try {
          const response = await fetch(`/api/games/${sport}/${conf}${queryString ? `?${queryString}` : ''}`);
          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {}
      },
      providesTags: ['Games'],
    }),
    getSeasonGameData: builder.query<
      GamesResponse,
      {
        sport: string;
        conf: string;
        season: number;
        week?: string | number;
        state?: string;
        from?: string;
        to?: string;
        force?: boolean;
      }
    >({
      queryFn: async ({ sport, conf, season, week, state: gameState, from, to, force }) => {
        try {
          const response = await fetch(`/api/games/${sport}/${conf}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              season,
              week,
              state: gameState,
              from,
              to,
              force,
            }),
          });
          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {}
      },
      providesTags: ['Games'],
    }),
    getLiveGameData: builder.query<
      GamesResponse,
      {
        sport: string;
        conf: string;
        force?: boolean;
      }
    >({
      query: ({ sport, conf, force }) => ({
        url: `games/${sport}/${conf}/live`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          force,
        },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {}
      },
      providesTags: ['Games'],
    }),
    getSpreadData: builder.query<
      GamesResponse,
      {
        sport: string;
        conf: string;
        season: number;
        week?: string | number;
        force?: boolean;
      }
    >({
      queryFn: async ({ sport, conf, season, week, force }) => {
        try {
          const response = await fetch(`/api/games/${sport}/${conf}/spreads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              season,
              week,
              force,
            }),
          });
          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {}
      },
      providesTags: ['Games'],
    }),
    simulate: builder.mutation<
      SimulateResponse,
      { sport: string; conf: string; season: number } & SimulateRequest
    >({
      queryFn: async ({ sport, conf, season, ...request }) => {
        try {
          const response = await fetch(`/api/simulate/${sport}/${conf}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              season,
              ...request,
            }),
          });
          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: ['Standings'],
    }),
  }),
});

export const {
  useGetSeasonGameDataFromCacheQuery,
  useGetSeasonGameDataQuery,
  useLazyGetSeasonGameDataQuery,
  useGetLiveGameDataQuery,
  useGetSpreadDataQuery,
  useSimulateMutation,
} = apiSlice;
